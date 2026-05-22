# Reference Manual

This document provides a comprehensive technical reference for the Spec Kit Memory Hub extension.

---

## Memory Structure

### Governance Layer (`.specify/memory/`)

These files define the **Project Law**—stable rules and standards that govern all work:

| File | Purpose |
| --- | --- |
| `constitution.md` | Core product principles and stable operating rules |
| `architecture_constitution.md` | Authoritative technical and architecture standards |
| `DECISIONS.md` | High-level governance decisions |
| `BUGS.md` | Systemic or high-risk failure patterns requiring oversight |

### Durable Memory (`docs/memory/`)

These files hold the **Project History**—knowledge that helps **all future features**:

| File | Purpose | Example Content |
| --- | --- | --- |
| `INDEX.md` | Compact routing map for selecting relevant memory | "D3: API writes stay server-side -> DECISIONS.md#d3" |
| `PROJECT_CONTEXT.md` | Product identity, domain language, key constraints | "Customer notes must stay inside the internal admin system" |
| `ARCHITECTURE.md` | System shape, ownership boundaries, integrations | "Only the API service writes customer note records" |
| `DECISIONS.md` | Technical decisions with rationale and tradeoffs | "Chose Repository pattern because we need to swap DB later" |
| `BUGS.md` | Recurring implementation patterns and mitigations | "Always filter by permission before returning search results" |
| `WORKLOG.md` | Sequential ledger of durable lessons | "The CSV export endpoint needs 2x the normal timeout" |

### Feature Memory (`specs/<feature>/`)

These files help the **current feature only**:

| File | Purpose |
| --- | --- |
| `memory.md` | Active notes, open questions, and watchpoints for this feature |
| `memory-synthesis.md` | Compact AI-facing summary: constraints, reused decisions, conflicts, watchpoints |

**Rule of thumb:**
- If it governs how we work (principles/standards) → `.specify/memory/`
- If it helps future unrelated features (history/implementation) → `docs/memory/`
- If it only matters during this feature → `specs/<feature>/`

---

## Commands

| Command | When To Use | What It Does |
| --- | --- | --- |
| `init` | Once, at project setup | Creates durable memory folder, `INDEX.md`, feature memory starter files, `.github/copilot-instructions.md`, and `.specify/extensions/memory-md/config.yml` |
| `plan-with-memory` | Before planning each feature | Reads the memory index, retrieves selected source sections, synthesizes relevant constraints and decisions, surfaces conflicts and watchpoints for this feature |
| `capture` | After meaningful work is done | Reviews what happened, extracts durable lessons from the full feature journey (Spec → Plan → Code → Tests) |
| `capture-from-diff` | After implementation (fast mode) | Extracts lessons directly from code diffs when you skipped formal spec process (useful for bug fixes or rapid iteration) |
| `audit` | When memory feels noisy or stale | Finds duplicates, stale entries, contradictions, misplaced content; suggests cleanup and rewrites |
| `log-finding` | When audit finds something actionable | Converts a high-signal audit finding into a tracked task for GitHub, GitLab, Jira, or other issue tracker |
| `token-report` | When evaluating optimizer ROI | Compares estimated token usage between full memory reads and optimized synthesis |
| `index-docs` | Once to build the doc cache, then at session start | Indexes specs, plans, tasks, constitutions, and READMEs into SQLite. Covers CLI commands: `index-docs`, `refresh-docs`, `search-docs`, `synthesize-docs`, `audit-docs`. Writes `doc-synthesis.md` per feature for low-token doc retrieval. |
| `init-project` | Once to configure project tech profile | Profiles primary programming language and optional web framework to configure cross-project sharing sync channels. Available as a Spec Kit command and MCP tool; no standalone CLI subcommand yet. |
| `share-lesson` | When a validated local lesson is ready to be shared | Strips project real paths and promotes local lessons securely to the global shared cross-project SQLite database. Available through MCP today; no standalone CLI subcommand yet. |
| `sync-shared` | To pull down global lessons from other projects | Syncs language/framework specific lessons from other projects and writes them to a local review file `SHARED_LESSONS.md`. Available as a Spec Kit command and MCP tool; no standalone CLI subcommand yet. |

All commands use the fully-qualified form: `speckit.memory-md.<command>`.

---

## Workflow

### Bootstrap (One-Time Setup)

**Before you start any features**, initialize the memory system:

