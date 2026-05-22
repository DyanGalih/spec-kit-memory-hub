import chalk from "chalk";
import { Command } from "commander";
import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";
import { auditMemoryCache } from "../audit";
import { loadConfig, resolveProjectPaths } from "../config";
import { closeDatabase, countEntries, countEntriesBySourceType, loadIndexingState, openDatabase } from "../db";
import { indexPhase1MemoryFiles } from "../indexing";
import { indexDocFiles } from "../indexing/docs";
import { registerMemoryEntry } from "../indexing/registration";
import { searchMemoryEntries } from "../retrieval";
import { searchDocEntries } from "../retrieval/docs";
import { generateMemorySynthesis, writeMemorySynthesis } from "../synthesis";
import { writeDocSynthesis } from "../synthesis/docs";
import { pathExists, removePath } from "../utils/fs";
import { sha256 } from "../utils/hash";
import { findProjectRoot } from "../utils/root";
import { freeTokenizer } from "../utils/tokens";
import {
  compareSearchFlowTokens,
  compareSynthesisFlowTokens,
  printTokenComparisonBanner,
  shouldShowTokenBanner,
} from "./token-report";
import { runMcpServer } from "../mcp/server";
import { migrateMemoryFiles } from "./migrate";

interface CliOptions {
  projectRoot: string;
}

function createContext(projectRoot: string) {
  const config = loadConfig(projectRoot);
  const paths = resolveProjectPaths(projectRoot, config);
  const db = openDatabase(paths.dbPath);
  return { config, paths, db };
}

async function ensureIndexedMemory(projectRoot: string, db: any, config: ReturnType<typeof loadConfig>): Promise<void> {
  if (countEntriesBySourceType(db, "memory") > 0) {
    return;
  }
  console.log("No cached memory found; indexing durable memory first.");
  await indexPhase1MemoryFiles(projectRoot, db, config, {
    refreshOnly: false,
    removeDeleted: true,
  });
}

function printHeader(title: string): void {
  console.log(chalk.bold(title));
}

function printKeyValue(label: string, value: string | number): void {
  console.log(`${chalk.cyan(label)} ${value}`);
}

function formatResultRow(index: number, sourcePath: string, heading: string, score: number, summary: string): string {
  const paddedScore = score.toFixed(3).padStart(8);
  return `${String(index + 1).padStart(2)}. ${paddedScore}  ${sourcePath} :: ${heading}\n    ${summary}`;
}

async function runIndexMemory(projectRoot: string, refreshOnly = false): Promise<void> {
  console.log(refreshOnly ? "Refreshing memory index..." : "Indexing memory files...");
  const { config, db } = createContext(projectRoot);
  try {
    const result = await indexPhase1MemoryFiles(projectRoot, db, config, {
      refreshOnly,
      removeDeleted: true,
    });
    console.log(
      refreshOnly
        ? `Refreshed ${result.indexedFiles} files (${result.indexedEntries} entries, ${result.deletedFiles} deleted)`
        : `Indexed ${result.indexedFiles} files (${result.indexedEntries} entries)`,
    );
  } finally {
    closeDatabase(db);
    freeTokenizer();
  }
}

async function runSearchMemory(projectRoot: string, query: string): Promise<void> {
  const { config, db } = createContext(projectRoot);
  try {
    await ensureIndexedMemory(projectRoot, db, config);
    const results = searchMemoryEntries(db, query, config);
    printHeader(`Search results for: ${query}`);
    if (results.length === 0) {
      console.log(chalk.yellow("No results found."));
    }

    results.forEach((result, index) => {
      console.log(
        formatResultRow(
          index,
          result.source_path,
          result.section_heading ?? path.basename(result.source_path),
          result.score,
          result.content_summary ?? result.snippet ?? "",
        ),
      );
    });
    if (shouldShowTokenBanner(config)) {
      const comparison = await compareSearchFlowTokens(projectRoot, db, config, query);
      console.log();
      printTokenComparisonBanner(comparison);
    }
  } finally {
    closeDatabase(db);
    freeTokenizer();
  }
}

