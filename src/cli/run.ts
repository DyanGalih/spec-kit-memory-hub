import fs from "fs";
import path from "path";
import chalk from "chalk";
import { Command } from "commander";
import { loadConfig, resolveProjectPaths } from "../config";
import { closeDatabase, countEntries, openDatabase } from "../db";
import { auditMemoryCache } from "../audit";
import { discoverPhase1MemoryFiles, indexPhase1MemoryFiles } from "../indexing";
import { searchMemoryEntries } from "../retrieval";
import { generateMemorySynthesis, writeMemorySynthesis } from "../synthesis";
import { registerMemoryEntry } from "../indexing/registration";
import { estimateTokens, freeTokenizer } from "../utils/tokens";
import { pathExists, readTextFile, removePath } from "../utils/fs";
import { findProjectRoot } from "../utils/root";

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
  if (countEntries(db) > 0) {
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

async function runSynthesize(projectRoot: string, featurePath: string, query?: string): Promise<void> {
  console.log("Generating memory synthesis...");
  const { config, db } = createContext(projectRoot);
  try {
    await ensureIndexedMemory(projectRoot, db, config);
    const synthesis = await writeMemorySynthesis(db, projectRoot, featurePath, config, query);
    console.log(`Wrote ${path.relative(projectRoot, synthesis.outputPath)} (${synthesis.words} words, ${synthesis.sourceItems.length} source items)`);
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

async function runTokenReport(projectRoot: string, featurePath: string): Promise<void> {
  const { config, db } = createContext(projectRoot);
  try {
    await ensureIndexedMemory(projectRoot, db, config);
    const { memoryRoot, specsRoot } = resolveProjectPaths(projectRoot, config);
    const featureRoot = path.resolve(projectRoot, featurePath);
    const featureSpecPath = path.join(featureRoot, "spec.md");
    const featureMemoryPath = path.join(featureRoot, config.feature_memory_filename);
    const featureSpec = (await pathExists(featureSpecPath)) ? await readTextFile(featureSpecPath) : "";
    const featureMemory = (await pathExists(featureMemoryPath)) ? await readTextFile(featureMemoryPath) : "";

    const memoryFiles = await discoverPhase1MemoryFiles(projectRoot, config);
    const baselineSources = await Promise.all(
      memoryFiles.map(async (relPath) => ({
        path: relPath,
        content: await readTextFile(path.resolve(projectRoot, relPath)),
      })),
    );
    const baselineTokens = baselineSources.reduce((sum, file) => sum + estimateTokens(file.content), 0);

    const selectedResults = searchMemoryEntries(db, [featureSpec, featureMemory, path.basename(featureRoot)].join("\n"), config);
    const selectedTexts = selectedResults.map((entry) =>
      [entry.source_path, entry.section_heading, entry.content_summary, entry.snippet, entry.tags].filter(Boolean).join("\n"),
    );
    const indexTokens = estimateTokens(
      baselineSources.find((file) => path.basename(file.path) === "INDEX.md")?.content ?? "",
    );
    const selectedTokens = selectedTexts.reduce((sum, text) => sum + estimateTokens(text), 0) + indexTokens;

    const synthesis = await generateMemorySynthesis(db, projectRoot, featurePath, config);
    const synthesisTokens = estimateTokens(synthesis.content);

    const avoidedFiles = baselineSources
      .map((file) => ({
        file: file.path,
        tokens: estimateTokens(file.content),
      }))
      .filter((file) => !selectedResults.some((entry) => file.file === entry.source_path))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 3);

    printHeader(`Token report for ${path.relative(projectRoot, featureRoot)}`);
    printKeyValue("Baseline:", `${baselineTokens.toLocaleString()} estimated tokens`);
    printKeyValue("Optimized (index + selected entries):", `${selectedTokens.toLocaleString()} estimated tokens`);
    printKeyValue("Final synthesis:", `${synthesisTokens.toLocaleString()} estimated tokens`);
    if (baselineTokens > 0) {
      const reduction = ((1 - synthesisTokens / baselineTokens) * 100).toFixed(1);
      printKeyValue("Reduction:", `${reduction}%`);
    }
    console.log(chalk.gray("This is an estimated token count, not guaranteed provider billing usage."));
    console.log(chalk.bold("\nLargest avoided files:"));
    for (const file of avoidedFiles) {
      console.log(`- ${file.file} (${file.tokens.toLocaleString()} tokens)`);
    }
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
    .description("[planned] Clear the SQLite cache without reindexing")
    .action(() => {
      console.log("flush-memory is planned but not yet implemented. Use rebuild-memory to clear and reindex.");
    });

  program
    .command("doctor")
    .description("[planned] Validate environment, config, and optimizer prerequisites")
    .action(() => {
      console.log("doctor is planned but not yet implemented. Verify: Node.js >= 18, npm available, better-sqlite3 installed.");
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

  // Phase 2/3 commands (index-docs, search-docs, index-code, search-code, etc.) are
  // documented in docs/optimizer-roadmap.md but not yet implemented.

  await program.parseAsync(argv);
}