1. Run `/speckit.memory-md.init` to create the memory folder structure and starter templates.
2. Fill in `docs/memory/PROJECT_CONTEXT.md` — product identity, domain language, key constraints.
3. Fill in `docs/memory/ARCHITECTURE.md` — system shape, module boundaries, integrations, and key technologies.
4. Optional: Fill in `docs/memory/DECISIONS.md` and `docs/memory/BUGS.md` if you have existing lessons.

### New Feature

1. **`/specify`** — Write the initial feature spec. Use the memory index for any needed context; do not read the full memory folder by default.
2. **`/speckit.memory-md.plan-with-memory`** — Synthesize relevant memory. Create `specs/<feature>/memory.md` and `memory-synthesis.md`. Block or resolve hard conflicts before continuing.
3. **`/plan`** — Generate technical plan using `specs/<feature>/memory-synthesis.md`.
4. **`/tasks`** — Generate tasks using `memory-synthesis.md`. Rerun `plan-with-memory` if anything changed.
5. **`/implement`** — Re-read only `memory-synthesis.md` during normal flow. Treat watchpoints as active constraints during coding.
6. **After `/verify`** — Run `/speckit.memory-md.capture`. Approve durable memory only if the lesson is evidenced and reusable.

### Bug Fix

1. Read `{memory_root}/INDEX.md` and any active feature memory.
2. Refresh `memory-synthesis.md` if the fix belongs to active work.
3. Fix and verify.
4. If the root cause is reusable: run capture and approve updates to `BUGS.md` plus `INDEX.md`.

### Memory Cleanup

1. Run `/speckit.memory-md.audit`.
2. Review suggested removals, merges, and rewrites.
3. Keep only entries that are durable, concise, and useful for future work.

### Advanced: Rapid Iteration (Bug Fixes / Vibe Coding)

If you're working outside formal specs (e.g., quick bug fix):

1. Fix and test the change.
2. Run `/speckit.memory-md.capture-from-diff` to extract lessons directly from the diff.
3. Review suggested captures and approve only what's truly reusable.

### Advanced: Using log-finding

After running audit:

1. If a finding is actionable and should become a task: run `/speckit.memory-md.log-finding`.
2. This converts the finding into a tracker-ready issue (GitHub, GitLab, Jira, etc.).
3. Reduces back-and-forth between memory review and task tracking.

### Upgrading from a Previous Version

To upgrade your global extension to the latest version:
1. Run `specify extension update memory-md` in your terminal.
2. The new prompt files and templates will be downloaded to `.specify/extensions/memory-md/`.
3. In each upgraded project, run `/speckit.memory-md.prepare-context --feature specs/<feature>` once to resync the local caches and regenerate `memory-synthesis.md` if needed.
4. If the project is very old or the cache was never built before, `prepare-context` will do a first-time `index-memory` / `index-docs` pass automatically. If you prefer to do it manually, use `npx speckit-memory index-memory` and `npx speckit-memory index-docs` inside `.specify/extensions/memory-md/`.

**Migrating an Existing Project:**

If your project was using an older version of `memory-hub` (especially versions prior to v0.8.0 that lacked `INDEX.md` or the SQLite Optimizer):

1. **Re-run Init**: You **should** run `/speckit.memory-md.init` again. The init command is completely safe—it **will not** overwrite your existing memory files. It will only inject missing files (like a missing `INDEX.md` or `config.yml`).
2. **Re-index Memory**: If an `INDEX.md` was just generated for the first time, you will need to manually review your existing `docs/memory/*.md` files and populate the new `INDEX.md` with pointers to your existing decisions.
3. **Build the Optimizer**: If you want to use the local SQLite optimizer, it requires a Node.js binary. Because `specify extension update` does not run `npm install` for you, you must navigate to the extension directory and build it:
   ```bash
   cd .specify/extensions/memory-md
   npm install && npm run build
   ```

---

## Templates and Prompts

### What Are Templates?

When you run `/speckit.memory-md.init`, Memory Hub creates starter files in your project from the hub's `templates/` directory:

| Template Files | Created In Project | Purpose |
| --- | --- | --- |
| `INDEX.md`, `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, etc. | `docs/memory/` | Pre-populated memory file templates for you to customize with your project context |
| Feature starter template | `specs/<feature_name>/` | Includes example `memory.md`, `memory-synthesis.md`, spec, plan, and tasks starters |
| `.github/copilot-instructions.md` | `.github/` | Pre-populated Copilot agent instructions requiring memory review before planning and implementation |
| `config.yml` | `.specify/extensions/memory-md/` | Default configuration (can be customized to change memory folder path, feature scope, etc.) |

You can customize all templates after init. They are just starter content.

### What Are Prompts?

Prompts are the **instruction templates** that define how each Memory Hub command operates. They live in the hub at `templates/prompts/` and are not deployed to your projects.

| Prompt File | Used By | Purpose |
| --- | --- | --- |
| `bootstrap.memory.prompt.md` | `/speckit.memory-md.init` | Instructs init to create memory structure and templates correctly |
| `plan-with-memory.prompt.md` | `/speckit.memory-md.plan-with-memory` | Instructs synthesis to extract relevant constraints and decisions |
| `capture.memory.prompt.md` | `/speckit.memory-md.capture` | Instructs capture to extract durable lessons from full feature journey |
| `capture-from-diff.memory.prompt.md` | `/speckit.memory-md.capture-from-diff` | Instructs capture to extract lessons from code diffs |
| `audit.memory.prompt.md` | `/speckit.memory-md.audit` | Instructs audit to find duplicates, stale entries, contradictions |
| `log-finding.prompt.md` | `/speckit.memory-md.log-finding` | Instructs log-finding to convert audit findings into tasks |
| `governed-plan.architecture-guard.prompt.md` | `/speckit.architecture-guard.governed-plan` | Instructs planning to use memory-first synthesis and gated token reporting |
| `governed-tasks.architecture-guard.prompt.md` | `/speckit.architecture-guard.governed-tasks` | Instructs task generation to reuse synthesis and stay cache-first |
| `governed-implement.architecture-guard.prompt.md` | `/speckit.architecture-guard.governed-implement` | Instructs implementation to reuse synthesis and run post-implementation review |
| `specify.memory.prompt.md` | `/specify` (Spec Kit core command) | Instructs spec writing to incorporate memory context |

**These prompts are not customized per-project.** They are shared infrastructure that ensure consistent behavior across all projects using Memory Hub.

### Integration Model

When another extension wires into Memory Hub, the stable integration surface is:

- `/speckit.memory-md.prepare-context` for memory-first orchestration
- `memory-synthesis.md` for compact feature context
- The MCP tools exposed by the installed Memory Hub

Consumer extensions should:

- prefer the optimized MCP tool path
- avoid importing Memory Hub internals or assuming a specific launch mechanism
- rely on `memory-synthesis.md` instead of attempting full markdown scans

This keeps the extensions loosely coupled while enforcing the fast, SQLite-native workflow.

---

## Configuration

### When You Need to Configure

Configuration is **optional**. You only need it if:
- Your project uses non-standard folder paths (not `docs/memory/` or `specs/`)
- You want to change memory file names or behavior
- You need to enforce memory review gates

### How to Configure

Bootstrap creates a default config at `.specify/extensions/memory-md/config.yml`. To customize:

```bash
cp config-template.yml .specify/extensions/memory-md/config.yml
```

Then edit the YAML file:

| Key | Default | Purpose | Use Case |
| --- | --- | --- | --- |
| `memory_root` | `docs/memory` | Path to durable memory folder | Change if your project uses `knowledge/` or `.project-memory/` instead |
| `specs_root` | `specs` | Path to specs folder | Change if your project uses `features/` or `requirements/` |
| `use_project_copilot_instructions` | `true` | Maintain `.github/copilot-instructions.md` | Set to `false` if you manage Copilot instructions separately |
| `definition_of_done_includes_memory_review` | `true` | Require memory review before feature is done | Set to `false` if memory review is optional |
| `feature_memory_filename` | `memory.md` | Filename for per-feature active notes | Change if you prefer `context.md` or `notes.md` |
| `memory_synthesis_filename` | `memory-synthesis.md` | Filename for per-feature synthesis | Change if you prefer `constraints.md` or `synthesis.txt` |
| `show_token_banner` | `true` | Show the baseline / cached / saved token banner during cache-backed runs | Set to `false` if you want quieter command output |
| `require_memory_synthesis_before_plan` | `true` | Gate planning on current synthesis | Set to `false` to allow planning without synthesis |
| `require_memory_review_before_verify` | `true` | Gate verification on memory review | Set to `false` to allow verification without memory capture |
| `retrieval.max_index_entries` | `20` | Max index rows considered by memory planning workflows | Keeps index-first retrieval compact |
| `retrieval.max_memory_results` | `10` | Max durable memory results considered for search and synthesis | Raise only if the cache is very broad |
| `retrieval.max_synthesis_words` | `900` | Maximum size for generated `memory-synthesis.md` | Lower for stricter token budgets |
| `retrieval.full_scan_allowed` | `false` | Whether expensive full memory scans are allowed | Keep `false` for normal lightweight use |
| `optimizer.*` | See defaults | SQLite cache engine configuration | Leave as `sqlite` for standard performance |
| `indexing.*` | See defaults | File globs for optimizer indexing | Tune what gets cached locally |

Default config:

```yaml
memory_root: docs/memory
specs_root: specs
use_project_copilot_instructions: true
definition_of_done_includes_memory_review: true
feature_memory_filename: memory.md
memory_synthesis_filename: memory-synthesis.md
show_token_banner: true
require_memory_synthesis_before_plan: true
require_memory_review_before_verify: true
retrieval:
  max_index_entries: 20
  max_decisions: 5
  max_architecture_constraints: 5
  max_accepted_deviations: 3
  max_security_constraints: 3
  max_bug_patterns: 3
  max_worklog_items: 2
  max_synthesis_words: 900
  full_memory_read_allowed: false