async function runSynthesize(projectRoot: string, featurePath: string, query?: string): Promise<void> {
  console.log("Generating memory synthesis...");
  const { config, db } = createContext(projectRoot);
  try {
    await ensureIndexedMemory(projectRoot, db, config);
    const synthesis = await writeMemorySynthesis(db, projectRoot, featurePath, config, query);
    console.log(`Wrote ${path.relative(projectRoot, synthesis.outputPath)} (${synthesis.words} words, ${synthesis.sourceItems.length} source items)`);
    if (shouldShowTokenBanner(config)) {
      const comparison = await compareSynthesisFlowTokens(projectRoot, config, synthesis.content);
      console.log();
      printTokenComparisonBanner(comparison);
    }
  } finally {
    closeDatabase(db);
    freeTokenizer();
  }
}

async function runAuditMemory(projectRoot: string): Promise<void> {
  console.log("Auditing memory cache...");
  const { config, db } = createContext(projectRoot);
  try {
    const report = await auditMemoryCache(db, projectRoot, undefined, config);
    printHeader("Memory Audit");
    printKeyValue("Issues:", report.issues.length);
    printKeyValue("Stale entries:", report.staleCount);
    printKeyValue("Missing files:", report.missingCount);
    printKeyValue("Orphaned rows:", report.orphanedCount);
    if (report.issues.length === 0) {
      console.log(chalk.green("No cache issues found."));
      return;
    }

    for (const issue of report.issues) {
      console.log(
        `${chalk.red(issue.severity)} ${issue.file}\n  ${issue.issue}\n  ${chalk.gray(issue.recommendation)}\n`,
      );
    }
  } finally {
    closeDatabase(db);
    freeTokenizer();
  }
}

async function runRebuildMemory(projectRoot: string): Promise<void> {
  console.log("Rebuilding memory cache...");
  const { config, paths, db } = createContext(projectRoot);
  try {
    closeDatabase(db);
    if (await pathExists(paths.dbPath)) {
      await removePath(paths.dbPath);
    }
    const rebuiltDb = openDatabase(paths.dbPath);
    try {
      const result = await indexPhase1MemoryFiles(projectRoot, rebuiltDb, config, {
        refreshOnly: false,
        removeDeleted: true,
      });
      console.log(`Rebuilt cache from ${result.indexedFiles} files (${result.indexedEntries} entries)`);
    } finally {
      closeDatabase(rebuiltDb);
    }
  } finally {
    freeTokenizer();
  }
}

function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const clean = answer.trim().toLowerCase();
      resolve(clean === "y" || clean === "yes");
    });
  });
}

async function runFlushMemory(projectRoot: string): Promise<void> {
  console.log("Flushing local memory cache...");
  const { paths, db } = createContext(projectRoot);
  try {
    closeDatabase(db);
    // Issue 8 fix: also remove WAL and SHM sibling files to avoid orphaned SQLite journal files
    const walPath = paths.dbPath + "-wal";
    const shmPath = paths.dbPath + "-shm";
    if (await pathExists(paths.dbPath)) {
      await removePath(paths.dbPath);
      console.log(`Successfully flushed local memory cache at ${paths.dbPath}`);
    } else {
      console.log("No local database cache exists to flush.");
    }
    if (await pathExists(walPath)) await removePath(walPath);
    if (await pathExists(shmPath)) await removePath(shmPath);
  } finally {
    freeTokenizer();
  }
}

async function runFlushGlobal(): Promise<void> {
  const globalDbPath = path.join(os.homedir(), ".spec-kit", "shared-memory.sqlite");
  if (!fs.existsSync(globalDbPath)) {
    console.log("No global shared memory database cache exists to flush.");
    return;
  }

  console.log(chalk.red.bold("\n⚠️  WARNING: FLUSH GLOBAL SHARED MEMORY"));
  console.log(`This will delete ALL shared memories and lessons across ALL projects stored in:\n  ${globalDbPath}\n`);
  
  const confirmed = await askConfirmation(chalk.yellow("Are you absolutely sure you want to proceed? This action CANNOT be undone. (y/N): "));
  if (!confirmed) {
    console.log(chalk.green("Action cancelled. Global shared memory remains untouched."));
    return;
  }

  try {
    fs.unlinkSync(globalDbPath);
    if (fs.existsSync(`${globalDbPath}-wal`)) {
      fs.unlinkSync(`${globalDbPath}-wal`);
    }
    if (fs.existsSync(`${globalDbPath}-shm`)) {
      fs.unlinkSync(`${globalDbPath}-shm`);
    }
    console.log(chalk.green.bold("✅ Successfully flushed and deleted the global shared memory cache database."));
  } catch (error: any) {
    console.error(chalk.red(`Failed to flush global shared memory cache: ${error.message}`));
  }
}

