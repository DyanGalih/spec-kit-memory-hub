import fs from "fs";
import path from "path";
import { MemoryDatabase } from "../db";
import { loadConfig, resolveProjectPaths } from "../config";
import { MemoryHubConfig, SearchResult, SynthesisDocument } from "../types";
import { normalizeWhitespace, truncateWords, uniqueSorted, wordCount } from "../utils/text";
import { estimateTokens } from "../utils/tokens";
import { searchMemoryEntries, entryToSynthesisItem } from "../retrieval";
import { readTextFile, writeTextFile, pathExists } from "../utils/fs";

type SectionCategory =
  | "project-context"
  | "decision"
  | "architecture"
  | "deviation"
  | "security"
  | "bug"
  | "worklog"
  | "conflict";

function featureNameFromPath(featurePath: string): string {
  return path.basename(featurePath.replace(/[\\/]+$/, ""));
}

function fileCategory(entry: SearchResult): SectionCategory {
  const source = entry.source_path.toLowerCase();
  const heading = (entry.section_heading ?? "").toLowerCase();
  const tags = (entry.tags ?? "").toLowerCase();
  const combined = `${source} ${heading} ${tags}`;

  if (source.includes("project_context")) return "project-context";
  if (combined.includes("security")) return "security";
  if (combined.includes("accept") || combined.includes("deviation")) return "deviation";
  if (source.includes("architecture")) return "architecture";
  if (source.includes("decisions")) return "decision";
  if (source.includes("bugs")) return "bug";
  if (source.includes("worklog")) return "worklog";
  return "decision";
}

function bullet(entryLabel: string, text: string, sourcePath: string): string {
  return `- [${entryLabel}] ${text} (Source: \`${sourcePath}\`)`;
}

function limitLines(lines: string[], maxItems: number): string[] {
  return lines.slice(0, maxItems);
}

function formatItems(title: string, items: string[], emptyLabel = "- [none]"): string {
  const body = items.length > 0 ? items.join("\n") : emptyLabel;
  return `## ${title}\n${body}`;
}

function buildCurrentScope(featureName: string, featurePath: string, featureSpec: string, featureMemory: string): string {
  const specHeading = featureSpec.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const memoryNotes = truncateWords(normalizeWhitespace(featureMemory), 40);
  const specNotes = truncateWords(normalizeWhitespace(featureSpec), 32);
  const parts = [
    `- Feature: ${featureName}`,
    specHeading ? `- Spec: ${specHeading}` : null,
    featurePath ? `- Feature folder: ${featurePath}` : null,
    memoryNotes ? `- Active notes: ${memoryNotes}` : null,
    specNotes ? `- Spec context: ${specNotes}` : null,
  ].filter(Boolean);

  return `## Current Scope\n${parts.join("\n")}`;
}

function summarizeBucket(
  title: string,
  entries: SearchResult[],
  category: SectionCategory,
  maxItems: number,
  labelPrefix: string,
): string {
  const filtered = entries.filter((entry) => fileCategory(entry) === category);
  const lines = limitLines(
    filtered.map((entry, index) => {
      const label = `${labelPrefix}${index + 1}`;
      const text = entry.content_summary || entry.snippet || entry.section_heading || entry.source_path;
      return bullet(label, text, entry.source_path);
    }),
    maxItems,
  );
  return formatItems(title, lines);
}

function conflictWarnings(entries: SearchResult[]): string[] {
  const warnings: string[] = [];
  for (const entry of entries) {
    const text = `${entry.section_heading ?? ""} ${entry.content_summary ?? ""} ${entry.snippet ?? ""} ${entry.tags ?? ""}`.toLowerCase();
    if (text.includes("deprecated") || text.includes("superseded") || text.includes("needs review")) {
      warnings.push(
        bullet(
          "C",
          `Potentially stale memory surfaced from ${entry.section_heading ?? path.basename(entry.source_path)}`,
          entry.source_path,
        ),
      );
    }
  }
  return uniqueSorted(warnings);
}

