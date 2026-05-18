import fs from "fs/promises";
import path from "path";
import { MemoryDatabase } from "../db";
import { loadConfig, resolveProjectPaths } from "../config";
import { MemoryHubConfig } from "../types";
import { pathExists, readTextFile } from "../utils/fs";
import { indexPhase1MemoryFiles } from "./index";

const REPAIR_TARGETS = [
  { file: "ARCHITECTURE.md", prefix: "A", section: "## Architecture" },
  { file: "BUGS.md", prefix: "B", section: "## Bugs" },
  { file: "DECISIONS.md", prefix: "D", section: "## Decisions" },
  { file: "WORKLOG.md", prefix: "W", section: "## Workflow" },
];

interface DurableEntryCandidate {
  file: string;
  title: string;
  status: string;
}

export interface IndexRepairRow {
  id: string;
  title: string;
  tags: string;
  file: string;
  status: string;
  row: string;
}

export interface RepairMemoryIndexResult {
  applied: boolean;
  indexPath: string;
  existingRows: number;
  missingRows: IndexRepairRow[];
}

function normalizeKey(file: string, title: string): string {
  return `${file.toLowerCase()}::${title.trim().toLowerCase()}`;
}

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase().replace(/\s+/g, "-") || "needs-review";
}

function parseExistingIndex(content: string): { keys: Set<string>; usedIds: Set<string>; rowCount: number } {
  const keys = new Set<string>();
  const usedIds = new Set<string>();
  let rowCount = 0;
  const rowPattern = /^-\s+([A-Z]\d+)\s+\|\s+([^|]+?)\s+\|\s+[^|]*\|\s+\[([^\]]+)\]\(([^)]+)\)/gm;

  for (const match of content.matchAll(rowPattern)) {
    rowCount += 1;
    usedIds.add(match[1]);
    const title = match[2].trim();
    const file = path.basename(match[4].trim() || match[3].trim());
    keys.add(normalizeKey(file, title));
  }

  return { keys, usedIds, rowCount };
}

function nextId(prefix: string, usedIds: Set<string>): string {
  let max = 0;
  for (const id of usedIds) {
    if (!id.startsWith(prefix)) continue;
    const value = Number.parseInt(id.slice(prefix.length), 10);
    if (!Number.isNaN(value)) {
      max = Math.max(max, value);
    }
  }
  const id = `${prefix}${max + 1}`;
  usedIds.add(id);
  return id;
}

function parseStatus(lines: string[], headingIndex: number): string {
  for (let i = headingIndex + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line.startsWith("### ")) break;
    if (line === "**Status**") {
      for (let j = i + 1; j < lines.length; j += 1) {
        const status = lines[j].trim();
        if (!status) continue;
        if (status.startsWith("**") || status.startsWith("### ")) break;
        return normalizeStatus(status.split("|")[0]);
      }
    }
  }
  return "needs-review";
}

function extractDurableEntries(file: string, content: string): DurableEntryCandidate[] {
  const lines = content.split(/\r?\n/);
  const entries: DurableEntryCandidate[] = [];
  let inTemplateOrExample = false;

  for (let i = 0; i < lines.length; i += 1) {
    if (/^##\s+(Template|Example|Counter-Example)/i.test(lines[i].trim())) {
      inTemplateOrExample = true;
      continue;
    }
    if (/^##\s+/.test(lines[i].trim())) {
      inTemplateOrExample = false;
    }

    const match = lines[i].match(/^###\s+(\d{4}-\d{2}-\d{2})\s+-\s+(.+?)\s*$/);
    if (!match) continue;
    if (inTemplateOrExample) continue;
    const title = match[2].trim();
    if (!title || /^(decision title|bug \/ failure pattern)$/i.test(title)) continue;
    entries.push({
      file,
      title,
      status: parseStatus(lines, i),
    });
  }

  return entries;
}

function ensureIndexSkeleton(content: string): string {
  if (content.trim()) {
    let next = content;
    for (const target of REPAIR_TARGETS) {
      if (!next.split(/\r?\n/).some((line) => line.trim() === target.section)) {
        next = `${next.trimEnd()}\n\n${target.section}\n`;
      }
    }
    return next;
  }

  return [
    "# Memory Index",
    "",
    "This is a compact routing map for durable project memory (`docs/memory/`). Keep it short.",
    "",
    "## Architecture",
    "",
    "## Bugs",
    "",
    "## Decisions",
    "",
    "## Workflow",
    "",
  ].join("\n");
}

function appendRowsToSections(content: string, rows: IndexRepairRow[]): string {
  let lines = ensureIndexSkeleton(content).split(/\r?\n/);

  for (const target of REPAIR_TARGETS) {
    const targetRows = rows.filter((row) => row.id.startsWith(target.prefix));
    if (targetRows.length === 0) continue;

    let sectionIdx = lines.findIndex((line) => line.trim() === target.section);
    if (sectionIdx === -1) {
      lines.push("", target.section);
      sectionIdx = lines.length - 1;
    }

    let insertAt = sectionIdx + 1;
    while (insertAt < lines.length && !lines[insertAt].trim().startsWith("## ")) {
      insertAt += 1;
    }
    while (insertAt > sectionIdx + 1 && !lines[insertAt - 1].trim()) {
      insertAt -= 1;
    }

    lines.splice(insertAt, 0, ...targetRows.map((row) => row.row));
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

export async function repairMemoryIndex(
  projectRoot: string,
  db: MemoryDatabase,
  config: MemoryHubConfig = loadConfig(projectRoot),
  apply = false,
): Promise<RepairMemoryIndexResult> {
  const { memoryRoot } = resolveProjectPaths(projectRoot, config);
  const indexPath = path.join(memoryRoot, "INDEX.md");
  const existingContent = (await pathExists(indexPath)) ? await readTextFile(indexPath) : "";
  const existing = parseExistingIndex(existingContent);
  const usedIds = new Set(existing.usedIds);
  const missingRows: IndexRepairRow[] = [];

  for (const target of REPAIR_TARGETS) {
    const sourcePath = path.join(memoryRoot, target.file);
    if (!(await pathExists(sourcePath))) continue;

    const entries = extractDurableEntries(target.file, await readTextFile(sourcePath));
    for (const entry of entries) {
      const key = normalizeKey(entry.file, entry.title);
      if (existing.keys.has(key)) continue;
      existing.keys.add(key);
      const id = nextId(target.prefix, usedIds);
      const tags = "recovered,needs-review";
      const row = `- ${id} | ${entry.title} | ${tags} | [${entry.file}](${entry.file}) | ${entry.status}`;
      missingRows.push({ id, title: entry.title, tags, file: entry.file, status: entry.status, row });
    }
  }

  if (apply && missingRows.length > 0) {
    await fs.mkdir(path.dirname(indexPath), { recursive: true });
    await fs.writeFile(indexPath, appendRowsToSections(existingContent, missingRows), "utf8");
    await indexPhase1MemoryFiles(projectRoot, db, config, { refreshOnly: false, removeDeleted: true });
  }

  return {
    applied: apply,
    indexPath: path.relative(projectRoot, indexPath),
    existingRows: existing.rowCount,
    missingRows,
  };
}