async function runTokenReport(projectRoot: string, featurePath: string): Promise<void> {
  const { config, db } = createContext(projectRoot);
  try {
    await ensureIndexedMemory(projectRoot, db, config);
    const featureRoot = path.resolve(projectRoot, featurePath);

    const synthesis = await generateMemorySynthesis(db, projectRoot, featurePath, config);
    printHeader(`Token report for ${path.relative(projectRoot, featureRoot)}`);
    if (shouldShowTokenBanner(config)) {
      const comparison = await compareSynthesisFlowTokens(projectRoot, config, synthesis.content);
      printTokenComparisonBanner(comparison);
    } else {
      console.log("Token banner hidden by config.");
    }
    console.log(chalk.gray("This is an estimated token count, not guaranteed provider billing usage."));
  } finally {
    closeDatabase(db);
    freeTokenizer();
  }
}

async function runRegisterMemory(
  projectRoot: string,
  options: { id: string; title: string; tags: string; file: string; status: string; content?: string; prepend?: boolean }
): Promise<void> {
  console.log(`Registering memory entry: ${options.id} | ${options.title}`);
  if (options.content) {
    const mode = options.prepend ? "prepend (newest-first)" : "append (chronological)";
    console.log(`  Writing entry content to ${options.file} via Node.js [${mode}] (LLM file-edit bypassed).`);
  }
  const { config, db } = createContext(projectRoot);
  try {
    await registerMemoryEntry(projectRoot, db, config, options);
    console.log("Successfully registered and synchronized memory index.");
  } finally {
    closeDatabase(db);
    freeTokenizer();
  }
}

async function runIndexDocs(projectRoot: string, refreshOnly = false): Promise<void> {
  console.log(refreshOnly ? "Refreshing doc index..." : "Indexing development docs...");
  const { config, db } = createContext(projectRoot);
  try {
    const result = await indexDocFiles(projectRoot, db, config, {
      refreshOnly,
      removeDeleted: true,
    });
    console.log(
      refreshOnly
        ? `Refreshed ${result.indexedFiles} doc files (${result.indexedEntries} entries, ${result.deletedFiles} deleted, ${result.skippedFiles} unchanged)`
        : `Indexed ${result.indexedFiles} doc files (${result.indexedEntries} entries, ${result.skippedFiles} skipped)`,
    );
  } finally {
    closeDatabase(db);
    freeTokenizer();
  }
}

async function runSearchDocs(
  projectRoot: string,
  query: string,
  featureId?: string,
  artifactType?: string,
): Promise<void> {
  const { config, db } = createContext(projectRoot);
  try {
    const results = searchDocEntries(db, query, config, { featureId, artifactType });
    printHeader(`Doc search results for: ${query}${featureId ? ` [feature:${featureId}]` : ""}${artifactType ? ` [type:${artifactType}]` : ""}`);
    if (results.length === 0) {
      console.log(chalk.yellow("No results found. Run 'npx speckit-memory index-docs' first."));
      return;
    }
    results.forEach((result, index) => {
      console.log(
        formatResultRow(
          index,
          result.source_path,
          result.section_heading ?? path.basename(result.source_path),
          result.score,
          result.content_summary ?? result.snippet ?? "",
        ),
      );
    });
  } finally {
    closeDatabase(db);
    freeTokenizer();
  }
}

async function runSynthesizeDocs(projectRoot: string, featurePath: string): Promise<void> {
  console.log("Generating doc synthesis...");
  const { config, db } = createContext(projectRoot);
  try {
    const synthesis = await writeDocSynthesis(db, projectRoot, featurePath, config);
    console.log(
      `Wrote ${path.relative(projectRoot, synthesis.outputPath)} (${synthesis.words} words, ${synthesis.sourceFiles.length} source files)`,
    );
    if (synthesis.sourceFiles.length === 0) {
      console.log(chalk.yellow("No doc entries found in cache. Run 'npx speckit-memory index-docs' first."));
    }
  } finally {
    closeDatabase(db);
    freeTokenizer();
  }
}

