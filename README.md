# 🧠 Memory Hub

> Durable project memory and context for AI-assisted development.

[![Version](https://img.shields.io/badge/version-0.8.3-22c55e)](extension.yml)
[![Spec Kit](https://img.shields.io/badge/Spec%20Kit-compatible-2563eb)](https://spec-kit.dev)
[![Repo-native](https://img.shields.io/badge/storage-repo--native-f59e0b)](https://spec-kit.dev)
[![Pre-1.0](https://img.shields.io/badge/status-pre--1.0-ef4444)](extension.yml)

## What Is This?

A Spec Kit extension that gives your project **persistent, Git-reviewable memory** so the AI and the team can reuse past decisions, constraints, bug patterns, and lessons across features.

It answers one question before every feature:

> What have we already learned that should influence this work?

## The Problem It Solves

Spec Kit drives delivery through `specify → plan → tasks → implement`. But each feature starts from scratch — the AI has no memory of what happened before.

Without memory:

- Feature #5 repeats the same database mistake you fixed in Feature #2
- A new developer doesn't know why you chose Repository pattern over Active Record
- The AI generates a plan that contradicts an architecture decision made 3 months ago
- You explain the same constraints in every prompt because the AI forgot

**Memory Hub solves this** by storing durable project knowledge in plain Markdown files inside your repo. Before planning, the AI reads a compact index, retrieves only relevant entries, and writes a focused synthesis. After delivery, only the lessons worth keeping are captured back with approval.

For projects that need even less token usage, there is an optional Node.js + SQLite local optimizer roadmap in [docs/optimizer-roadmap.md](docs/optimizer-roadmap.md). It treats SQLite as a searchable cache, not a source of truth.

## Extension Interoperability

This extension acts as a cooperative citizen in the Spec Kit ecosystem by sharing context through explicit handoff artifacts in the `specs/<feature>/` directory.

**The Governed Delivery Lifecycle:**
1. **`/specify`** -> Write initial feature spec.
2. **`/speckit.architecture-guard.governed-plan`** -> Orchestrates memory synthesis, technical planning, and security/architecture validation.
3. **`/speckit.architecture-guard.governed-tasks`** -> Orchestrates task generation with memory, security, and architecture refactor awareness.
4. **`/speckit.architecture-guard.governed-implement`** -> Orchestrates implementation with memory context and post-implementation governance review.

By using explicit markdown files, extensions remain decoupled, and all constraints and decisions are fully reviewable in Git.

---

## Usage Modes

Memory Hub operates in two primary modes:

### 1. Direct Usage

The user runs memory commands manually.

Example:

```text
/speckit.memory-md.plan-with-memory
/speckit.memory-md.capture
/speckit.memory-md.audit
```

### 2. Orchestrated Usage

Architecture Guard orchestrator commands may consume memory synthesis automatically when available.

Example:

```text
/speckit.architecture-guard.governed-plan
```

may use:

```text
specs/<feature>/memory-synthesis.md
```

as context.

---

## Using memory-md with Architecture Guard

memory-md can be used as a context provider for Architecture Guard governed workflows.

When Architecture Guard orchestrator commands are used, memory-md may provide scoped context synthesis through:

```text
specs/<feature>/memory-synthesis.md
```

Architecture Guard can then validate plans, tasks, or implementations with awareness of:

* previous decisions
* accepted deviations
* known architecture patterns
* relevant historical lessons

memory-md remains responsible for memory retrieval and synthesis.

Architecture Guard remains responsible for architecture validation and governance orchestration.

---

## Capture vs Synthesis

memory-md separates two different operations:

### Synthesis

Synthesis prepares relevant memory for the current workflow using index-first retrieval.

It is safe to use during governed workflows because it reads `{memory_root}/INDEX.md`, retrieves selected source sections, and summarizes only the context needed for the active feature.

Examples:

```text
memory-synthesis.md
```

Capture persists new durable memory. It should be **intentional and human-approved**.
While Architecture Guard orchestration does not automatically mutate project memory without approval, it now includes a **Mandatory Self-Learning Check** as the penultimate step in every implementation and review flow. This ensures the agent evaluates the execution for architectural lessons and is forced to propose any high-signal findings via `/speckit.memory-md.capture` before finalizing the governance summary.
Capture commands show proposed durable entries and index rows first. They write only after explicit approval.

---

## Memory Capture Candidates

When used with Architecture Guard, governed workflows may produce memory capture candidates.

Example:

```text
Memory Capture Candidates:
- Accepted deviation: Invoice export may use async processing during migration.
- Architecture decision: New validation boundaries use FormRequest classes.
- Security constraint: Pricing authority must remain server-side.
```

These are recommendations only.

They do not become durable memory until the user explicitly captures them.

---

## Orchestrated Workflow Example

```text
/speckit.architecture-guard.governed-plan
```

Possible internal flow:

```text
memory-md synthesis
↓
Spec Kit plan
↓
Security Review
↓
Architecture Guard violation detection
↓
Governance summary
↓
Optional memory capture candidates
```

In this flow:

* memory-md provides scoped context
* security-review provides security constraints
* architecture-guard validates architecture
* capture remains manual unless explicitly approved

---

# Recommended Memory Lifecycle

Memory Hub is a **context and knowledge layer** that runs alongside Spec Kit workflows. It ensures the AI learns from the past before planning the future.

| Milestone | Recommended Command | Phase Integration | Purpose |
| --- | --- | --- | --- |
| **Milestone: Foundation** | `bootstrap` | Once at project setup | Create the memory structure and initial project context. |
| **Milestone: Synthesis** | `plan-with-memory` | After `/specify` | Read the memory index, retrieve selected entries, and synthesize active constraints. |
| **Milestone: Strategy** | `plan-with-memory` | After `/tasks` | Ensure the technical plan and tasks respect known constraints. |
| **Milestone: Self-Learning** | `capture` | **Mandatory Step** after `/verify` | Extract and store only the durable lessons for future features (Approval Gated). |

---

## What to Capture

The `capture` command should be used selectively. To help you decide what belongs in durable memory, use the **Durable Lesson Test**:

1.  **Is it reusable?** Will this knowledge help a different feature 3 months from now?
2.  **Is it evidenced?** Did we actually prove this lesson during implementation?
3.  **Is it unique?** Is this something that isn't already obvious from the code or the constitution?

### Examples
- ✅ **Capture**: "The external Payment API requires a 15s timeout for production webhooks."
- ✅ **Capture**: "We decided to avoid the `XYZ` library because it has threading issues with our DB driver."
- ❌ **Skip**: "Added a new field to the User model." (Already in Git)
- ❌ **Skip**: "Fixed a typo in the login page." (Trivial)

---

## Choosing Your Capture Style

You don't need to run both capture commands. Choose the one that fits your current task:

| Command | Best For | Inputs |
| --- | --- | --- |
| **`capture`** | **Full Features** | Reflects on the journey from Spec → Plan → Code. Best for capturing **Intent and Rationale**. |
| **`capture-from-diff`**| **Bug Fixes / "Vibe Coding"** | Extracts lessons directly from the code changes. Best for **Technical Gotchas** when you skipped the formal Spec process. |

---

### Key Behavior: Selective, Not Automatic

Memory is curated, not dumped. The guiding principle:

> If this information will help future work make better decisions, store it. If not, leave it out.

Not memory: logs, full implementation history, temporary notes, trivial refactors. Use Git for those.

## Retrieval Intelligence

memory-md should avoid loading all memory into every workflow.

Synthesis should prioritize:

- current feature scope
- affected modules
- active decisions
- accepted deviations
- relevant security constraints
- recent decisions that supersede older ones

Synthesis should avoid:

- deprecated decisions
- unrelated history
- stale notes
- full memory dumps

## Optional Optimizer

The markdown workflow is the default. A local Node.js + SQLite optimizer is an optional enhancement for larger repos or teams that want faster retrieval before the AI reads context.

Core model:

- Markdown, spec, and code files remain authoritative
- SQLite is a generated searchable cache
- `memory-synthesis.md` stays the small AI-readable context package
- the LLM reads synthesis or search results first, not all files

The optimizer is described in [docs/optimizer-roadmap.md](docs/optimizer-roadmap.md) and is intentionally phased:

1. Cache durable memory only
2. Cache development docs and Spec Kit artifacts
3. Cache code symbols to reduce duplication

The cache must always be rebuildable from repository sources.

To enable the optimizer in a project, update `.specify/extensions/memory-md/config.yml` and set `optimizer.enabled: true` after bootstrap. Bootstrap should ask whether you want that opt-in path and explain the minimum requirements first.
When the user approves, bootstrap can prepare the optimizer automatically by verifying or installing the required Node dependencies once, then continue in one-shot CLI mode.

Minimum requirements for the optional optimizer:

- Node.js 18+
- npm
- local filesystem access to the repo
- ability to install the `better-sqlite3` native dependency if a prebuilt binary is unavailable

If you skip the optimizer, Memory Hub continues in markdown-first mode with no SQLite dependency.

Phase 1 commands:

```text
# If using the installed extension (standard):
npx .specify/extensions/memory-md speckit-memory index-memory
npx .specify/extensions/memory-md speckit-memory search-memory "query"
npx .specify/extensions/memory-md speckit-memory synthesize --feature specs/<feature>
npx .specify/extensions/memory-md speckit-memory refresh-memory
npx .specify/extensions/memory-md speckit-memory rebuild-memory
npx .specify/extensions/memory-md speckit-memory audit-memory
npx .specify/extensions/memory-md speckit-memory token-report --feature specs/<feature>
```

For local development inside this repository, run `npm install` and `npm run build`, then execute `node dist/bin/speckit-memory.js ...` against a project root.

When the optimizer is enabled, the Memory Hub command flow should refresh the cache, generate `memory-synthesis.md`, and then consume that synthesis first. When it is disabled or unavailable, the markdown-first index and synthesis prompts still work on their own.

### Why Memory Synthesis Exists
The goal is not to load all memory. The goal is to provide the minimum high-value context needed for accurate reasoning. Memory synthesis acts as a focused lens, translating years of project history into exactly what matters for the current feature.

## Token Usage Model

Memory Hub is not designed to load all memory into every AI request.

Normal workflow:
1. Read feature spec.
2. Read memory index.
3. Retrieve only relevant entries.
4. Produce compact `memory-synthesis.md`.
5. Use `memory-synthesis.md` for planning/tasks/implementation.

Expensive operations:
- full audit
- manual capture review
- rebuilding the index

These should be intentional, not automatic.

Manual trigger is intentional. Capture is manual. Synthesis can be run before planning, tasks, or implementation. The extension is useful only when memory prevents repeated mistakes or improves future features.
`token-report` uses estimated token counts; it is a planning aid, not provider billing telemetry.

If you want a command-palette mapping for a future VS Code wrapper, these are the intended labels:

- `Spec Kit Memory: Refresh Cache`
- `Spec Kit Memory: Generate Synthesis`
- `Spec Kit Memory: Audit Cache`
- `Spec Kit Memory: Token Report`

## Relationship to Architecture Guard
- **Memory Hub** provides contextual synthesis (the "What did we decide?").
- **Architecture Guard** enforces architecture standards (the "Are we breaking the rules?").
Memory Hub does not enforce architecture rules or block implementation on its own.

## Non-Goals

memory-md does not:

- enforce architecture rules
- perform security review
- automatically approve durable memory capture
- replace Architecture Guard orchestration
- load all memory into every workflow

## Benefits

### Compared to Spec Kit Alone

| Spec Kit Only | Spec Kit + Memory Hub |
| --- | --- |
| AI starts each feature from zero context | AI reads past decisions and constraints before planning |
| Same mistakes get repeated across features | Bug patterns and lessons are visible and reusable |
| "Why did we do it this way?" lives in someone's head | Decisions are documented with rationale and tradeoffs |
| New developers read code, guess at intent | `PROJECT_CONTEXT.md` and `ARCHITECTURE.md` provide structured onboarding |
| Prompts bloat as you re-explain context every time | `memory-synthesis.md` gives the AI a compact working summary |

### Compared to Personal Agent Memory (claude-mem, etc.)

| Personal Agent Memory | Memory Hub |
| --- | --- |
| One person's tool, invisible to the team | Visible in Git, reviewable by everyone |
| Disappears when you switch tools | Lives in the repo, survives tool and team changes |
| Auto-captured, grows noisy | Curated — only durable lessons are kept |
| Good for individual flow and preferences | Good for shared project knowledge and team alignment |

**They complement each other.** Use personal memory for your own preferences. Use Memory Hub for knowledge the team needs to trust.

## When To Use It

**Use it when:**

- Your project has **recurring decisions** that keep coming up (architecture choices, API conventions, data access patterns)
- You're working across **multiple features** and context from past work should influence future work
- Your team has **more than one person** (or one person who forgets things between sprints)
- You want AI-assisted development to **get better over time** instead of restarting from zero
- Bug patterns keep recurring and you want to **prevent them structurally**

**Best fit:**

- Ongoing projects with 5+ features
- Teams of 2+ developers
- AI-heavy workflows where prompt quality matters
- Projects where onboarding speed matters

## When NOT To Use It

**Don't use it for:**

- **Throwaway experiments** — there's nothing worth remembering
- **One-off scripts** — no future features to benefit from memory
- **Projects where you want zero-maintenance** — this requires conscious curation
- **Full historical archives** — use Git history for that, not memory
- **Automatic everything** — this is selective and intentional by design

**The honest test:** If your project will have fewer than 5 features and only one developer, the overhead of maintaining memory files probably isn't worth it yet. Just use Spec Kit.

---

## Quick Start

1. **Install** the extension (see [Installation](#installation) section below for all methods)
2. **Initialize** the memory structure:
   ```text
   /speckit.memory-md.init
   ```
3. **Fill in** the two most important source files and the index:
   - `docs/memory/PROJECT_CONTEXT.md` — what this project is, key constraints
   - `docs/memory/ARCHITECTURE.md` — system shape, boundaries, integrations
   - `docs/memory/INDEX.md` — compact routing rows for relevant decisions, constraints, and bug patterns
4. **Start** a feature with synthesis:
   ```text
   /speckit.memory-md.plan-with-memory
   ```
5. **Capture** only durable lessons after delivery:
   ```text
   /speckit.memory-md.capture
   ```

That's it. Steps 4–5 repeat for each feature.

---

## Installation

### From Extension Registry

```text
specify extension add memory-md
```

### From GitHub

```text
specify extension add memory-md --from \
  https://github.com/DyanGalih/spec-kit-memory-hub/archive/refs/tags/v0.8.3.zip
```

### Local Development

```bash
specify extension add --dev /path/to/spec-kit-memory-hub
```

### Manual Install (Without Spec Kit CLI)

```bash
# Copy starter files into a project
scripts/install-into-project.sh /path/to/hub /path/to/project

# Sync copilot instructions only
scripts/sync-from-hub.sh /path/to/hub /path/to/project
```

### Verification and CI

```bash
# Check a project's memory structure
scripts/check-memory.sh /path/to/project

# Smoke test the hub itself
scripts/test-install.sh

# Smoke test the optimizer CLI
scripts/test-cli.sh
```

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

You can customize all templates after bootstrap. They are just starter content.

### What Are Prompts?

Prompts are the **instruction templates** that define how each Memory Hub command operates. They live in the hub at `templates/prompts/` and are not deployed to your projects.

| Prompt File | Used By | Purpose |
| --- | --- | --- |
| `bootstrap.memory.prompt.md` | `/speckit.memory-md.bootstrap` | Instructs bootstrap to create memory structure and templates correctly |
| `plan-with-memory.prompt.md` | `/speckit.memory-md.plan-with-memory` | Instructs synthesis to extract relevant constraints and decisions |
| `capture.memory.prompt.md` | `/speckit.memory-md.capture` | Instructs capture to extract durable lessons from full feature journey |
| `capture-from-diff.memory.prompt.md` | `/speckit.memory-md.capture-from-diff` | Instructs capture to extract lessons from code diffs |
| `audit.memory.prompt.md` | `/speckit.memory-md.audit` | Instructs audit to find duplicates, stale entries, contradictions |
| `log-finding.prompt.md` | `/speckit.memory-md.log-finding` | Instructs log-finding to convert audit findings into tasks |
| `specify.memory.prompt.md` | `/specify` (Spec Kit core command) | Instructs spec writing to incorporate memory context |

**These prompts are not customized per-project.** They are shared infrastructure that ensure consistent behavior across all projects using Memory Hub.

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
| `require_memory_synthesis_before_plan` | `true` | Gate planning on current synthesis | Set to `false` to allow planning without synthesis |
| `require_memory_review_before_verify` | `true` | Gate verification on memory review | Set to `false` to allow verification without memory capture |
| `retrieval.max_index_entries` | `20` | Max index rows considered by memory planning workflows | Keeps index-first retrieval compact |
| `retrieval.max_memory_results` | `10` | Max durable memory results considered for search and synthesis | Raise only if the cache is very broad |
| `retrieval.max_synthesis_words` | `900` | Maximum size for generated `memory-synthesis.md` | Lower for stricter token budgets |
| `retrieval.full_scan_allowed` | `false` | Whether expensive full memory scans are allowed | Keep `false` for normal lightweight use |
| `optimizer.*` | See defaults | Optional SQLite cache for faster search and synthesis | Keep disabled for basic markdown-only usage |
| `indexing.*` | See defaults | File globs for optional optimizer indexing | Tune what gets cached locally |

Default config:

```yaml
memory_root: docs/memory
specs_root: specs
use_project_copilot_instructions: true
definition_of_done_includes_memory_review: true
feature_memory_filename: memory.md
memory_synthesis_filename: memory-synthesis.md
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
  enabled: false
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

memory-md is designed to work independently or as part of a governed workflow.

| Extension | Role |
| --- | --- |
| memory-md | Retrieves and synthesizes relevant memory |
| security-review | Produces security findings or constraints |
| architecture-guard | Validates architecture and orchestrates governed workflows |

memory-md does not enforce architecture or security rules. It provides context.

---

## IDE and Agent Compatibility

Memory Hub is a **Spec Kit extension**, not a VS Code-only tool. It works with any IDE and AI agent that Spec Kit supports.

This extension ships repository-side files that agents expect:
- `docs/memory/` — durable project memory
- `.github/copilot-instructions.md` — agent instructions template

**Supported IDEs/Agents:**
- VS Code + GitHub Copilot
- Cursor IDE (any agent)
- JetBrains IDEs (Spec Kit CLI)
- Any CLI-compatible environment with a Spec Kit-compatible agent

For the full compatibility matrix, see [Spec Kit's supported agents and IDEs](https://spec-kit.dev).

**Note:** IDE-specific memory tools (VS Code memory sidebar, GitHub Copilot Memory) are controlled by your editor and GitHub settings. This extension provides the **repository conventions** that make those tools useful alongside your agent.

---

## Project Structure

### In Your Project (After Bootstrap)

These files are created in your project by bootstrap:

```text
your-project/
├── .github/
│   └── copilot-instructions.md          ← Enforces memory in workflow
├── .specify/extensions/memory-md/
│   └── config.yml                      ← Your customizations (optional)
├── docs/
│   └── memory/
│       ├── INDEX.md                       ← Compact routing map
│       ├── PROJECT_CONTEXT.md             ← Product, domain, key constraints
│       ├── ARCHITECTURE.md                ← System shape, boundaries
│       ├── DECISIONS.md                   ← Architecture and tech choices
│       ├── BUGS.md                        ← Recurring patterns to prevent
│       └── WORKLOG.md                     ← Project milestone notes
└── specs/
    └── <feature>/
        ├── spec.md
        ├── plan.md
        ├── tasks.md
        ├── memory.md                      ← Feature-local notes
        └── memory-synthesis.md            ← AI-facing constraints summary
```

### In the Memory Hub Repository (Not Deployed)

These are the hub's infrastructure files:

```text
spec-kit-memory-hub/
├── package.json                 ← Node package for the optimizer CLI
├── package-lock.json            ← Locked dependency graph
├── tsconfig.json                ← TypeScript build config
├── bin/
│   └── speckit-memory.ts        ← CLI entrypoint source
├── src/
│   ├── cli/
│   ├── db/
│   ├── indexing/
│   ├── retrieval/
│   ├── synthesis/
│   ├── audit/
│   ├── config/
│   ├── utils/
│   └── types/
├── extension.yml                 ← Extension manifest
├── config-template.yml           ← Default configuration template
├── commands/                     ← Spec Kit command definitions
│   └── speckit.memory-md.*.md       ← 7 main commands
├── scripts/
│   ├── bash/
│   │   └── detect-changed-files.sh
│   ├── powershell/
│   │   └── detect-changed-files.ps1
│   ├── install-into-project.sh
│   ├── check-memory.sh
│   ├── test-install.sh
│   └── test-cli.sh
└── templates/                    ← Starter files
    ├── prompts/                      ← Instruction prompts (NOT deployed)
    │   ├── bootstrap.memory.prompt.md
    │   ├── plan-with-memory.prompt.md
    │   ├── capture*.prompt.md
    │   ├── audit.memory.prompt.md
    │   ├── log-finding.prompt.md
    │   └── specify.memory.prompt.md
    ├── docs/memory/                  ← Template starter files
    │   ├── INDEX.md
    │   ├── PROJECT_CONTEXT.md
    │   ├── ARCHITECTURE.md
    │   ├── DECISIONS.md
    │   ├── BUGS.md
    │   └── WORKLOG.md
    ├── specs/
    │   └── 001-example-feature/      ← Example feature template
    ├── .github/
    │   └── copilot-instructions.md   ← Template instructions
    ├── scripts/
    │   └── test-cli.sh               ← CLI smoke test for the optimizer
    └── docs/                         ← Extension documentation
```

**Key distinction:**
- **Deployed to projects**: Memory files, config, instructions
- **Stays in hub**: Prompts, templates (as reference), documentation

---

## Optional: Local SQLite Optimizer

For massive projects where reading multiple markdown files consumes too many tokens, Memory Hub includes a **local SQLite cache optimizer**.

When enabled, the CLI (`npx speckit-memory`) parses all markdown memory files, chunks them by section, calculates token costs, and stores them in a local `.specify/extensions/memory-md/cache.db`.

### How it is Wired to the LLM Commands

You do **not** need to run `npx speckit-memory` manually. The LLM commands (like `/speckit.memory-md.plan-with-memory`) are explicitly programmed to detect if the optimizer is enabled. 

When the LLM runs a command, it follows this internal logic:
1. It reads `.specify/extensions/memory-md/config.yml`.
2. If `optimizer.enabled: true`, the LLM executes the command line hook (`{SCRIPT}` or direct `npx speckit-memory refresh-memory`).
3. The Node.js binary updates the SQLite cache in the background.
4. The LLM runs `npx speckit-memory synthesize` to generate a highly compressed `memory-synthesis.md`.
5. The LLM reads only the final compressed synthesis file, saving thousands of context tokens.

### Enabling the Optimizer

If you run `/speckit.memory-md.bootstrap`, the AI will ask if you want to enable the optimizer and will attempt to run `npm install` automatically for you. 

If that fails, or if you are enabling it manually on an existing setup:
1. Edit `.specify/extensions/memory-md/config.yml` in your project and set:
   ```yaml
   optimizer:
     enabled: true
   ```
2. Navigate to the extension directory and build the Node.js binary:
   ```bash
   cd .specify/extensions/memory-md
   npm install && npm run build
   ```
3. That's it! The LLM prompts will automatically switch to using the `npx speckit-memory` caching workflows.

---

## First 10 Minutes: A Concrete Example

**1. Bootstrap:**
```text
/speckit.memory-md.bootstrap
```

**2. Fill in project context:**
```markdown
# Project Context
Last reviewed: 2026-04-22

## Product / Service
Internal support dashboard for triaging customer issues.

## Key Constraints
- Customer notes must stay inside the internal admin system.
- AI agents should not introduce flows that bypass role-based access.
```

**3. Start a feature:**
```markdown
# Feature Memory — 042-note-search

## Relevant Durable Memory
- Customer note writes must stay in the API service.

## Open Questions
- Should search include archived notes?
```

**4. Create synthesis before planning:**
```markdown
# Memory Synthesis
feature: 042-note-search
hard_conflicts: 0 | soft_conflicts: 1

## Current Constraints
- [C1] Search must respect role-based access.

## Reused Decisions
- [D1] Customer note writes stay in the API service.

## Implementation Watchpoints
- [W1] Apply permission filtering before returning search results.
```

**5. Plan and implement** with `/speckit.memory-md.plan-with-memory`.

**6. Capture** only if the feature revealed something durable. If not, leave memory unchanged.

---

## Design Philosophy

- Memory should be **curated, not automatic**
- Knowledge should be **visible in Git**
- Specs and memory should remain **separate**
- AI should **use memory, not replace thinking**

## Further Reading

- [docs/governed-memory-workflow.md](docs/governed-memory-workflow.md) — full workflow design and migration guidance
- [docs/architecture.md](docs/architecture.md) — layer model and design principles
- [docs/comparison.md](docs/comparison.md) — comparison with personal agent memory tools
- [docs/adoption-playbook.md](docs/adoption-playbook.md) — phased rollout guidance
