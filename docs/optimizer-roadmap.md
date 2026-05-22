# Local Optimizer Roadmap

This roadmap documents the Node.js + SQLite optimizer and Model Context Protocol (MCP) server, which serve as the primary engine for Spec Kit Memory Hub starting in v1.0.0.

The optimizer is no longer an optional enhancement; it is the default, mandatory workflow. The legacy markdown-only fallback has been deprecated.

## Trust Model

Markdown, Spec Kit artifacts, and source code remain the source of truth.
SQLite is a rebuildable cache for discovery and retrieval.
`memory-synthesis.md` remains the compact AI-facing package used during normal planning and implementation.
The LLM should read synthesis or search results first, not all files.

## Memory Hub Command Flow

The normal Memory Hub flow is:

1. Refresh the SQLite cache via MCP tools.
2. Generate or refresh `memory-synthesis.md`.
3. Read `memory-synthesis.md` first.
4. Open additional source files only when needed.

## Phase 1: Cache Durable Memory

Scope:

- `docs/memory/INDEX.md`
- `docs/memory/PROJECT_CONTEXT.md`
- `docs/memory/ARCHITECTURE.md`
- `docs/memory/DECISIONS.md`
- `docs/memory/BUGS.md`
- `docs/memory/WORKLOG.md`

Purpose:

- Reduce token usage during memory-aware planning.
- Search local SQLite first, then generate a compact `memory-synthesis.md`.

Behavior:

1. User manually captures durable memory.
2. Markdown memory files remain authoritative.
3. Node.js indexes approved memory files into SQLite.
4. Search returns only relevant memory entries.
5. The optimizer generates `specs/<feature>/memory-synthesis.md`.
6. Normal planning reads only `memory-synthesis.md`.

Commands:

```text
npx speckit-memory index-memory
npx speckit-memory search-memory "query"
npx speckit-memory synthesize --feature specs/<feature>
npx speckit-memory audit-memory
npx speckit-memory refresh-memory
npx speckit-memory rebuild-memory
npx speckit-memory token-report --feature specs/<feature>
```

Rules:

- Durable capture remains manual and human-approved.
- SQLite may refresh automatically after approved markdown changes.
- The AI should not read all durable memory files by default.
- Full memory audit may be expensive.

## Phase 2: Cache Development Docs

Scope:

- `constitution.md`
- `.specify/memory/*.md` if present
- `docs/**/*.md`
- `specs/**/spec.md`
- `specs/**/plan.md`
- `specs/**/tasks.md`
- `specs/**/research.md`
- `specs/**/data-model.md`
- `specs/**/contracts/*`
- `README.md`
- architecture docs
- security docs
- bug docs

Purpose:

- Avoid making the AI read every spec, plan, task, architecture, or bug note repeatedly.

Behavior:

1. Node.js chunks development docs.
2. Each chunk is stored with metadata such as source path, artifact type, feature id, heading, status, tags, hash, and updated time.
3. Search retrieves relevant docs before the AI opens files.
4. Direct file read is used only for selected authoritative files.

Retrieval order:

```text
1. Search SQLite cache
2. Read top relevant snippets or synthesis
3. Directly open only selected source files when needed
4. Avoid scanning all docs by default
```

Commands:

```text
npx speckit-memory index-docs
npx speckit-memory search-docs "query"
npx speckit-memory synthesize-docs --feature specs/<feature>
npx speckit-memory audit-docs
npx speckit-memory refresh-docs
```

### Future MCP Enhancements (Nice to Have)

To achieve 100% shell-less native execution for Phase 2 contexts, future versions may implement Phase 2 MCP tools that run directly in the server:
- `speckit_memory_search_docs(query, feature?)` — searches indexed development docs
- `speckit_memory_synthesize_docs(feature)` — generates a feature's doc-synthesis.md in-memory

Until implemented, the CLI tools listed above remain the reliable fallback and are automatically called by the agent when needed.

Source files remain authoritative.

## Phase 3: Model Context Protocol (MCP) Server & Cross-Project Memory Sharing

Scope:
- Model Context Protocol (MCP) Server integration (currently stdio transport)
- Global/machine-wide shared SQLite store (`~/.spec-kit/shared-memory.sqlite`)
- Stack-specific memory isolation and tagging (language, framework)
- Interactive onboarding stack interrogation

Purpose:
- Fast Phase 1 read/write protocol operations directly via AI tools, reducing shell/CLI overhead (`npx`) where MCP tools are available.
- Cross-project memory sharing, allowing developer lessons and best practices to seamlessly propagate across all repositories of the same stack (e.g. sharing Laravel or NestJS controller patterns).
- Automatic tech stack discovery and seed prompts during project initialization.

Behavior:
1. **Interactive Interrogation**: During initialization/update, the command workflow detects indicator files (e.g., `composer.json`, `package.json`, `go.mod`) and asks the developer to confirm their programming language and framework profile.
2. **Global Syncing**: On update, the local cache queries the central database for matching channel tags (e.g., `php`, `laravel`) and offers to seed verified lessons into the local durable memory.
3. **Elevating Durable Capture**: Human-approved local memory captures can be "shared" to the global machine store to immediately benefit other codebases.

