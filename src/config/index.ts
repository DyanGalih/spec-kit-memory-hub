import fs from "fs";
import path from "path";
import YAML from "yaml";
import { MemoryHubConfig } from "../types";

const DEFAULT_CONFIG: MemoryHubConfig = {
  memory_root: "docs/memory",
  specs_root: "specs",
  feature_memory_filename: "memory.md",
  memory_synthesis_filename: "memory-synthesis.md",
  show_token_banner: true,
  require_memory_synthesis_before_plan: true,
  require_memory_review_before_verify: true,
  use_project_copilot_instructions: true,
  definition_of_done_includes_memory_review: true,
  retrieval: {
    max_index_entries: 20,
    max_memory_results: 10,
    max_doc_results: 10,
    max_code_results: 10,
    max_decisions: 5,
    max_architecture_constraints: 5,
    max_accepted_deviations: 3,
    max_security_constraints: 3,
    max_bug_patterns: 3,
    max_worklog_items: 2,
    max_synthesis_words: 900,
    full_memory_read_allowed: false,
    full_scan_allowed: false,
  },
  optimizer: {
    enabled: false,
    engine: "sqlite",
    db_path: ".spec-kit-memory/memory.sqlite",
    auto_index_on_memory_change: true,
    auto_index_on_doc_change: false,
    auto_index_on_code_change: false,
    auto_generate_synthesis: false,
  },
  indexing: {
    include: {
      memory: [
        "docs/memory/INDEX.md",
        "docs/memory/PROJECT_CONTEXT.md",
        "docs/memory/ARCHITECTURE.md",
        "docs/memory/DECISIONS.md",
        "docs/memory/BUGS.md",
        "docs/memory/WORKLOG.md",
        ".specify/memory/constitution.md",
        ".specify/memory/architecture_constitution.md",
        ".specify/memory/DECISIONS.md",
        ".specify/memory/BUGS.md"
      ],
      // Phase 2/3 patterns (docs/code) are placeholders and currently ignored by the Phase 1 optimizer.
      docs: ["docs/**/*.md", "specs/**/*.md", "README.md"],
      code: ["src/**/*.{ts,tsx,js,jsx}"],
    },
    exclude: ["node_modules/**", "dist/**", "build/**", "coverage/**", ".git/**", ".spec-kit-memory/**"],
  },
};

function mergeDeep<T>(base: T, override: unknown): T {
  if (override === null || override === undefined) {
    return base;
  }
  if (Array.isArray(base) || Array.isArray(override) || typeof base !== "object" || typeof override !== "object") {
    return override as T;
  }

  const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    const baseValue = (base as Record<string, unknown>)[key];
    result[key] = mergeDeep(baseValue as never, value);
  }
  return result as T;
}

function readYamlFile(targetPath: string): unknown | null {
  if (!fs.existsSync(targetPath)) {
    return null;
  }
  const raw = fs.readFileSync(targetPath, "utf8");
  return YAML.parse(raw) as unknown;
}

export function loadConfig(projectRoot: string): MemoryHubConfig {
  const explicitConfigPath = path.join(projectRoot, ".specify", "extensions", "memory-md", "config.yml");
  const templateConfigPath = path.join(projectRoot, "config-template.yml");
  const rawConfig = readYamlFile(explicitConfigPath) ?? readYamlFile(templateConfigPath);
  return mergeDeep(DEFAULT_CONFIG, rawConfig ?? {});
}

export function getDefaultConfig(): MemoryHubConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as MemoryHubConfig;
}

export function resolveProjectPaths(projectRoot: string, config: MemoryHubConfig) {
  return {
    projectRoot,
    memoryRoot: path.resolve(projectRoot, config.memory_root),
    specsRoot: path.resolve(projectRoot, config.specs_root),
    dbPath: path.resolve(projectRoot, config.optimizer.db_path),
  };
}
