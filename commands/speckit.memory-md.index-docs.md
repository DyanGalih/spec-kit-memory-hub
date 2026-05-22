---
description: "Index development docs (specs, plans, tasks, constitutions) into SQLite for low-token retrieval."
---

# Index Docs

Use this command to build or refresh the Phase 2 doc cache. Once populated, the cache lets the AI read a compact `doc-synthesis.md` for any feature instead of opening every spec, plan, tasks, and constitution file individually.

## Usage

```text
/speckit.memory-md.index-docs
```

No arguments required. The command detects the project root automatically.

## What Gets Indexed

The indexer scans all files matching `config.indexing.include.docs` (default: `docs/**/*.md`, `specs/**/*.md`, `README.md`) minus Phase 1 memory files and auto-generated synthesis files. Each file is chunked by heading, stored with:

- `artifact:<type>` tag — `spec`, `plan`, `tasks`, `constitution`, `architecture`, `security`, `readme`, `doc`
- `feature:<id>` tag — derived from the `specs/<feature>/` folder name
- Heading path, summary, and searchable snippet

## Execution Steps

Use MCP tools to interact with the doc cache:

### First-time setup (no cache yet)

Call `speckit_memory_rebuild_cache(scope="docs")`.

Indexes all discovered doc files from scratch. This may take a few seconds on large repos.

### Subsequent runs (incremental)

Call `speckit_memory_refresh_cache(scope="docs")`.

Skips files whose hash has not changed since the last index. Use this at the start of each session.

### Verify the cache

Call `speckit_memory_audit_cache(scope="docs")`.

Reports total indexed entries, stale files (hash mismatch), and missing files. Run this if `speckit_memory_synthesize_docs` returns empty results.

### Search the cache

Call `speckit_memory_search_docs(query="auth flow", featureId="001-auth")` or `speckit_memory_search_docs(query="security constraints", artifactType="constitution")`.

Returns ranked doc snippets without opening any files.

### Generate a feature synthesis

Call `speckit_memory_synthesize_docs(feature="specs/001-auth")`.

Writes `specs/001-auth/doc-synthesis.md` — a single compact file containing the top spec, plan, tasks, constitution, architecture, and security snippets for that feature. Read this file instead of opening individual docs.


## Relationship to Phase 1

Phase 1 MCP tools cache durable memory from `docs/memory/` — decisions, bugs, architecture constraints, worklog. Phase 2 MCP tools cache the current feature's working artifacts — specs, plans, tasks — and project-level governance docs (constitutions, READMEs). Both phases reduce token usage and should be run together at the start of a governed workflow session.
