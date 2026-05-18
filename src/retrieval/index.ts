import path from "path";
import { MemoryDatabase, loadAllEntries, searchFtsFiltered } from "../db";
import { MemoryEntryRecord, MemoryHubConfig, SearchResult, SynthesisSectionItem } from "../types";
import { normalizeWhitespace, uniqueSorted, wordCount } from "../utils/text";

// Over-fetch factor: retrieve more FTS candidates than the final limit so that
// the multi-signal scoring pass can re-rank and pick the best subset.
const FTS_OVER_FETCH_FACTOR = 5;

function queryTerms(query: string): string[] {
  return normalizeWhitespace(query)
    .toLowerCase()
    .match(/\b[\p{L}\p{N}_-]+\b/gu) ?? [];
}

function recencyScore(updatedAt: string): number {
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) {
    return 0;
  }
  const ageDays = Math.max(0, (Date.now() - date.getTime()) / 86_400_000);
  return 1 / (1 + ageDays / 30);
}

function containsQueryTerm(text: string, terms: string[]): number {
  const haystack = text.toLowerCase();
  return terms.reduce((score, term) => (haystack.includes(term) ? score + 1 : score), 0);
}

function baseFtsScore(rank: number | null): number {
  if (rank === null || Number.isNaN(rank)) {
    return 0;
  }
  return 1 / (1 + Math.exp(rank));
}

export function scoreResult(result: SearchResult, query: string): SearchResult {
  const terms = queryTerms(query);
  const haystack = [
    result.source_path,
    result.section_heading ?? "",
    result.content_summary ?? "",
    result.snippet ?? "",
    result.tags ?? "",
  ].join(" ");

  const fts = baseFtsScore(result.fts_rank);
  const tagScore = containsQueryTerm(result.tags ?? "", terms) * 0.35;
  const headingScore = containsQueryTerm(result.section_heading ?? "", terms) * 0.25;
  const pathScore = containsQueryTerm(result.source_path, terms) * 0.2;
  const contentScore = containsQueryTerm(haystack, terms) * 0.1;
  const recency = recencyScore(result.updated_at) * 0.1;
  const score = fts + tagScore + headingScore + pathScore + contentScore + recency;

  const reason: string[] = [];
  if (tagScore > 0) reason.push("tag match");
  if (headingScore > 0) reason.push("heading match");
  if (pathScore > 0) reason.push("path match");
  if (contentScore > 0) reason.push("content match");
  if (recency > 0) reason.push("recent");
  if (fts > 0) reason.push("fts");

  return {
    ...result,
    score,
    reason,
  };
}

export function searchMemoryEntries(
  db: MemoryDatabase,
  query: string,
  config: MemoryHubConfig,
  limit = config.retrieval.max_memory_results,
): SearchResult[] {
  // max_index_entries caps how many FTS candidates we fetch before re-ranking.
  const ftsCandidateLimit = config.retrieval.max_index_entries * FTS_OVER_FETCH_FACTOR;
  const normalizedQuery = buildFtsQuery(query);
  const candidates = searchFtsFiltered(db, normalizedQuery, "memory", ftsCandidateLimit).map((candidate) => scoreResult(candidate, query));

  const deduped = new Map<string, SearchResult>();
  for (const candidate of candidates) {
    const key = `${candidate.source_path}::${candidate.section_heading ?? ""}`;
    const existing = deduped.get(key);
    if (!existing || existing.score < candidate.score) {
      deduped.set(key, candidate);
    }
  }

  return [...deduped.values()]
    .sort((a, b) => b.score - a.score || (b.fts_rank ?? 0) - (a.fts_rank ?? 0))
    .slice(0, limit);
}

function buildFtsQuery(query: string): string {
  const terms = queryTerms(query);
  // Use OR to find documents with ANY of the terms, then rely on scoring
  // and bm25 ranking to surface the most relevant (highest term overlap).
  return terms.length > 0 ? terms.map((term) => `"${term.replace(/"/g, "")}"`).join(" OR ") : query.trim();
}

export function entryToSynthesisItem(entry: SearchResult, label: string): SynthesisSectionItem {
  return {
    id: label,
    title: entry.section_heading ?? path.basename(entry.source_path),
    sourcePath: entry.source_path,
    sectionHeading: entry.section_heading ?? path.basename(entry.source_path),
    summary: entry.content_summary ?? "",
    snippet: entry.snippet ?? "",
    tags: uniqueSorted((entry.tags ?? "").split(",").filter(Boolean)),
    lineStart: entry.line_start,
    lineEnd: entry.line_end,
  };
}

export function loadAllMemoryEntries(db: MemoryDatabase): MemoryEntryRecord[] {
  return loadAllEntries(db);
}

export function rankTokenValue(text: string): number {
  return wordCount(text);
}
