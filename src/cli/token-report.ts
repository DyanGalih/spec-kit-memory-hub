import path from "path";
import { searchMemoryEntries } from "../retrieval";
import { MemoryDatabase } from "../db";
import { resolveProjectPaths } from "../config";
import { MemoryHubConfig, SearchResult } from "../types";
import { discoverPhase1MemoryFiles } from "../indexing";
import { estimateTokens } from "../utils/tokens";
import { pathExists, readTextFile } from "../utils/fs";

export interface TokenComparison {
  baselineTokens: number;
  cachedTokens: number;
  savedTokens: number;
  savedPercent: number;
}

function formatSummaryLine(label: string, tokens: number): string {
  return `${label}: ${tokens.toLocaleString()} estimated tokens`;
}

function formatSavedLine(savedTokens: number, savedPercent: number): string {
  return `Saved: ${savedTokens.toLocaleString()} tokens (${savedPercent.toFixed(1)}%)`;
}

async function readBaselineTokens(projectRoot: string, config: MemoryHubConfig): Promise<number> {
  const memoryFiles = await discoverPhase1MemoryFiles(projectRoot, config);
  const contents = await Promise.all(
    memoryFiles.map(async (relPath) => {
      const fullPath = path.resolve(projectRoot, relPath);
      return (await pathExists(fullPath)) ? await readTextFile(fullPath) : "";
    }),
  );
  return contents.reduce((sum, content) => sum + estimateTokens(content), 0);
}

function serializeSearchResults(results: SearchResult[]): string {
  return results
    .map((result) =>
      [
        result.source_path,
        result.section_heading ?? "",
        result.content_summary ?? "",
        result.snippet ?? "",
        result.tags ?? "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");
}

export async function compareSearchFlowTokens(
  projectRoot: string,
  db: MemoryDatabase,
  config: MemoryHubConfig,
  query: string,
): Promise<TokenComparison> {
  const baselineTokens = await readBaselineTokens(projectRoot, config);
  const { memoryRoot } = resolveProjectPaths(projectRoot, config);
  const indexPath = path.join(memoryRoot, "INDEX.md");
  const indexTokens = estimateTokens((await pathExists(indexPath)) ? await readTextFile(indexPath) : "");
  const results = searchMemoryEntries(db, query, config);
  const cachedTokens = estimateTokens(serializeSearchResults(results)) + indexTokens;
  const savedTokens = Math.max(0, baselineTokens - cachedTokens);
  const savedPercent = baselineTokens > 0 ? (savedTokens / baselineTokens) * 100 : 0;
  return { baselineTokens, cachedTokens, savedTokens, savedPercent };
}

export async function compareSynthesisFlowTokens(
  projectRoot: string,
  config: MemoryHubConfig,
  synthesisContent: string,
): Promise<TokenComparison> {
  const baselineTokens = await readBaselineTokens(projectRoot, config);
  const cachedTokens = estimateTokens(synthesisContent);
  const savedTokens = Math.max(0, baselineTokens - cachedTokens);
  const savedPercent = baselineTokens > 0 ? (savedTokens / baselineTokens) * 100 : 0;
  return { baselineTokens, cachedTokens, savedTokens, savedPercent };
}

export function printTokenComparisonBanner(comparison: TokenComparison): void {
  console.log(formatSummaryLine("Baseline", comparison.baselineTokens));
  console.log(formatSummaryLine("Cached flow", comparison.cachedTokens));
  console.log(formatSavedLine(comparison.savedTokens, comparison.savedPercent));
}

export function shouldShowTokenBanner(config: MemoryHubConfig): boolean {
  return config.show_token_banner !== false;
}
