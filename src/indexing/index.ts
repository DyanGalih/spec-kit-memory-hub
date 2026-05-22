import path from "path";
import { promises as fs } from "fs";
import fg from "fast-glob";
import { loadConfig, resolveProjectPaths } from "../config";
import { MemoryDatabase, deleteSourceEntries, loadIndexingStateMap, upsertIndexedFile } from "../db";
import { MemoryEntryRecord, MemoryHubConfig, ParsedChunk } from "../types";
import { pathExists, readTextFile } from "../utils/fs";
import { normalizeWhitespace } from "../utils/text";
import { parseMarkdownFile } from "./markdown";
import { shortId, sha256 } from "../utils/hash";

const PHASE1_MEMORY_FILES = new Set([
  "INDEX.md",
  "PROJECT_CONTEXT.md",
  "ARCHITECTURE.md",
  "DECISIONS.md",
  "BUGS.md",
  "WORKLOG.md",
  "constitution.md",
  "architecture_constitution.md",
]);

export interface IndexMemoryOptions {
  refreshOnly?: boolean;
  removeDeleted?: boolean;
}

export interface IndexMemoryResult {
  scannedFiles: number;
  indexedFiles: number;
  skippedFiles: number;
  deletedFiles: number;
  indexedEntries: number;
}

export async function discoverPhase1MemoryFiles(projectRoot: string, config: MemoryHubConfig): Promise<string[]> {
  const patterns = config.indexing.include.memory.length > 0 ? config.indexing.include.memory : ["docs/memory/**/*.md"];
  const files = await fg(patterns, {
    cwd: projectRoot,
    absolute: false,
    dot: true,
    onlyFiles: true,
    ignore: config.indexing.exclude,
  });

  return files.filter((filePath) => {
    const baseName = path.basename(filePath);
    return PHASE1_MEMORY_FILES.has(baseName) || /^\d{4}-\d{2}-\d{2}/.test(baseName);
  });
}

export async function indexPhase1MemoryFiles(
  projectRoot: string,
  db: MemoryDatabase,
  config: MemoryHubConfig = loadConfig(projectRoot),
  options: IndexMemoryOptions = {},
): Promise<IndexMemoryResult> {
  const { memoryRoot } = resolveProjectPaths(projectRoot, config);
  const allowedFiles = await discoverPhase1MemoryFiles(projectRoot, config);
  const stateMap = loadIndexingStateMap(db, "memory");
  const now = new Date().toISOString();
  const result: IndexMemoryResult = {
    scannedFiles: allowedFiles.length,
    indexedFiles: 0,
    skippedFiles: 0,
    deletedFiles: 0,
    indexedEntries: 0,
  };

  const seenPaths = new Set<string>();

  for (const relPath of allowedFiles) {
    seenPaths.add(relPath);
    const fullPath = path.resolve(projectRoot, relPath);
    const raw = await readTextFile(fullPath);
    const hash = sha256(raw);
    const existing = stateMap.get(relPath);
    if (options.refreshOnly && existing?.hash === hash) {
      result.skippedFiles += 1;
      continue;
    }

    const chunks = parseMarkdownFile(relPath, raw).map((chunk) => chunkToEntry(projectRoot, relPath, chunk, now));
    upsertIndexedFile(db, relPath, "memory", hash, now, chunks);
    result.indexedFiles += 1;
    result.indexedEntries += chunks.length;
  }

  if (options.removeDeleted !== false) {
    const missingPaths = [...stateMap.keys()].filter((sourcePath) => !seenPaths.has(sourcePath));
    for (const sourcePath of missingPaths) {
      deleteSourceEntries(db, sourcePath, "memory");
      result.deletedFiles += 1;
    }
  }

  // If configured memory files are missing entirely, make that visible without failing indexing.
  if (allowedFiles.length === 0 && (await pathExists(memoryRoot))) {
    return result;
  }

  return result;
}

export function chunkToEntry(projectRoot: string, relPath: string, chunk: ParsedChunk, now: string): MemoryEntryRecord {
  const id = shortId([relPath, chunk.section_heading, chunk.line_start, chunk.line_end, chunk.hash].join("|"));
  const tagsList = [...chunk.tags];
  if (relPath.startsWith(".specify/memory/")) {
    tagsList.push("governance");
  }
  const tags = tagsList.join(",");

  return {
    id,
    source_path: relPath,
    source_type: "memory",
    section_heading: chunk.section_heading,
    content_summary: chunk.summary,
    snippet: chunk.snippet,
    tags,
    hash: chunk.hash,
    line_start: chunk.line_start,
    line_end: chunk.line_end,
    updated_at: now,
    created_at: now,
    status: "active", // Default status
  };
}

export function buildSearchQuery(query: string): string {
  const terms = normalizeWhitespace(query)
    .toLowerCase()
    .match(/\b[\p{L}\p{N}_-]+\b/gu) ?? [];
  return terms.length > 0 ? terms.join(" ") : query.trim();
}