Commands & MCP Tools:
- `speckit-memory mcp-start`: Start the MCP server service.
- `speckit_memory_search(query)`: Direct MCP tool — search local SQLite cache (auto-indexes if cold).
- `speckit_memory_synthesize(feature, query?)`: Direct MCP tool — generate `memory-synthesis.md` for a feature.
- `speckit_memory_share_lesson(id, title, content, language, framework?, tags?)`: Direct MCP tool — promote a local lesson to global `~/.spec-kit/shared-memory.sqlite`.
- `speckit_memory_sync_shared(projectRoot?)`: Direct MCP tool — fetch matching external lessons from global cache into `docs/memory/SHARED_LESSONS.md`.
- `speckit_memory_init_project(language, framework?, projectRoot?)`: Direct MCP tool — profile project tech stack and configure sync channels.

Current limitation:
- There is no standalone CLI subcommand yet for `init-project`, `share-lesson`, or `sync-shared`.
- Phase 2 doc synthesis still relies on the local CLI until MCP doc tools are implemented.

## Phase 3.5: Enterprise Scale, Concurrency & Semantic Layer

Scope:
- SQLite WAL (Write-Ahead Log) concurrency and retry lock-waiting pool.
- Local Hybrid Search (FTS5 Keyword + Local Semantic Vector Embeddings using a lightweight vector database like LanceDB).
- Precise Tokenizer Telemetry (integrating `@dqbd/tiktoken` to compute exact context sizes instead of rough character counts).
- Native CLI integration for MCP tools (`share-lesson` and `sync-shared` direct shell wrappers).
- Team-wide Shared Cloud Sync (optional private organization-wide endpoints for multi-machine synchronization).

Purpose:
- Resolve operational gaps such as DB write locks when multiple developer sessions or background git hooks run in parallel.
- Allow conceptual queries (e.g. "problems with payment hooks") to surface relevant lessons, even if they don't share identical text keywords.
- Support physical cross-device collaboration, making lessons synced across physical developer workstations without needing manual DB migrations.

Behavior:
1. **Concurrency Pool**: The database connection wrapper implements a retry back-off queue for SQLite locks, permitting parallel read/write commands safely.
2. **Hybrid Search**: FTS5 scores and local semantic embeddings are merged via reciprocal rank fusion (RRF) to provide the highest-signal memory context.
3. **Enterprise Endpoints**: When `optimizer.sync_endpoint` is configured, `speckit_memory_share_lesson` pushes encrypted payloads to a private organizational server, allowing global lessons to propagate instantly across the entire enterprise.

## Phase 4: Cache Code Symbols

Scope:

- files
- functions
- classes
- methods
- interfaces and types
- exports
- imports
- routes
- commands
- config keys
- tests

Purpose:

- Help the AI find existing code before creating new functions or classes.
- Reduce duplicate implementation.

Behavior:

1. Node.js scans source files.
2. It extracts symbol metadata such as symbol name, symbol type, file path, line range, signature, doc comment, exports, imports, tags, and hash.
3. The AI searches symbols before implementing.
4. The AI opens only selected source files or line ranges.

Do not store full source code in SQLite by default. Store signatures, doc comments, small snippets, and line ranges.

Commands:

```text
npx speckit-memory index-code
npx speckit-memory search-code "query"
npx speckit-memory find-duplicates
npx speckit-memory code-context --feature specs/<feature>
npx speckit-memory audit-code
npx speckit-memory refresh-code
```

Duplicate-prevention flow:

```text
User asks to implement feature
↓
Optimizer searches existing symbols
↓
Returns matching helpers/classes/routes
↓
AI reads only selected files or line ranges
↓
AI reuses or extends existing code instead of duplicating
```

## Cross-Phase Commands

```text
npx speckit-memory audit
npx speckit-memory refresh
npx speckit-memory rebuild
npx speckit-memory doctor
```

Audit is read-only. Refresh is incremental. Rebuild is a full cache regeneration. Doctor validates environment and configuration.
`token-report` uses estimated token counts; it helps compare flows, not bill exact provider usage. The reduction is still meaningful because it reflects less context that the model needs to read.

### Refresh vs Flush vs Rebuild

- `refresh-memory`: update changed rows and remove deleted rows without dropping valid cache data.
- `flush-memory`: clear the SQLite cache only, with no automatic reindex.
- `rebuild-memory`: flush the cache and reindex all markdown memory files from scratch.

## Configuration

Use `.spec-kit-memory/` for the SQLite cache and add it to `.gitignore`.

## Architecture Guard Integration

Recommended flow:

```text
governed-plan
↓
refresh-memory
↓
generate memory-synthesis.md
↓
Architecture Guard reads synthesis
↓
findings generated
↓
user approves capture
↓
refresh-memory
```

Architecture Guard can reduce the manual review burden, but durable memory capture still requires approval.

## Is this like Claude-Mem?

Yes, conceptually.

Claude-Mem-style flow:

```text
capture -> compress -> retrieve -> inject
```

Spec Kit Memory Hub optimizer flow:

```text
source artifacts -> local SQLite index -> retrieve relevant context -> generate memory-synthesis.md -> Spec Kit commands read compact context
```

Difference:

- designed for VS Code and Spec Kit
- markdown/spec/code remain source of truth
- SQLite is only a rebuildable cache
- durable memory capture remains manual and approved
- retrieval is project-aware, feature-aware, and spec-aware
