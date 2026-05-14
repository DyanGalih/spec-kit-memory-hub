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

When `optimizer.enabled: true` and the CLI is available, execute the following in the project root:

### First-time setup (no cache yet)

```bash
npx speckit-memory index-docs
```

Indexes all discovered doc files from scratch. This may take a few seconds on large repos.

### Subsequent runs (incremental)

```bash
npx speckit-memory refresh-docs
```

Skips files whose hash has not changed since the last index. Use this at the start of each session.

### Verify the cache

```bash
npx speckit-memory audit-docs
```

Reports total indexed entries, stale files (hash mismatch), and missing files. Run this if `synthesize-docs` returns empty results.

### Search the cache

```bash
npx speckit-memory search-docs "auth flow" --feature 001-auth
npx speckit-memory search-docs "security constraints" --type constitution
```

Returns ranked doc snippets without opening any files.

### Generate a feature synthesis

```bash
npx speckit-memory synthesize-docs --feature specs/001-auth
```

Writes `specs/001-auth/doc-synthesis.md` — a single compact file containing the top spec, plan, tasks, constitution, architecture, and security snippets for that feature. Read this file instead of opening individual docs.

## When the Optimizer is Disabled

If `optimizer.enabled: false` or the CLI is unavailable, skip this command. Read `specs/<feature>/spec.md`, `plan.md`, and `tasks.md` directly using file-reading tools with explicit paths (do not rely on workspace search or semantic indexers — these files are often in `.gitignore`).

## Relationship to Phase 1

Phase 1 (`index-memory`, `refresh-memory`, `synthesize`) caches durable memory from `docs/memory/` — decisions, bugs, architecture constraints, worklog. Phase 2 (`index-docs`, `refresh-docs`, `synthesize-docs`) caches the current feature's working artifacts — specs, plans, tasks — and project-level governance docs (constitutions, READMEs). Both phases reduce token usage and should be run together at the start of a governed workflow session.