optimizer:
  enabled: true
  engine: sqlite
  db_path: .spec-kit-memory/memory.sqlite
  auto_index_on_memory_change: true
  auto_index_on_doc_change: false
  auto_index_on_code_change: false
  auto_generate_synthesis: false
indexing:
  include:
    memory:
      - docs/memory/**/*.md
    docs:
      - docs/**/*.md
      - specs/**/*.md
      - README.md
    code:
      - src/**/*.{ts,tsx,js,jsx}
  exclude:
    - node_modules/**
    - dist/**
    - build/**
    - coverage/**
    - .git/**
    - .spec-kit-memory/**
```

---

## Extension Compatibility

`memory-md` is designed to work independently or as part of a governed workflow.

| Extension | Role |
| --- | --- |
| `memory-md` | Retrieves and synthesizes relevant memory |
| `security-review` | Produces security findings or constraints |
| `architecture-guard` | Validates architecture and orchestrates governed workflows |

`memory-md` does not enforce architecture or security rules. It provides context.

---

## IDE and Agent Compatibility

Memory Hub is a **Spec Kit extension**, not a VS Code-only tool. It works best when the host agent can do three things:

1. Read repository instruction files such as `AGENTS.md` or `.github/copilot-instructions.md`
2. Execute Spec Kit slash commands or equivalent local commands
3. Optionally connect to MCP over stdio for low-overhead memory operations

This extension ships repository-side files that agents expect:
- `docs/memory/` — durable project memory
- `.github/copilot-instructions.md` — Copilot-focused repository instructions
- `AGENTS.md` / `CODEX.md` / `CLAUDE.md` / `GEMINI.md` / `WINDSURF.md` / `ANTIGRAVITY.md` templates for agent-specific setup

### Minimum Compatibility Matrix

| Client | Repository Instructions | Spec Kit Commands | MCP | Status |
| --- | --- | --- | --- | --- |
| OpenAI Codex | `CODEX.md` + `AGENTS.md` | Via local shell / workflow docs | Yes (if MCP configured) | First-class |
| GitHub Copilot / Copilot Pro | `.github/copilot-instructions.md` | Via VS Code agent mode or terminal | Emerging (check your client) | Minimum-compatible |
| Claude Code / Claude Desktop | `CLAUDE.md` | Via local shell / workflow docs | Yes | First-class |
| Gemini CLI | `GEMINI.md` | Via local shell / workflow docs | Yes | First-class |
| Windsurf | `WINDSURF.md` | Via local shell / workflow docs | Yes when client exposes MCP | First-class |
| Antigravity | `ANTIGRAVITY.md` | Via local shell / workflow docs | Optional — depends on your build | Minimum-compatible |

> **Copilot Pro note**: GitHub Copilot Pro uses `.github/copilot-instructions.md` as its primary agent context file. When using Copilot in VS Code agent mode, Spec Kit slash commands are available directly. For Copilot Pro in other surfaces (github.com chat, CLI), use the terminal-based `npx speckit-memory` fallback path. MCP support for Copilot is emerging — check your VS Code Copilot extension version.

> **Codex note**: OpenAI Codex reads `AGENTS.md` by default. `CODEX.md` is a supplementary file for environments that support it. Both are injected by `/speckit.memory-md.init` when the agent file is detected or confirmed.

**Important:** the workflow language in this repo is capability-based on purpose. If a client does not support Spec Kit slash commands directly, the agent should still follow the same sequence: prepare context, read synthesis, implement, then capture lessons through the best available path.

For the broader ecosystem view, see [Spec Kit's supported agents and IDEs](https://spec-kit.dev).

**Note:** IDE-specific memory tools (VS Code memory sidebar, GitHub Copilot Memory) are controlled by your editor and GitHub settings. This extension provides the **repository conventions** that make those tools useful alongside your agent.
