# 🧠 Memory Hub

> Durable project memory and context for AI-assisted development.

[![Version](https://img.shields.io/badge/version-0.7.0-22c55e)](extension.yml)
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

**Memory Hub solves this** by storing durable project knowledge in plain Markdown files inside your repo. Before planning or implementing, the AI reads what the project has already learned. After delivery, only the lessons worth keeping are captured back.

## Extension Interoperability (vNext)

This extension acts as a cooperative citizen in the Spec Kit ecosystem by sharing context through explicit handoff artifacts in the `specs/<feature>/` directory.

**The Governance Workflow:**
1. `/specify` -> Write initial feature spec.
2. `/speckit.memory-md.plan-with-memory` -> Emits `specs/<feature>/memory-synthesis.md` (Historical Context).
3. `/speckit.security-review.specify` (or audit) -> Emits `specs/<feature>/security-constraints.md` (Trust Boundaries).
4. `/speckit.architecture-guard.architecture-review` -> Validates the feature against the Constitution, Memory Synthesis, and Security Constraints. Emits `architecture-findings.md`.
5. `/speckit.architecture-guard.refactor-generator` -> Creates an incremental `architecture-migration-plan.md` to resolve drift safely.

By using explicit markdown files, extensions remain decoupled, and all constraints and decisions are fully reviewable in Git.

# Recommended Memory Lifecycle

Memory Hub is a **context and knowledge layer** that runs alongside Spec Kit workflows. It ensures the AI learns from the past before planning the future.

| Milestone | Recommended Command | Phase Integration | Purpose |
| --- | --- | --- | --- |
| **Milestone: Foundation** | `bootstrap` | Once at project setup | Create the memory structure and initial project context. |
| **Milestone: Synthesis** | `plan-with-memory` | After `/specify` | Read past decisions and synthesize them into active constraints. |
| **Milestone: Strategy** | `plan-with-memory` | After `/tasks` | Ensure the technical plan and tasks respect known constraints. |
| **Milestone: Capture** | `capture` | After implementation | Extract and store only the durable lessons for future features. |

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
Memory Hub uses scoped, high-signal retrieval instead of maximum memory loading.
- **Prioritization**: Prioritizes direct feature scope, active architecture decisions, and accepted deviations before historical bugs.
- **Conflict Handling**: Newer accepted decisions overwrite older ones. Unresolved conflicts are explicitly surfaced to the user.
- **Budgets**: Imposes strict retrieval limits (e.g., max 5 core decisions) to prevent context window bloat and AI confusion.

## Why Memory Synthesis Exists
The goal is not to load all memory. The goal is to provide the minimum high-value context needed for accurate reasoning. Memory synthesis acts as a focused lens, translating years of project history into exactly what matters for the current feature.

## Relationship to Architecture Guard
- **Memory Hub** provides contextual synthesis (the "What did we decide?").
- **Architecture Guard** enforces architecture standards (the "Are we breaking the rules?").
Memory Hub does not enforce architecture rules or block implementation on its own.

## Non-Goals
Memory Hub is NOT:
- a full knowledge graph or vector database.
- a full repository ingestion engine.
- a memory dump system.
- an architecture enforcement engine.

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

1. Install the extension:
   ```text
   specify extension add memory-md
   ```

2. Bootstrap the memory structure:
   ```text
   /speckit.memory-md.bootstrap
   ```

3. Fill in the two most important files:
   - `docs/memory/PROJECT_CONTEXT.md` — what this project is, key constraints
   - `docs/memory/ARCHITECTURE.md` — system shape, boundaries, integrations

4. Start a feature with memory:
   ```text
   /speckit.memory-md.plan-with-memory
   ```

5. After delivery, capture only durable lessons:
   ```text
   /speckit.memory-md.capture
   ```

That's it. Steps 4–5 repeat for each feature.

---

## Memory Structure

### Durable Memory (`docs/memory/`)

These files hold knowledge that helps **all future features**, not just the current one:

| File | Purpose | Example Content |
| --- | --- | --- |
| `PROJECT_CONTEXT.md` | Product identity, domain language, key constraints | "Customer notes must stay inside the internal admin system" |
| `ARCHITECTURE.md` | System shape, ownership boundaries, integrations | "Only the API service writes customer note records" |
| `DECISIONS.md` | Cross-feature decisions with rationale and tradeoffs | "Chose Repository pattern because we need to swap DB later" |
| `BUGS.md` | Recurring failure patterns, root causes, prevention | "Always filter by permission before returning search results" |
| `WORKLOG.md` | Small durable lessons that don't fit elsewhere | "The CSV export endpoint needs 2x the normal timeout" |

### Feature Memory (`specs/<feature>/`)

These files help the **current feature only**:

| File | Purpose |
| --- | --- |
| `memory.md` | Active notes, open questions, relevant durable memory for this feature |
| `memory-synthesis.md` | Compact AI-facing summary: constraints, reused decisions, conflicts, watchpoints |

**Rule of thumb:**
- If it helps future unrelated features → `docs/memory/`
- If it only matters during this feature → `specs/<feature>/`

---

## Commands

| Command | When To Use | What It Does |
| --- | --- | --- |
| `bootstrap` | Once, at project setup | Creates `docs/memory/` files, feature templates, and copilot instructions |
| `plan-with-memory` | Before planning each feature | Reads memory, refreshes synthesis, surfaces conflicts and watchpoints |
| `capture` | After meaningful work is done | Reviews what happened, captures only durable lessons to memory |
| `capture-from-diff` | After implementation (fast mode) | Extracts lessons directly from code changes |
| `audit` | When memory feels noisy or stale | Finds duplicates, stale entries, contradictions; suggests cleanup |
| `log-finding` | When an audit finding should become a task | Converts a finding into a tracked task or bug |

All commands use the fully-qualified form: `speckit.memory-md.<command>`.

---

## Workflow

### New Feature

1. **`/specify`** — Read constitution + durable memory. Create `specs/<feature>/memory.md` and `memory-synthesis.md`.
2. **`/plan`** — Run `/speckit.memory-md.plan-with-memory`. Block or resolve hard conflicts before continuing.
3. **`/tasks`** — Rerun `plan-with-memory` if anything changed. Keep tasks aligned with synthesis watchpoints.
4. **`/implement`** — Re-read `memory-synthesis.md`. Treat watchpoints as active constraints.
5. **After `/verify`** — Run `/speckit.memory-md.capture`. Update durable memory only if the lesson is evidenced and reusable.

### Bug Fix

1. Read `BUGS.md`, `DECISIONS.md`, and any active feature memory.
2. Refresh `memory-synthesis.md` if the fix belongs to active work.
3. Fix and verify.
4. If the root cause is reusable: add it to `BUGS.md` with evidence and prevention guidance.

### Memory Cleanup

1. Run `/speckit.memory-md.audit`.
2. Review suggested removals, merges, and rewrites.
3. Keep only entries that are durable, concise, and useful for future work.

---

## Configuration

Copy `config-template.yml` into your project and adjust:

```bash
cp config-template.yml .specify/extensions/memory-md/config.yml
```

| Key | Default | Purpose |
| --- | --- | --- |
| `memory_root` | `docs/memory` | Path to durable memory folder |
| `specs_root` | `specs` | Path to specs folder |
| `use_project_copilot_instructions` | `true` | Maintain `.github/copilot-instructions.md` |
| `definition_of_done_includes_memory_review` | `true` | Require memory review before feature is done |
| `feature_memory_filename` | `memory.md` | Filename for per-feature memory |
| `memory_synthesis_filename` | `memory-synthesis.md` | Filename for per-feature synthesis |
| `require_memory_synthesis_before_plan` | `true` | Gate planning on current synthesis |
| `require_memory_review_before_verify` | `true` | Gate verification on memory review |

---

## Companion Extensions

Memory Hub is designed to work alongside:

| Extension | Relationship |
| --- | --- |
| **Architecture Guard** | Reads memory context for architecture reviews. Memory Hub is read-only context, not a write target. |
| **Security Review** | Can reference memory for security-relevant constraints. Separate ownership. |

Memory Hub provides context. Other extensions consume it. No extension writes to memory on your behalf.

---

## Installation

### From Extension Registry

```text
specify extension add memory-md
```

### From GitHub

```text
specify extension add memory-md --from \
  https://github.com/DyanGalih/spec-kit-memory-hub/archive/refs/tags/v0.7.0.zip
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
```

---

## VS Code Copilot Agents

This extension ships the repository-side files that Copilot agents expect (`docs/memory/`, `.github/copilot-instructions.md`). The VS Code memory tool and GitHub-hosted Copilot Memory are controlled by your editor and GitHub settings — this extension provides the repo conventions that make those agents useful on your codebase.

---

## Project Structure

### In Your Project (After Bootstrap)

```text
your-project/
├── .github/
│   └── copilot-instructions.md
├── docs/
│   └── memory/
│       ├── PROJECT_CONTEXT.md
│       ├── ARCHITECTURE.md
│       ├── DECISIONS.md
│       ├── BUGS.md
│       └── WORKLOG.md
└── specs/
    └── <feature>/
        ├── spec.md
        ├── plan.md
        ├── tasks.md
        ├── memory.md
        └── memory-synthesis.md
```

### The Extension Hub Itself

```text
spec-kit-memory-hub/
├── extension.yml                 ← Extension manifest
├── config-template.yml           ← Default configuration
├── commands/                     ← Spec Kit command definitions
├── templates/                    ← Starter files for target projects
│   ├── docs/memory/
│   ├── specs/
│   ├── prompts/
│   └── .github/
├── scripts/                      ← Install, sync, check, and test scripts
└── docs/                         ← Extension documentation
```

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

- [docs/memory-workflow-v0.6.md](docs/memory-workflow-v0.6.md) — full workflow design and migration guidance
- [docs/architecture.md](docs/architecture.md) — layer model and design principles
- [docs/comparison.md](docs/comparison.md) — comparison with personal agent memory tools
- [docs/adoption-playbook.md](docs/adoption-playbook.md) — phased rollout guidance