async function runAuditDocs(projectRoot: string): Promise<void> {
  console.log("Auditing doc cache...");
  const { config, db } = createContext(projectRoot);

  try {
    const docCount = countEntriesBySourceType(db, "doc");
    printHeader("Doc Cache Audit");
    printKeyValue("Indexed doc entries:", docCount);

    if (docCount === 0) {
      console.log(chalk.yellow("Doc cache is empty. Run 'npx speckit-memory index-docs' to populate it."));
      return;
    }

    const docState = loadIndexingState(db, "doc");

    let staleCount = 0;
    let missingCount = 0;
    for (const row of docState) {
      const fullPath = path.resolve(projectRoot, row.source_path);
      if (!fs.existsSync(fullPath)) {
        missingCount += 1;
        console.log(chalk.red("  ✗ Missing:") + ` ${row.source_path}`);
      } else {
        const current = fs.readFileSync(fullPath, "utf-8");
        if (sha256(current) !== row.hash) {
          staleCount += 1;
          console.log(chalk.yellow("  ! Stale:  ") + ` ${row.source_path}`);
        }
      }
    }

    printKeyValue("Stale files:", staleCount);
    printKeyValue("Missing files:", missingCount);

    if (staleCount > 0) {
      console.log(chalk.gray("  Run 'npx speckit-memory refresh-docs' to resync stale entries."));
    }
    if (staleCount === 0 && missingCount === 0) {
      console.log(chalk.green("  ✓ Doc cache is in sync with source files."));
    }
  } finally {
    closeDatabase(db);
    freeTokenizer();
  }
}

async function runDoctor(projectRoot: string): Promise<void> {
  let errors = 0;
  let warnings = 0;

  const pass = (msg: string) => console.log(chalk.green("  ✓") + " " + msg);
  const warn = (msg: string, hint?: string) => { console.log(chalk.yellow("  !") + " " + msg); if (hint) console.log(chalk.gray("    " + hint)); warnings++; };
  const fail = (msg: string, hint?: string) => { console.log(chalk.red("  ✗") + " " + msg); if (hint) console.log(chalk.gray("    " + hint)); errors++; };
  const section = (title: string) => console.log("\n" + chalk.bold(chalk.cyan(title)));

  console.log(chalk.bold("Spec Kit Memory Hub — Doctor"));
  console.log("Project root: " + projectRoot);

  // 1. Node.js version
  section("1. Runtime");
  const [major] = process.versions.node.split(".").map(Number);
  if (major >= 18) {
    pass(`Node.js ${process.version} (>=18 required)`);
  } else {
    fail(`Node.js ${process.version} — requires >=18`, "Upgrade Node.js: https://nodejs.org");
  }

  // 2. Config file
  section("2. Configuration");
  const configPath = path.join(projectRoot, ".specify", "extensions", "memory-md", "config.yml");
  if (fs.existsSync(configPath)) {
    pass("Config file found (.specify/extensions/memory-md/config.yml)");
    const config = loadConfig(projectRoot);
    if (config.optimizer?.engine === "sqlite" || !config.optimizer) {
      pass("SQLite acceleration active");
    }
  } else {
    warn(
      "Config file not found — using built-in defaults",
      "Run /speckit.memory-md.init to create .specify/extensions/memory-md/config.yml"
    );
  }

  // 3. Memory files
  section("3. Memory Files");
  const config = loadConfig(projectRoot);
  const paths = resolveProjectPaths(projectRoot, config);
  const indexPath = path.join(projectRoot, config.memory_root, "INDEX.md");

  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, "utf-8");
    const entryRows = (indexContent.match(/^\|/gm) ?? []).length;
    pass(`docs/memory/INDEX.md found (~${entryRows} table row(s))`);
    if (entryRows > 55) {
      warn(
        `INDEX.md has ${entryRows} table rows — target is 20–50`,
        "Run /speckit.memory-md.audit to identify stale or duplicate entries"
      );
    }
  } else {
    warn(
      "docs/memory/INDEX.md not found",
      "Run /speckit.memory-md.init to initialize memory structure"
    );
  }

  const memoryFiles = ["DECISIONS.md", "ARCHITECTURE.md", "BUGS.md", "WORKLOG.md", "PROJECT_CONTEXT.md"];
  for (const file of memoryFiles) {
    const filePath = path.join(projectRoot, config.memory_root, file);
    if (fs.existsSync(filePath)) {
      pass(`${config.memory_root}/${file} found`);
    } else {
      warn(`${config.memory_root}/${file} not found`, "Run /speckit.memory-md.init to create it");
    }
  }

  // 4. SQLite Cache
  section("4. SQLite Cache");
  if (fs.existsSync(paths.dbPath)) {
    pass(`SQLite cache found (${path.relative(projectRoot, paths.dbPath)})`);
    try {
      const db = openDatabase(paths.dbPath);
      const count = countEntries(db);
      closeDatabase(db);
      if (count > 0) {
        pass(`Cache contains ${count} indexed entr${count === 1 ? "y" : "ies"}`);
      } else {
        warn("Cache is empty — run 'npx speckit-memory index-memory' to populate it");
      }
    } catch {
      fail("SQLite cache exists but could not be opened", "Run 'npx speckit-memory rebuild-memory' to reset it");
    }
  } else {
    warn(
      "SQLite cache not found — memory commands will index automatically on first run",
      `Expected at: ${path.relative(projectRoot, paths.dbPath)}`
    );
  }

  // 5. Spec Kit structure
  section("5. Spec Kit Structure");
  if (fs.existsSync(path.join(projectRoot, ".specify"))) {
    pass(".specify/ directory found");
  } else {
    fail(".specify/ directory missing — run 'specify init' to bootstrap Spec Kit");
  }

  if (fs.existsSync(path.join(projectRoot, "specs"))) {
    pass("specs/ directory found");
  } else {
    warn("specs/ directory not found — expected for Spec Kit feature workflows");
  }

  // Summary
  console.log("\n" + chalk.bold("─── Summary " + "─".repeat(42)));
  if (errors > 0) {
    console.log(chalk.red(`  ✗ ${errors} error(s) — resolve before using Memory Hub`));
  }
  if (warnings > 0) {
    console.log(chalk.yellow(`  ! ${warnings} warning(s) — recommended to address`));
  }
  if (errors === 0 && warnings === 0) {
    console.log(chalk.green("  ✓ All checks passed — Memory Hub is ready"));
  } else if (errors === 0) {
    console.log(chalk.green("  ✓ No blocking errors — Memory Hub can run"));
  }

  process.exitCode = errors > 0 ? 1 : 0;
}