export async function generateMemorySynthesis(
  db: MemoryDatabase,
  projectRoot: string,
  featurePath: string,
  config: MemoryHubConfig = loadConfig(projectRoot),
  customQuery?: string,
): Promise<SynthesisDocument> {
  const { specsRoot } = resolveProjectPaths(projectRoot, config);
  const featureRoot = path.resolve(projectRoot, featurePath);
  const featureName = featureNameFromPath(featureRoot);
  const featureSpecPath = path.join(featureRoot, "spec.md");
  const featureMemoryPath = path.join(featureRoot, config.feature_memory_filename);
  const synthesisPath = path.join(featureRoot, config.memory_synthesis_filename);
  const featureSpec = (await pathExists(featureSpecPath)) ? await readTextFile(featureSpecPath) : "";
  const featureMemory = (await pathExists(featureMemoryPath)) ? await readTextFile(featureMemoryPath) : "";
  const query = customQuery || [featureName, featureSpec, featureMemory].join("\n");
  let results = searchMemoryEntries(db, query, config, config.retrieval.max_memory_results);
  if (results.length === 0) {
    results = searchMemoryEntries(db, "", config, config.retrieval.max_memory_results);
  }

  const items = results.map((entry, index) => entryToSynthesisItem(entry, `${categoryPrefix(fileCategory(entry))}${index + 1}`));
  const sections: string[] = [];
  sections.push(buildCurrentScope(featureName, path.relative(projectRoot, featureRoot), featureSpec, featureMemory));
  sections.push(
    formatItems(
      "Relevant Project Context",
      limitLines(
        results
          .filter((entry) => fileCategory(entry) === "project-context")
          .map((entry, index) => bullet(`C${index + 1}`, entry.content_summary || entry.snippet || entry.section_heading || entry.source_path, entry.source_path)),
        3,
      ),
    ),
  );
  sections.push(summarizeBucket("Relevant Decisions", results, "decision", 5, "D"));
  sections.push(summarizeBucket("Active Architecture Constraints", results, "architecture", 5, "A"));
  sections.push(summarizeBucket("Accepted Deviations", results, "deviation", 3, "V"));
  sections.push(summarizeBucket("Relevant Security Constraints", results, "security", 3, "S"));
  sections.push(summarizeBucket("Related Historical Lessons", results, "bug", 3, "B"));
  sections.push(
    formatItems(
      "Conflict Warnings",
      limitLines(conflictWarnings(results), 3),
    ),
  );
  sections.push(
    `## Retrieval Notes\n- Index entries considered: ${Math.min(results.length, config.retrieval.max_index_entries)}\n- Source sections read: ${results.length}\n- Budget status: ${wordCount(sections.join("\n\n")) <= config.retrieval.max_synthesis_words ? "within limit" : "trimmed to fit"}`,
  );

  let content = `# Memory Synthesis\n\n${sections.join("\n\n")}\n`;
  content = trimToWordBudget(content, config.retrieval.max_synthesis_words);

  return {
    feature: featureName,
    outputPath: synthesisPath,
    content,
    words: wordCount(content),
    sourceItems: items,
    retrievalNotes: [`Query: ${truncateWords(query, 24)}`],
  };
}

function categoryPrefix(category: SectionCategory): string {
  switch (category) {
    case "project-context":
      return "C";
    case "decision":
      return "D";
    case "architecture":
      return "A";
    case "deviation":
      return "V";
    case "security":
      return "S";
    case "bug":
      return "B";
    case "worklog":
      return "W";
    case "conflict":
      return "X";
    default:
      return "R";
  }
}

function trimToWordBudget(content: string, maxWords: number): string {
  const lines = content.split("\n");
  if (wordCount(content) <= maxWords) {
    return content;
  }

  const keep: string[] = [];
  for (const line of lines) {
    keep.push(line);
    if (wordCount(keep.join("\n")) > maxWords) {
      keep.pop();
      break;
    }
  }

  const trimmed = keep.join("\n").trimEnd();
  return `${trimmed}\n`;
}

export async function writeMemorySynthesis(
  db: MemoryDatabase,
  projectRoot: string,
  featurePath: string,
  config: MemoryHubConfig = loadConfig(projectRoot),
  customQuery?: string,
): Promise<SynthesisDocument> {
  const synthesis = await generateMemorySynthesis(db, projectRoot, featurePath, config, customQuery);
  await writeTextFile(synthesis.outputPath, synthesis.content);
  return synthesis;
}
