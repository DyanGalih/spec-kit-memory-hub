import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import { MemoryHubConfig } from "../types";
import { resolveProjectPaths, loadConfig } from "../config";
import { pathExists, readTextFile } from "../utils/fs";
import { openDatabase, closeDatabase } from "../db";
import { indexPhase1MemoryFiles } from "../indexing";

const LEGACY_FILES = [
  "DECISIONS.md",
  "ARCHITECTURE.md",
  "BUGS.md",
  "WORKLOG.md"
];

function sanitizeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function migrateMemoryFiles(projectRoot: string): Promise<void> {
  const config = loadConfig(projectRoot);
  const { memoryRoot, dbPath } = resolveProjectPaths(projectRoot, config);
  const indexPath = path.join(memoryRoot, "INDEX.md");

  console.log(chalk.bold("Starting migration to flat date-based files..."));

  let indexContent = await pathExists(indexPath) ? await readTextFile(indexPath) : "";
  let migratedCount = 0;

  for (const legacyFile of LEGACY_FILES) {
    const fullPath = path.join(memoryRoot, legacyFile);
    if (!(await pathExists(fullPath))) {
      continue;
    }

    console.log(`Processing legacy file: ${legacyFile}`);
    const rawContent = await readTextFile(fullPath);
    
    // Split by horizontal rule
    const blocks = rawContent.split(/^---$/m);
    
    let entriesExtracted = 0;

    const subfolder = legacyFile.replace('.md', '').toLowerCase();
    const targetDir = path.join(memoryRoot, subfolder);
    await fs.mkdir(targetDir, { recursive: true });

    for (let block of blocks) {
      block = block.trim();
      const headingMatch = /^###\s+(\d{4}-\d{2}-\d{2})\s+-\s+(.*)$/m.exec(block);
      
      if (headingMatch) {
        const dateStr = headingMatch[1];
        const titleStr = headingMatch[2].trim();
        const shortTitle = sanitizeFilename(titleStr);
        const newRelativePath = `${subfolder}/${dateStr}-${shortTitle}.md`;
        const newFilePath = path.join(memoryRoot, newRelativePath);

        // Write the new flat file
        await fs.writeFile(newFilePath, block + "\n", "utf8");
        entriesExtracted++;
        migratedCount++;
        console.log(chalk.green(`  Created: ${newRelativePath}`));

        // Update INDEX.md
        // Look for the row in INDEX.md that contains this title and points to the legacy file.
        // Example: - D1 | Some Title | tag | [DECISIONS.md](DECISIONS.md) | active
        // We want to replace [DECISIONS.md](DECISIONS.md) with [newFilename](newFilename)
        const lines = indexContent.split("\n");
        let updated = false;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes(`|`) && line.toLowerCase().includes(titleStr.toLowerCase())) {
            // Found the row. Replace the file link.
            // Regex to find a markdown link that might point to the legacy file
            const newRow = line.replace(/\[([^\]]+)\]\([^)]+\)/, `[${path.basename(newRelativePath)}](${newRelativePath})`);
            if (line !== newRow) {
              lines[i] = newRow;
              updated = true;
            }
          }
        }
        if (updated) {
          indexContent = lines.join("\n");
        }
      }
    }

    if (entriesExtracted > 0) {
      // Archive the legacy file
      const backupPath = path.join(memoryRoot, `${legacyFile}.backup`);
      await fs.rename(fullPath, backupPath);
      console.log(chalk.yellow(`  Archived ${legacyFile} -> ${legacyFile}.backup`));
    }
  }

  if (migratedCount > 0) {
    console.log(chalk.bold("\nUpdating INDEX.md..."));
    await fs.writeFile(indexPath, indexContent, "utf8");

    console.log(chalk.bold("Rebuilding SQLite cache..."));
    if (await pathExists(dbPath)) {
      await fs.unlink(dbPath);
    }
    const rebuiltDb = openDatabase(dbPath);
    try {
      const result = await indexPhase1MemoryFiles(projectRoot, rebuiltDb, config, {
        refreshOnly: false,
        removeDeleted: true,
      });
      console.log(`Cache rebuilt from ${result.indexedFiles} files (${result.indexedEntries} entries).`);
    } finally {
      closeDatabase(rebuiltDb);
    }
    
    console.log(chalk.green.bold(`\n✅ Migration complete! Migrated ${migratedCount} entries to flat files.`));
  } else {
    console.log(chalk.cyan("No monolithic entries found to migrate."));
  }
}
