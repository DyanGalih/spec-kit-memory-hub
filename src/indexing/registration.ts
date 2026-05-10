import fs from "fs/promises";
import path from "path";
import { MemoryDatabase } from "../db";
import { MemoryHubConfig } from "../types";
import { resolveProjectPaths } from "../config";
import { readTextFile, pathExists } from "../utils/fs";
import { indexPhase1MemoryFiles } from "./index";

export interface RegisterMemoryOptions {
  id: string;
  title: string;
  tags: string;
  file: string;
  status: string;
  content?: string;
  prepend?: boolean;
}

/**
 * Appends (or prepends) a durable memory entry to the target markdown file.
 *
 * Design rationale:
 * Each memory file (DECISIONS.md, ARCHITECTURE.md, BUGS.md, WORKLOG.md) uses a
 * free-form structure: a header block, a template section, then raw `###` entries
 * separated by `---`. There is no uniform `## CategoryName` section to target.
 *
 * The `--content` value MUST be the complete, properly-formatted entry body including
 * the correct `### YYYY-MM-DD - Title` heading. Node.js only prepends the `---`
 * separator and handles file I/O — it does not generate any heading itself.
 *
 * Strategy:
 *   - Default: append at end-of-file (chronological: DECISIONS / ARCHITECTURE / BUGS)
 *   - When `prepend: true`: insert before the first existing `###` entry (WORKLOG newest-first)
 */
async function appendEntryToSourceFile(
  filePath: string,
  options: RegisterMemoryOptions,
): Promise<void> {
  // Node.js only adds the `---` separator; --content owns the `### heading` and full body.
  const newBlock = `---\n\n${options.content!.trim()}\n`;

  let rawContent = (await pathExists(filePath)) ? await readTextFile(filePath) : "";

  if (!rawContent) {
    // Bootstrap a minimal file when the target doesn't exist yet.
    const stem = path.basename(filePath, path.extname(filePath));
    rawContent = `# ${stem}\n\n`;
  }

  const base = rawContent.trimEnd();

  let result: string;
  if (options.prepend) {
    // WORKLOG-style: insert just before the first existing `###` entry so newest is at top.
    const lines = base.split("\n");
    const firstEntryIdx = lines.findIndex((l) => /^###\s/.test(l));
    if (firstEntryIdx !== -1) {
      // Splice in the new block (it already ends with \n; join handles spacing).
      lines.splice(firstEntryIdx, 0, newBlock);
      result = lines.join("\n") + "\n";
    } else {
      // No existing entries yet — append.
      result = `${base}\n\n${newBlock}`;
    }
  } else {
    // Default: append at end-of-file (DECISIONS / ARCHITECTURE / BUGS).
    result = `${base}\n\n${newBlock}`;
  }

  await fs.writeFile(filePath, result, "utf8");
}

/**
 * Maps the leading letter of an ID to the matching ## section in INDEX.md.
 * Must match the sections defined in templates/docs/memory/INDEX.md exactly.
 */
const INDEX_CATEGORY_MAP: Record<string, string> = {
  A: "## Architecture",
  B: "## Bugs",
  D: "## Decisions",
  W: "## Workflow",
};

export async function registerMemoryEntry(
  projectRoot: string,
  db: MemoryDatabase,
  config: MemoryHubConfig,
  options: RegisterMemoryOptions,
): Promise<void> {
  const { memoryRoot } = resolveProjectPaths(projectRoot, config);
  const indexMdPath = path.join(memoryRoot, "INDEX.md");

  // 1. Write the durable entry content to the target file when --content is provided.
  //    This is the core token-saving optimization: the LLM never reads or rewrites
  //    large durable files — Node.js does it directly.
  if (options.content) {
    const targetFilePath = path.isAbsolute(options.file)
      ? options.file
      : path.join(memoryRoot, options.file);
    await appendEntryToSourceFile(targetFilePath, options);
  }

  // 2. Ensure INDEX.md exists before appending to it (no recursive retry needed).
  if (!(await pathExists(indexMdPath))) {
    const initialContent = [
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
    await fs.writeFile(indexMdPath, initialContent, "utf8");
  }

  // 3. Append the compact routing row to INDEX.md.
  let content = await readTextFile(indexMdPath);
  const lines = content.split("\n");

  const prefix = options.id.charAt(0).toUpperCase();
  const categoryHeader = INDEX_CATEGORY_MAP[prefix] ?? null;
  const newRow = `- ${options.id} | ${options.title} | ${options.tags} | [${path.basename(options.file)}](${options.file}) | ${options.status}`;

  if (categoryHeader) {
    const sectionIdx = lines.findIndex((l) => l.trim() === categoryHeader);
    if (sectionIdx !== -1) {
      // Find the end of this section (next ## heading or EOF).
      let insertAt = sectionIdx + 1;
      while (insertAt < lines.length && !lines[insertAt].trim().startsWith("##")) {
        insertAt++;
      }
      // Back up over trailing blank lines to keep spacing tight.
      while (insertAt > sectionIdx + 1 && !lines[insertAt - 1].trim()) {
        insertAt--;
      }
      lines.splice(insertAt, 0, newRow);
    } else {
      // Section missing in this INDEX.md — create it at EOF.
      lines.push("", categoryHeader, newRow);
    }
  } else {
    // Unknown ID prefix — append row at EOF without a section heading.
    lines.push(newRow);
  }

  content = lines.join("\n");
  await fs.writeFile(indexMdPath, content, "utf8");

  // 4. One final cache sync so SQLite reflects both the source file and INDEX.md writes.
  await indexPhase1MemoryFiles(projectRoot, db, config, { refreshOnly: false });
}