export async function runCli(argv = process.argv): Promise<void> {
  const program = new Command();
  program
    .name("speckit-memory")
    .description("Local SQLite optimizer for Spec Kit Memory Hub")
    .option("--project-root <path>", "project root to operate on", findProjectRoot())
    .helpOption("-h, --help", "display help for command");

  program
    .command("index-memory")
    .description("Index durable memory files into SQLite")
    .action(async () => {
      const options = program.opts<CliOptions>();
      await runIndexMemory(options.projectRoot, false);
    });

  program
    .command("search-memory <query>")
    .description("Search indexed durable memory")
    .action(async (query: string) => {
      const options = program.opts<CliOptions>();
      await runSearchMemory(options.projectRoot, query);
    });

  program
    .command("synthesize")
    .requiredOption("--feature <path>", "feature directory, for example specs/001-auth")
    .option("--query <text>", "optional search query to override automatic feature query")
    .description("Generate memory-synthesis.md for a feature")
    .action(async (options: { feature: string; query?: string }) => {
      const cliOptions = program.opts<CliOptions>();
      await runSynthesize(cliOptions.projectRoot, options.feature, options.query);
    });

  program
    .command("refresh-memory")
    .description("Incrementally reindex changed durable memory files")
    .action(async () => {
      const options = program.opts<CliOptions>();
      await runIndexMemory(options.projectRoot, true);
    });

  program
    .command("rebuild-memory")
    .description("Delete and rebuild the SQLite cache from markdown memory")
    .action(async () => {
      const options = program.opts<CliOptions>();
      await runRebuildMemory(options.projectRoot);
    });

  program
    .command("audit-memory")
    .description("Audit the SQLite cache and synthesized memory")
    .action(async () => {
      const options = program.opts<CliOptions>();
      await runAuditMemory(options.projectRoot);
    });

  program
    .command("token-report")
    .requiredOption("--feature <path>", "feature directory, for example specs/001-auth")
    .description("Compare estimated token usage between baseline and optimized flows")
    .action(async (options: { feature: string }) => {
      const cliOptions = program.opts<CliOptions>();
      await runTokenReport(cliOptions.projectRoot, options.feature);
    });

  program
    .command("flush-memory")
    .description("Clear the local SQLite cache without reindexing")
    .action(async () => {
      const options = program.opts<CliOptions>();
      await runFlushMemory(options.projectRoot);
    });

  program
    .command("migrate-memory")
    .description("Migrate legacy monolithic memory files to the new flat date-based format")
    .action(async () => {
      const options = program.opts<CliOptions>();
      await migrateMemoryFiles(options.projectRoot);
    });

  program
    .command("flush-global")
    .description("Delete the global central shared memory cache database across all projects (requires confirmation)")
    .action(async () => {
      await runFlushGlobal();
    });

  program
    .command("doctor")
    .description("Validate environment, config, and optimizer prerequisites")
    .action(async () => {
      const options = program.opts<CliOptions>();
      await runDoctor(options.projectRoot);
    });

  program
    .command("mcp-start")
    .description("Start the Model Context Protocol (MCP) server for Spec Kit Memory Hub")
    .action(async () => {
      await runMcpServer();
    });

  program
    .command("register-memory")
    .description("Register a new memory entry and sync with INDEX.md")
    .requiredOption("--id <id>", "stable ID (e.g., A3, B1)")
    .requiredOption("--title <text>", "short descriptive title")
    .requiredOption("--tags <csv>", "comma-separated keywords")
    .requiredOption("--file <relpath>", "relative path to detail file (e.g., ARCHITECTURE.md)")
    .option("--status <type>", "active, deprecated, or superseded", "active")
    .option(
      "--content <markdown>",
      "Complete formatted markdown entry body, including the '### YYYY-MM-DD - Title' heading. " +
      "Node.js appends it to <file> directly behind a '---' separator — the LLM does not need to read or rewrite the target file.",
    )
    .option(
      "--prepend",
      "Insert entry before the first existing ### entry instead of appending at EOF. Use for WORKLOG (newest-first convention).",
    )
    .action(async (cmdOptions) => {
      const options = program.opts<CliOptions>();
      await runRegisterMemory(options.projectRoot, cmdOptions);
    });

  // ---------------------------------------------------------------------------
  // Phase 2: Cache Development Docs
  // ---------------------------------------------------------------------------

  program
    .command("index-docs")
    .description("Index development docs (specs, plans, tasks, constitutions, READMEs) into SQLite")
    .action(async () => {
      const options = program.opts<CliOptions>();
      await runIndexDocs(options.projectRoot, false);
    });

  program
    .command("refresh-docs")
    .description("Incrementally reindex changed development docs (skips unchanged files)")
    .action(async () => {
      const options = program.opts<CliOptions>();
      await runIndexDocs(options.projectRoot, true);
    });

  program
    .command("search-docs <query>")
    .description("Search indexed development docs")
    .option("--feature <id>", "filter results to a specific feature folder name")
    .option("--type <artifact>", "filter by artifact type: spec, plan, tasks, constitution, architecture, security, readme, doc")
    .action(async (query: string, cmdOptions: { feature?: string; type?: string }) => {
      const cliOptions = program.opts<CliOptions>();
      await runSearchDocs(cliOptions.projectRoot, query, cmdOptions.feature, cmdOptions.type);
    });

  program
    .command("synthesize-docs")
    .requiredOption("--feature <path>", "feature directory, for example specs/001-auth")
    .description("Generate doc-synthesis.md for a feature from the indexed doc cache")
    .action(async (options: { feature: string }) => {
      const cliOptions = program.opts<CliOptions>();
      await runSynthesizeDocs(cliOptions.projectRoot, options.feature);
    });

  program
    .command("audit-docs")
    .description("Report doc cache stats: entry count, stale files, and index coverage")
    .action(async () => {
      const options = program.opts<CliOptions>();
      await runAuditDocs(options.projectRoot);
    });

  // Phase 3 (MCP integration & cross-project memory sharing): implemented via mcp-start, flush-memory, flush-global.
  // Phase 4 (index-code, search-code): documented in docs/optimizer-roadmap.md, not yet implemented.

  await program.parseAsync(argv);
}
