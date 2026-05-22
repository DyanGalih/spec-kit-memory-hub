import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import path from "path";
import fs from "fs";
import os from "os";
import { openDatabase, closeDatabase, countEntriesBySourceType, loadIndexingState } from "../db";
import { indexPhase1MemoryFiles } from "../indexing";
import { indexDocFiles } from "../indexing/docs";
import { repairMemoryIndex } from "../indexing/index-repair";
import { registerMemoryEntry } from "../indexing/registration";
import { searchMemoryEntries } from "../retrieval";
import { searchDocEntries } from "../retrieval/docs";
import { openSharedDatabase, upsertSharedEntry, searchSharedEntries, SharedMemoryEntry } from "../db/shared";
import { generateMemorySynthesis, writeMemorySynthesis } from "../synthesis";
import { writeDocSynthesis } from "../synthesis/docs";
import { auditMemoryCache } from "../audit";
import { compareSynthesisFlowTokens } from "../cli/token-report";
import { loadConfig, resolveProjectPaths } from "../config";
import { findProjectRoot } from "../utils/root";
import { sha256 } from "../utils/hash";
import YAML from "yaml";
import { z } from "zod";

// Helper to get the shared database path (e.g. ~/.spec-kit/shared-memory.sqlite)
function getGlobalDbPath(): string {
  return path.join(os.homedir(), ".spec-kit", "shared-memory.sqlite");
}

class MemoryHubMcpServer {
  private server: McpServer;

