import { MemoryDatabase, searchFtsFiltered } from "../db";
import { MemoryHubConfig, SearchResult } from "../types";
import { normalizeWhitespace } from "../utils/text";
import { scoreResult } from "./index";

export interface DocSearchOptions {
  /** Filter results to entries for a specific feature (matched via `feature:<id>` tag). */
  featureId?: string;
  /** Filter results to entries of a specific artifact type (matched via `artifact:<type>` tag). */
  artifactType?: string;
  /** Maximum number of results to return. Defaults to config.retrieval.max_doc_results. */
  limit?: number;
}

function buildDocFtsQuery(query: string): string {
  const terms =
    normalizeWhitespace(query)
      .toLowerCase()
      .match(/\b[\p{L}\p{N}_-]+\b/gu) ?? [];
  return terms.length > 0
    ? terms.map((t) => `"${t.replace(/"/g, "")}"`).join(" OR ")
    : query.trim();
}

/**
 * Search the Phase 2 doc cache.
 *
 * Results are scored with the same multi-signal algorithm used by Phase 1
 * memory search, then optionally filtered by featureId and/or artifactType.
 */
export function searchDocEntries(
  db: MemoryDatabase,
  query: string,
  config: MemoryHubConfig,
  options: DocSearchOptions = {},
): SearchResult[] {
  const limit = options.limit ?? config.retrieval.max_doc_results;
  // Over-fetch so multi-signal scoring can re-rank before slicing.
  const ftsCandidateLimit = limit * 5;

  const ftsQuery = buildDocFtsQuery(query);
  let candidates = searchFtsFiltered(db, ftsQuery, "doc", ftsCandidateLimit).map((c) =>
    scoreResult(c, query),
  );

  if (options.featureId) {
    const tag = `feature:${options.featureId}`;
    candidates = candidates.filter((c) => (c.tags ?? "").includes(tag));
  }

  if (options.artifactType) {
    const tag = `artifact:${options.artifactType}`;
    candidates = candidates.filter((c) => (c.tags ?? "").includes(tag));
  }

  const deduped = new Map<string, SearchResult>();
  for (const c of candidates) {
    const key = `${c.source_path}::${c.section_heading ?? ""}`;
    const existing = deduped.get(key);
    if (!existing || existing.score < c.score) {
      deduped.set(key, c);
    }
  }

  return [...deduped.values()]
    .sort((a, b) => b.score - a.score || (b.fts_rank ?? 0) - (a.fts_rank ?? 0))
    .slice(0, limit);
}
