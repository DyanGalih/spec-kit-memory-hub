import fs from "fs";
import path from "path";
import { loadConfig, resolveProjectPaths } from "../config";
import { loadAllEntries, MemoryDatabase, loadIndexingState } from "../db";
import { pathExists, readTextFile } from "../utils/fs";
import { wordCount } from "../utils/text";

export interface AuditIssue {
  id: string;
  file: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  issue: string;
  recommendation: string;
}

export interface AuditReport {
  issues: AuditIssue[];
  synthesisFiles: Array<{ path: string; words: number }>;
  staleCount: number;
  missingCount: number;
  orphanedCount: number;
}

export async function auditMemoryCache(
  db: MemoryDatabase,
  projectRoot: string,
  featurePath?: string,
  config = loadConfig(projectRoot),
): Promise<AuditReport> {
  const { memoryRoot, specsRoot } = resolveProjectPaths(projectRoot, config);
  const issues: AuditIssue[] = [];
  const entries = loadAllEntries(db);
  const state = loadIndexingState(db);

  let staleCount = 0;
  let missingCount = 0;
  let orphanedCount = 0;

  for (const row of state) {
    const fullPath = path.resolve(projectRoot, row.source_path);
    if (!(await pathExists(fullPath))) {
      missingCount += 1;
      issues.push({
        id: `M${issues.length + 1}`,
        file: row.source_path,
        severity: "HIGH",
        issue: "Indexing state points to a missing source file",
        recommendation: "Remove the stale cache rows and reindex the file if it returns.",
      });
      continue;
    }

    const fileHash = await hashFile(fullPath);
    if (fileHash !== row.hash) {
      staleCount += 1;
      issues.push({
        id: `M${issues.length + 1}`,
        file: row.source_path,
        severity: "HIGH",
        issue: "Indexing state hash does not match the current file",
        recommendation: "Run refresh-memory or rebuild-memory to resync the cache.",
      });
    }
  }

  for (const entry of entries) {
    const fullPath = path.resolve(projectRoot, entry.source_path);
    if (!(await pathExists(fullPath))) {
      orphanedCount += 1;
      issues.push({
        id: `M${issues.length + 1}`,
        file: entry.source_path,
        severity: "MEDIUM",
        issue: "Orphaned DB row references a deleted source file",
        recommendation: "Remove orphaned rows during refresh or rebuild.",
      });
    }
  }

  const synthesisFiles = await collectSynthesisFiles(specsRoot);
  for (const synthesisFile of synthesisFiles) {
    if (synthesisFile.words > config.retrieval.max_synthesis_words) {
      issues.push({
        id: `M${issues.length + 1}`,
        file: path.relative(projectRoot, synthesisFile.path),
        severity: "MEDIUM",
        issue: `memory-synthesis.md exceeds the configured budget (${synthesisFile.words} words)`,
        recommendation: "Trim synthesis output or raise the configured synthesis word limit.",
      });
    }
  }

  const duplicateKeys = findDuplicateEntries(entries);
  for (const duplicate of duplicateKeys) {
    issues.push({
      id: `M${issues.length + 1}`,
      file: duplicate,
      severity: "LOW",
      issue: "Potential duplicate memory entries detected",
      recommendation: "Review the duplicated source sections and consolidate if necessary.",
    });
  }

  return {
    issues,
    synthesisFiles: synthesisFiles.map((file) => ({ path: path.relative(projectRoot, file.path), words: file.words })),
    staleCount,
    missingCount,
    orphanedCount,
  };
}

async function collectSynthesisFiles(specsRoot: string): Promise<Array<{ path: string; words: number }>> {
  const result: Array<{ path: string; words: number }> = [];
  if (!(await pathExists(specsRoot))) {
    return result;
  }

  for (const feature of await fs.promises.readdir(specsRoot, { withFileTypes: true })) {
    if (!feature.isDirectory()) {
      continue;
    }
    const synthesisPath = path.join(specsRoot, feature.name, "memory-synthesis.md");
    if (await pathExists(synthesisPath)) {
      const content = await readTextFile(synthesisPath);
      result.push({ path: synthesisPath, words: wordCount(content) });
    }
  }
  return result;
}

async function hashFile(targetPath: string): Promise<string> {
  const { sha256 } = await import("../utils/hash");
  const content = await readTextFile(targetPath);
  return sha256(content);
}

function findDuplicateEntries(entries: Array<{ source_path: string; section_heading: string | null; snippet: string | null }>): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const entry of entries) {
    const key = `${entry.source_path}::${entry.section_heading ?? ""}::${entry.snippet ?? ""}`;
    if (seen.has(key)) {
      duplicates.add(entry.source_path);
      continue;
    }
    seen.add(key);
  }
  return [...duplicates];
}
