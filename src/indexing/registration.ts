import fs from "fs/promises";
import path from "path";
import { MemoryDatabase, upsertIndexedFile } from "../db";
import { MemoryHubConfig, MemoryEntryRecord } from "../types";
import { resolveProjectPaths } from "../config";
import { readTextFile, pathExists } from "../utils/fs";
import { sha256 } from "../utils/hash";
import { indexPhase1MemoryFiles } from "./index";

export interface RegisterMemoryOptions {
  id: string;
  title: string;
  tags: string;
  file: string;
  status: string;
  content?: string;
}

/**
 * Appends a formatted durable memory entry to the target markdown file (e.g. DECISIONS.md).
 * Finds the right section heading and inserts the content block just before the next heading
 * or at the end of file. This keeps the LLM's role to content generation only; Node.js
 * handles all file writes.
 */
async function appendEntryToSourceFile(
  filePath: string,
  options: RegisterMemoryOptions,
): Promise<void> {
  const sectionHeadingMap: Record<string, string> = {
    ARCHITECTURE: "## Architecture",
    DECISIONS: "## Decisions",
    BUGS: "## Bugs",
    WORKLOG: "## Worklog",
  };

  const stem = path.basename(filePath, path.extname(filePath)).toUpperCase();
  const sectionHeading = sectionHeadingMap[stem] ?? null;

  const newBlock = [
    `### ${options.id} — ${options.title}`,
    `**Tags**: ${options.tags}  **Status**: ${options.status}`,
    ``,
    options.content!.trim(),
    ``,
  ].join("\n");

  let rawContent = (await pathExists(filePath)) ? await readTextFile(filePath) : "";

  if (!rawContent) {
    // Bootstrap minimal file structure when the file doesn't exist yet
    const heading = sectionHeadingMap[stem] ?? `# ${stem}`;
    rawContent = `# ${stem}\n\n${heading}\n\n`;
  }

  const lines = rawContent.split("\n");

  if (sectionHeading) {
    const sectionIdx = lines.findIndex((l) => l.trim().startsWith(sectionHeading));
    if (sectionIdx !== -1) {
      // Find the end of the section (start of next heading or EOF)
      let insertAt = sectionIdx + 1;
      while (
        insertAt < lines.length &&
        !lines[insertAt].trim().startsWith("## ") &&
        !lines[insertAt].trim().startsWith("# ")
      ) {
        insertAt++;
      }
      // Back up over trailing blank lines to keep spacing clean
      while (insertAt > sectionIdx + 1 && !lines[insertAt - 1].trim()) {
        insertAt--;
      }
      lines.splice(insertAt, 0, "", newBlock);
    } else {
      // Section heading not found — append section + entry at EOF
      lines.push("", sectionHeading, "", newBlock);
    }
  } else {
    // Unknown file — just append at the end
    lines.push("", newBlock);
  }

  await fs.writeFile(filePath, lines.join("\n"), "utf8");
}

export async function registerMemoryEntry(
  projectRoot: string,
  db: MemoryDatabase,
  config: MemoryHubConfig,
  options: RegisterMemoryOptions
): Promise<void> {
  const { memoryRoot } = resolveProjectPaths(projectRoot, config);
  const indexMdPath = path.join(memoryRoot, "INDEX.md");

  // 1. Optionally write the durable entry content to the target file first,
  //    so the LLM never has to read and rewrite large markdown files itself.
  if (options.content) {
    const targetFilePath = path.isAbsolute(options.file)
      ? options.file
      : path.join(memoryRoot, options.file);
    await appendEntryToSourceFile(targetFilePath, options);
  }

  // 2. Sync from INDEX.md to DB to ensure we are up to date
  await indexPhase1MemoryFiles(projectRoot, db, config, { refreshOnly: true });

  const now = new Date().toISOString();
  
  // 3. Prepare the new index record
  const record: MemoryEntryRecord = {
    id: options.id,
    source_path: path.relative(projectRoot, indexMdPath),
    source_type: "memory",
    section_heading: null, // We'll infer category from ID or just leave null for index rows
    content_summary: options.title,
    snippet: null,
    tags: options.tags,
    status: options.status,
    hash: sha256([options.id, options.title, options.tags, options.file, options.status].join("|")),
    line_start: null, // Will be determined after writing
    line_end: null,
    updated_at: now,
    created_at: now,
  };

  // 4. Update INDEX.md
  if (await pathExists(indexMdPath)) {
    let content = await readTextFile(indexMdPath);
    const lines = content.split("\n");
    
    // Determine category from ID prefix
    const prefix = options.id.charAt(0).toUpperCase();
    let categoryHeader = "";
    if (prefix === 'A') categoryHeader = "## Architecture";
    else if (prefix === 'B') categoryHeader = "## Bugs";
    else if (prefix === 'D') categoryHeader = "## Decisions";
    else if (prefix === 'W') categoryHeader = "## Workflow";

    const newRow = `- ${options.id} | ${options.title} | ${options.tags} | [${path.basename(options.file)}](${options.file}) | ${options.status}`;
    
    let targetIndex = -1;
    if (categoryHeader) {
      targetIndex = lines.findIndex(l => l.trim().startsWith(categoryHeader));
    }

    if (targetIndex !== -1) {
      // Find the end of the section (next header or end of file)
      let insertAt = targetIndex + 1;
      while (insertAt < lines.length && !lines[insertAt].trim().startsWith("##") && !lines[insertAt].trim().startsWith("# ")) {
        insertAt++;
      }
      // Back up to skip trailing empty lines
      while (insertAt > targetIndex + 1 && !lines[insertAt - 1].trim()) {
        insertAt--;
      }
      lines.splice(insertAt, 0, newRow);
    } else {
      // Append at the end if category not found
      if (categoryHeader) {
        lines.push("", categoryHeader, newRow);
      } else {
        lines.push(newRow);
      }
    }

    content = lines.join("\n");
    await fs.writeFile(indexMdPath, content, "utf8");
    
    // 5. Final sync to DB so the DB has the correct line numbers and hashes
    await indexPhase1MemoryFiles(projectRoot, db, config, { refreshOnly: false });
  } else {
    // Create INDEX.md if it doesn't exist
    const initialContent = `# Memory Index\n\n## Architecture\n\n## Bugs\n\n## Decisions\n\n`;
    await fs.writeFile(indexMdPath, initialContent, "utf8");
    return registerMemoryEntry(projectRoot, db, config, options); // Retry with file existing
  }
}