  constructor() {
    this.server = new McpServer({
      name: "speckit-memory-hub",
      version: "0.9.7",
    });

    this.setupTools();

    // Error handling
    this.server.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };
  }

  private setupTools() {
    // 1. Search local memory
    this.server.registerTool(
      "speckit_memory_search",
      {
        description: "Search the local project's SQLite memory cache and knowledge indexing.",
        inputSchema: z.object({
          query: z.string().describe("Search term or semantic query"),
          projectRoot: z.string().optional().describe("Optional absolute path to the project root directory"),
        }),
      },
      async (args: any) => {
        const resolvedRoot = args.projectRoot || findProjectRoot() || process.cwd();
        const query = args.query;
        const config = loadConfig(resolvedRoot);
        const paths = resolveProjectPaths(resolvedRoot, config);
        const db = openDatabase(paths.dbPath);

        try {
          if (countEntriesBySourceType(db, "memory") === 0) {
            console.error("No cached memory found; automatically indexing durable memory files first.");
            await indexPhase1MemoryFiles(resolvedRoot, db, config, {
              refreshOnly: false,
              removeDeleted: true,
            });
          }
          const results = searchMemoryEntries(db, query, config, config.retrieval?.max_memory_results ?? 10);
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: true,
                  results: results.map((r) => ({
                    id: r.id,
                    source_path: r.source_path,
                    section_heading: r.section_heading,
                    content_summary: r.content_summary ?? r.snippet,
                    score: r.score,
                  })),
                }, null, 2),
              },
            ],
          };
        } finally {
          closeDatabase(db);
        }
      }
    );

    // 2. Synthesize memory
    this.server.registerTool(
      "speckit_memory_synthesize",
      {
        description: "Generate memory-synthesis.md for a specific feature scoping relevant decisions and bugs.",
        inputSchema: z.object({
          feature: z.string().describe("Feature directory name or path (e.g., 'specs/001-auth')"),
          query: z.string().optional().describe("Optional search query to customize the synthesis context retrieval"),
          projectRoot: z.string().optional().describe("Optional absolute path to the project root directory"),
        }),
      },
      async (args: any) => {
        const resolvedRoot = args.projectRoot || findProjectRoot() || process.cwd();
        const feature = args.feature;
        const query = args.query;
        const config = loadConfig(resolvedRoot);
        const paths = resolveProjectPaths(resolvedRoot, config);
        const db = openDatabase(paths.dbPath);

        try {
          if (countEntriesBySourceType(db, "memory") === 0) {
            console.error("No cached memory found; automatically indexing durable memory files first.");
            await indexPhase1MemoryFiles(resolvedRoot, db, config, {
              refreshOnly: false,
              removeDeleted: true,
            });
          }
          const result = await writeMemorySynthesis(db, resolvedRoot, feature, config, query);
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: true,
                  message: `Successfully synthesized memory for feature '${feature}'.`,
                  outputPath: path.relative(resolvedRoot, result.outputPath),
                  wordsCount: result.words,
                  sourceItemsCount: result.sourceItems.length,
                }, null, 2),
              },
            ],
          };
        } finally {
          closeDatabase(db);
        }
      }
    );

    this.server.registerTool(
      "speckit_memory_refresh_cache",
      {
        description: "Refresh the local SQLite cache from markdown source files without requiring shell or CLI commands.",
        inputSchema: z.object({
          scope: z.enum(["memory", "docs", "all"]).optional().describe("Cache scope to refresh. Defaults to all."),
          projectRoot: z.string().optional().describe("Optional absolute path to the project root directory"),
        }),
      },
      async (args: any) => {
        const resolvedRoot = args.projectRoot || findProjectRoot() || process.cwd();
        const scope = args.scope || "all";
        const config = loadConfig(resolvedRoot);
        const paths = resolveProjectPaths(resolvedRoot, config);
        const db = openDatabase(paths.dbPath);

        try {
          const result: any = { success: true, scope };
          if (scope === "memory" || scope === "all") {
            result.memory = await indexPhase1MemoryFiles(resolvedRoot, db, config, {
              refreshOnly: true,
              removeDeleted: true,
            });
          }
          if (scope === "docs" || scope === "all") {
            result.docs = await indexDocFiles(resolvedRoot, db, config, {
              refreshOnly: true,
              removeDeleted: true,
            });
          }
          return {
            content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
          };
        } finally {
          closeDatabase(db);
        }
      }
    );

    this.server.registerTool(
      "speckit_memory_rebuild_cache",
      {
        description: "Rebuild selected SQLite cache scopes from markdown source files. Markdown remains the source of truth.",
        inputSchema: z.object({
          scope: z.enum(["memory", "docs", "all"]).optional().describe("Cache scope to rebuild. Defaults to all."),
          projectRoot: z.string().optional().describe("Optional absolute path to the project root directory"),
        }),
      },
      async (args: any) => {
        const resolvedRoot = args.projectRoot || findProjectRoot() || process.cwd();
        const scope = args.scope || "all";
        const config = loadConfig(resolvedRoot);
        const paths = resolveProjectPaths(resolvedRoot, config);
        const db = openDatabase(paths.dbPath);

        try {
          const result: any = { success: true, scope };
          if (scope === "memory" || scope === "all") {
            result.memory = await indexPhase1MemoryFiles(resolvedRoot, db, config, {
              refreshOnly: false,
              removeDeleted: true,
            });
          }
          if (scope === "docs" || scope === "all") {
            result.docs = await indexDocFiles(resolvedRoot, db, config, {
              refreshOnly: false,
              removeDeleted: true,
            });
          }
          return {
            content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
          };
        } finally {
          closeDatabase(db);
        }
      }
    );

    this.server.registerTool(
      "speckit_memory_audit_cache",
      {
        description: "Audit local SQLite cache integrity for memory and/or doc cache scopes.",
        inputSchema: z.object({
          scope: z.enum(["memory", "docs", "all"]).optional().describe("Cache scope to audit. Defaults to all."),
          projectRoot: z.string().optional().describe("Optional absolute path to the project root directory"),
        }),
      },
      async (args: any) => {
        const resolvedRoot = args.projectRoot || findProjectRoot() || process.cwd();
        const scope = args.scope || "all";
        const config = loadConfig(resolvedRoot);
        const paths = resolveProjectPaths(resolvedRoot, config);
        const db = openDatabase(paths.dbPath);

        try {
          const result: any = { success: true, scope };
          if (scope === "memory" || scope === "all") {
            result.memory = await auditMemoryCache(db, resolvedRoot, undefined, config);
          }
          if (scope === "docs" || scope === "all") {
            const state = loadIndexingState(db, "doc");
            let staleCount = 0;
            let missingCount = 0;
            for (const row of state) {
              const fullPath = path.resolve(resolvedRoot, row.source_path);
              if (!fs.existsSync(fullPath)) {
                missingCount += 1;
                continue;
              }
              const currentHash = sha256(fs.readFileSync(fullPath, "utf-8"));
              if (currentHash !== row.hash) {
                staleCount += 1;
              }
            }
            result.docs = {
              indexedEntries: countEntriesBySourceType(db, "doc"),
              indexedFiles: state.length,
              staleCount,
              missingCount,
            };
          }
          return {
            content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
          };
        } finally {
          closeDatabase(db);
        }
      }
    );

    this.server.registerTool(
      "speckit_memory_search_docs",
      {
        description: "Search the local project's SQLite doc cache without opening full markdown files.",
        inputSchema: z.object({
          query: z.string().describe("Search term or semantic query"),
          featureId: z.string().optional().describe("Optional feature folder filter, e.g. 001-auth"),
          artifactType: z.string().optional().describe("Optional artifact type filter, e.g. spec, plan, tasks, constitution"),
          projectRoot: z.string().optional().describe("Optional absolute path to the project root directory"),
        }),
      },
      async (args: any) => {
        const resolvedRoot = args.projectRoot || findProjectRoot() || process.cwd();
        const config = loadConfig(resolvedRoot);
        const paths = resolveProjectPaths(resolvedRoot, config);
        const db = openDatabase(paths.dbPath);

        try {
          if (countEntriesBySourceType(db, "doc") === 0) {
            await indexDocFiles(resolvedRoot, db, config, {
              refreshOnly: false,
              removeDeleted: true,
            });
          }
          const results = searchDocEntries(db, args.query, config, {
            featureId: args.featureId,
            artifactType: args.artifactType,
          });
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                results: results.map((r) => ({
                  id: r.id,
                  source_path: r.source_path,
                  section_heading: r.section_heading,
                  content_summary: r.content_summary ?? r.snippet,
                  score: r.score,
                })),
              }, null, 2),
            }],
          };
        } finally {
          closeDatabase(db);
        }
      }
    );

    this.server.registerTool(
      "speckit_memory_synthesize_docs",
      {
        description: "Generate doc-synthesis.md for a feature from the indexed doc cache.",
        inputSchema: z.object({
          feature: z.string().describe("Feature directory name or path (e.g., 'specs/001-auth')"),
          projectRoot: z.string().optional().describe("Optional absolute path to the project root directory"),
        }),
      },
      async (args: any) => {
        const resolvedRoot = args.projectRoot || findProjectRoot() || process.cwd();
        const config = loadConfig(resolvedRoot);
        const paths = resolveProjectPaths(resolvedRoot, config);
        const db = openDatabase(paths.dbPath);

        try {
          if (countEntriesBySourceType(db, "doc") === 0) {
            await indexDocFiles(resolvedRoot, db, config, {
              refreshOnly: false,
              removeDeleted: true,
            });
          }
          const result = await writeDocSynthesis(db, resolvedRoot, args.feature, config);
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                outputPath: path.relative(resolvedRoot, result.outputPath),
                wordsCount: result.words,
                sourceFilesCount: result.sourceFiles.length,
              }, null, 2),
            }],
          };
        } finally {
          closeDatabase(db);
        }
      }
    );

    this.server.registerTool(
      "speckit_memory_register",
      {
        description: "Register a human-approved durable memory entry, update INDEX.md, and refresh the SQLite cache.",
        inputSchema: z.object({
          id: z.string().describe("Stable ID, e.g. A3, B1, D4, W2"),
          title: z.string().describe("Short descriptive title"),
          tags: z.string().describe("Comma-separated keywords"),
          file: z.string().describe("Memory file path relative to memory root, e.g. DECISIONS.md"),
          status: z.string().optional().describe("Entry status. Defaults to active."),
          content: z.string().optional().describe("Complete markdown entry body including the ### heading"),
          prepend: z.boolean().optional().describe("Prepend before the first entry, useful for WORKLOG.md"),
          projectRoot: z.string().optional().describe("Optional absolute path to the project root directory"),
        }),
      },
      async (args: any) => {
        const resolvedRoot = args.projectRoot || findProjectRoot() || process.cwd();
        const config = loadConfig(resolvedRoot);
        const paths = resolveProjectPaths(resolvedRoot, config);
        const db = openDatabase(paths.dbPath);

        try {
          await registerMemoryEntry(resolvedRoot, db, config, {
            id: args.id,
            title: args.title,
            tags: args.tags,
            file: args.file,
            status: args.status || "active",
            content: args.content,
            prepend: args.prepend,
          });
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                message: `Registered memory entry ${args.id}.`,
              }, null, 2),
            }],
          };
        } finally {
          closeDatabase(db);
        }
      }
    );

    this.server.registerTool(
      "speckit_memory_repair_index",
      {
        description: "Recover missing docs/memory/INDEX.md routing rows from durable markdown entries without deleting existing rows.",
        inputSchema: z.object({
          apply: z.boolean().optional().describe("When false, only report proposed rows. When true, append missing rows to INDEX.md."),
          projectRoot: z.string().optional().describe("Optional absolute path to the project root directory"),
        }),
      },
      async (args: any) => {
        const resolvedRoot = args.projectRoot || findProjectRoot() || process.cwd();
        const config = loadConfig(resolvedRoot);
        const paths = resolveProjectPaths(resolvedRoot, config);
        const db = openDatabase(paths.dbPath);

        try {
          const result = await repairMemoryIndex(resolvedRoot, db, config, args.apply === true);
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                ...result,
              }, null, 2),
            }],
          };
        } finally {
          closeDatabase(db);
        }
      }
    );

    this.server.registerTool(
      "speckit_memory_token_report",
      {
        description: "Compare estimated tokens between full durable memory reads and optimized memory synthesis.",
        inputSchema: z.object({
          feature: z.string().describe("Feature directory name or path (e.g., 'specs/001-auth')"),
          projectRoot: z.string().optional().describe("Optional absolute path to the project root directory"),
        }),
      },
      async (args: any) => {
        const resolvedRoot = args.projectRoot || findProjectRoot() || process.cwd();
        const config = loadConfig(resolvedRoot);
        const paths = resolveProjectPaths(resolvedRoot, config);
        const db = openDatabase(paths.dbPath);

        try {
          if (countEntriesBySourceType(db, "memory") === 0) {
            await indexPhase1MemoryFiles(resolvedRoot, db, config, {
              refreshOnly: false,
              removeDeleted: true,
            });
          }
          const synthesis = await generateMemorySynthesis(db, resolvedRoot, args.feature, config);
          const comparison = await compareSynthesisFlowTokens(resolvedRoot, config, synthesis.content);
          return {
            content: [{
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                feature: args.feature,
                ...comparison,
              }, null, 2),
            }],
          };
        } finally {
          closeDatabase(db);
        }
      }
    );

    // 3. Share local lesson to global memory
    this.server.registerTool(
      "speckit_memory_share_lesson",
      {
        description: "Promote an approved local technical/architectural lesson from docs/memory into the global cross-project shared memory.",
        inputSchema: z.object({
          id: z.string().describe("Unique lesson ID (e.g. L12, A2)"),
          title: z.string().describe("Descriptive title of the lesson"),
          content: z.string().describe("Durable lesson content detailing context, decision, and mitigations"),
          tags: z.array(z.string()).optional().describe("Array of search keywords"),
          language: z.string().describe("The targeted programming language (e.g., 'php', 'typescript', 'go')"),
          framework: z.string().optional().describe("The optional targeted framework (e.g., 'laravel', 'nestjs', 'nextjs')"),
        }),
      },
      async (args: any) => {
        const resolvedRoot = findProjectRoot() || process.cwd();
        const { id, title, content, tags, language, framework } = args;
        const globalDbPath = getGlobalDbPath();
        const db = openSharedDatabase(globalDbPath);

        try {
          const entry: SharedMemoryEntry = {
            id,
            title,
            content,
            language: language.toLowerCase(),
            framework: framework ? framework.toLowerCase() : undefined,
            tags: tags ? tags.join(",") : undefined,
            source_project: path.basename(resolvedRoot),
            source_project_hash: sha256(resolvedRoot),
            status: "active",
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          };

          upsertSharedEntry(db, entry);

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: true,
                  message: `Successfully shared lesson '${id}' in global cache under channel '${language}${framework ? "/" + framework : ""}'.`,
                  id,
                  title,
                }, null, 2),
              },
            ],
          };
        } finally {
          db.close();
        }
      }
    );

    // 4. Sync shared memory
    this.server.registerTool(
      "speckit_memory_sync_shared",
      {
        description: "Retrieve and sync matching framework/language specific lessons from global shared memory into this project's memory cache.",
        inputSchema: z.object({
          projectRoot: z.string().optional().describe("Optional absolute path to the project root directory"),
        }),
      },
      async (args: any) => {
        const resolvedRoot = args.projectRoot || findProjectRoot() || process.cwd();
        const globalDbPath = getGlobalDbPath();
        if (!fs.existsSync(globalDbPath)) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: true,
                  message: "No shared memory cache found globally. Elevate some lessons first using speckit_memory_share_lesson.",
                  syncedCount: 0,
                }, null, 2),
              },
            ],
          };
        }

        const config = loadConfig(resolvedRoot);
        const projectProfile = config.project_profile;
        const language = projectProfile?.language;
        const framework = projectProfile?.framework;

        if (!language) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: false,
                  message: "This project technical profile is not configured. Run speckit_memory_init_project first.",
                }, null, 2),
              },
            ],
          };
        }

        const sharedDb = openSharedDatabase(globalDbPath);
        let matchingLessons: SharedMemoryEntry[] = [];
        try {
          const currentHash = sha256(resolvedRoot);
          const allMatching = searchSharedEntries(sharedDb, "", language, framework);
          matchingLessons = allMatching.filter((l) => l.source_project_hash !== currentHash);
        } finally {
          sharedDb.close();
        }

        if (matchingLessons.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: true,
                  message: `No external lessons found in global cache for profile: language=${language}, framework=${framework || "none"}.`,
                  syncedCount: 0,
                }, null, 2),
              },
            ],
          };
        }

        const localConfig = loadConfig(resolvedRoot);
        const localPaths = resolveProjectPaths(resolvedRoot, localConfig);
        const sharedLessonsPath = path.join(localPaths.memoryRoot, "SHARED_LESSONS.md");

        const now = new Date().toISOString().slice(0, 10);
        const header = [
          `# Shared Lessons — Synced ${now}`,
          ``,
          `> These lessons were synced from the global cross-project memory.`,
          `> **Review carefully before adopting.** Delete entries that do not apply to this project.`,
          ``,
        ].join("\n");

        const lessonsMarkdown = matchingLessons.map((l) => [
          `---`,
          ``,
          `### ${l.id} — ${l.title}`,
          ``,
          `**Stack**: \`${l.language}${l.framework ? "/" + l.framework : ""}\`  `,
          `**Tags**: ${l.tags || "none"}  `,
          `**Source**: \`proj-${l.source_project_hash ? l.source_project_hash.slice(0, 8) : "unknown"}\``,
          ``,
          l.content,
          ``,
        ].join("\n")).join("\n");

        fs.mkdirSync(path.dirname(sharedLessonsPath), { recursive: true });
        fs.writeFileSync(sharedLessonsPath, header + lessonsMarkdown, "utf-8");

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                message: `Synced ${matchingLessons.length} external lessons from global memory into your local review file.`,
                outputPath: path.relative(resolvedRoot, sharedLessonsPath),
                syncedCount: matchingLessons.length,
                profile: { language, framework },
                nextSteps: "Review SHARED_LESSONS.md and move any relevant entries into ARCHITECTURE.md or DECISIONS.md, then delete the file.",
              }, null, 2),
            },
          ],
        };
      }
    );

    // 5. Initialize/Profile project technical stack
    this.server.registerTool(
      "speckit_memory_init_project",
      {
        description: "Profile and initialize Memory Hub technical stack configuration (language & framework interrogation) for cross-project sharing.",
        inputSchema: z.object({
          language: z.string().describe("Programming language to profile (e.g., 'php', 'typescript', 'go')"),
          framework: z.string().optional().describe("Optional web framework to profile (e.g., 'laravel', 'nestjs')"),
          projectRoot: z.string().optional().describe("Optional absolute path to the project root directory"),
        }),
      },
      async (args: any) => {
        const resolvedRoot = args.projectRoot || findProjectRoot() || process.cwd();
        const { language, framework } = args;
        const configPath = path.join(resolvedRoot, ".specify", "extensions", "memory-md", "config.yml");

        let currentConfig: any = {};
        if (fs.existsSync(configPath)) {
          currentConfig = YAML.parse(fs.readFileSync(configPath, "utf-8"));
        }

        currentConfig.project_profile = {
          language: language.toLowerCase(),
          framework: framework ? framework.toLowerCase() : undefined,
          shared_memory: {
            enabled: true,
            sync_channels: [
              "global",
              language.toLowerCase(),
              ...(framework ? [framework.toLowerCase()] : []),
            ],
          },
        };

        fs.mkdirSync(path.dirname(configPath), { recursive: true });
        fs.writeFileSync(configPath, YAML.stringify(currentConfig), "utf-8");

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: true,
                message: `Configured project tech stack profile: language=${language}, framework=${framework || "none"}. Saved configuration to config.yml.`,
                profile: currentConfig.project_profile,
              }, null, 2),
            },
          ],
        };
      }
    );
  }

  public async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Spec Kit Memory Hub MCP server running on stdio.");
  }
}

export async function runMcpServer() {
  const server = new MemoryHubMcpServer();
  await server.start();
}
