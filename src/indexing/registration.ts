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
}

export async function registerMemoryEntry(
  projectRoot: string,
  db: MemoryDatabase,
  config: MemoryHubConfig,
  options: RegisterMemoryOptions
): Promise<void> {
  const { memoryRoot } = resolveProjectPaths(projectRoot, config);
  const indexMdPath = path.join(memoryRoot, "INDEX.md");

  // 1. Sync from INDEX.md to DB first to ensure we are up to date
  await indexPhase1MemoryFiles(projectRoot, db, config, { refreshOnly: true });

  const now = new Date().toISOString();
  
  // 2. Prepare the new record
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

  // 3. Update INDEX.md
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
    
    // 4. Final sync to DB so the DB has the correct line numbers and hashes
    await indexPhase1MemoryFiles(projectRoot, db, config, { refreshOnly: false });
  } else {
    // Create INDEX.md if it doesn't exist
    const initialContent = `# Memory Index\n\n## Architecture\n\n## Bugs\n\n## Decisions\n\n`;
    await fs.writeFile(indexMdPath, initialContent, "utf8");
    return registerMemoryEntry(projectRoot, db, config, options); // Retry with file existing
  }
}
