# Spec Kit Memory (Markdown-first)

A **Spec Kit extension** for **repository-native Markdown memory** that captures durable decisions, bugs, and project context.

It helps teams:

- keep important decisions visible
- avoid repeating mistakes
- improve AI-assisted development with better context

---

# 🧠 Current Scope

The current pre-1.0 release is intentionally simple:

- **repo-first**
- **file-structured**
- **command-driven**
- **Git-reviewable**

It is **not** trying to be a full Claude-style auto-loading memory runtime yet.

Compatibility note:

- this repo ships the repository-side files Copilot agents memory expects, including `docs/memory/` and `.github/copilot-instructions.md`
- the VS Code memory tool and GitHub-hosted Copilot Memory are enabled outside this repo in your editor and GitHub settings
- this project provides the repo conventions and prompts that make those agents useful on this codebase

Versioning note:

- the current extension version is `0.6.5`
- “initial release scope” in this document refers to the product scope and workflow shape
- a `1.0.0` tag has not been released yet

---

# 🧠 What this adds to Spec Kit

Spec Kit already provides:

- structured execution (spec → plan → tasks → implement)
- project guidance via constitution

This extension adds:

- **durable memory across features**
- **structured reflection after implementation**
- **repo-native knowledge storage**

---

# ⚙️ Core idea

- **Specs** → what to build
- **Memory** → what we’ve learned

Memory is:

- selective
- durable
- reusable

This extension keeps memory in normal Markdown files inside the repository so the team can review, edit, and version it like code.

---

# ⚡ At a Glance

If you are new to this extension, this is the shortest accurate mental model:

- Spec Kit already tells you what to build through `spec.md`, `plan.md`, and `tasks.md`
- this extension adds a shared project memory layer so the team and the AI can reuse decisions, constraints, bug patterns, and lessons across features
- the durable memory lives in `docs/memory/`
- the active feature context lives beside the feature in `specs/<feature>/memory.md`
- the AI-friendly working summary lives in `specs/<feature>/memory-synthesis.md`
- before planning or implementation, the agent should read memory and refresh the synthesis
- after implementation and verification, the agent should capture only durable, evidenced lessons

In one sentence:

> Spec Kit drives delivery, and `memory-md` makes past project knowledge reusable during delivery.

---

# 🧭 When to use this extension

Use this extension when you want to:

### ✅ Keep long-term knowledge in your repo

- Store **decisions, architecture insights, and recurring bugs**
- Make knowledge **visible, reviewable, and versioned in Git**

### ✅ Improve future development quality

- Avoid repeating the same mistakes
- Reuse past decisions and patterns
- Give AI better context before coding

### ✅ Work with Spec Kit in a structured way

- Use **specs for execution**
- Use **memory for constraints and lessons**
- Keep a clear separation between “what to build” and “what we’ve learned”

### ✅ Maintain high-signal documentation

- Capture only **durable, reusable knowledge**
- Keep memory **small, focused, and useful**
- Avoid bloated or noisy documentation

### ✅ Use AI tools (Copilot, Cursor, etc.) effectively

- Let AI read consistent, structured context
- Guide planning and implementation with real project knowledge
- Improve output quality without increasing prompt complexity

### ✅ Work with VS Code Copilot agents memory

- Provide repository-scoped memory files that agents can read and update
- Keep memory visible in Git instead of storing it in hidden state
- Pair the repo conventions with VS Code's memory tool or Copilot Memory when those features are enabled

---

# 🔎 Positioning

This extension is not intended to replace personal agent memory tools such as `claude-mem`.
It is intended to give teams a shared, repository-native memory layer that can be reviewed in Git and reused across Spec Kit workflows.

Compared with nearby Spec Kit extensions:

- memory loaders focus on reading existing project memory before lifecycle commands
- archive-style extensions focus on folding completed feature knowledge back into project memory after merge
- memory governance tools focus on boundary cleanup and memory hygiene
- `memory-md` focuses on active, low-noise project memory that helps during `/specify`, `/plan`, `/tasks`, `/implement`, and `/verify`

Recommended split:

- use personal agent memory for temporary, user-specific, or agent-local context
- use this extension for durable project memory the whole team should be able to inspect, review, and reuse

---

# 📈 Why Use This Extension

The main benefits are quality, consistency, and lower context waste across repeated work.

What you gain:

- fewer repeated mistakes because bug patterns and decisions stay visible
- better planning quality because the AI sees constraints before coding
- faster onboarding for new developers and new agent sessions because project knowledge is already structured
- better team alignment because memory is reviewable in Git instead of hidden in one person's tool state
- cleaner prompts over time because the agent can rely on compact synthesis instead of repeatedly dumping large background context

Performance and token tradeoffs:

- this extension can reduce wasted tokens over multiple feature cycles by turning scattered background knowledge into compact, reusable memory
- `memory-synthesis.md` is specifically meant to reduce prompt bloat by giving the AI a short working summary instead of re-reading everything every time
- there is still some token overhead because the workflow asks the agent to read and refresh memory before planning and implementation
- in small or one-off tasks, that overhead may not pay for itself
- in ongoing projects, shared teams, and repeated feature work, the quality and consistency gains usually outweigh the extra context cost

Simple rule:

- for throwaway experiments, this may feel heavier than necessary
- for real projects with repeated decisions, bugs, and contributors, it usually improves spec-driven flow rather than slowing it down

---

# 🚫 When NOT to use this extension

Do not use this extension if you want:

### ❌ Fully automatic memory capture

- This system is **selective and intentional**
- It does not automatically record everything

### ❌ Claude-style hierarchical auto-loading

- the current pre-1.0 release does not resolve layered memory automatically
- the current pre-1.0 release expects commands and team workflow to drive memory usage

### ❌ A complete historical archive

- It is not meant to store:
  - all commits
  - all PRs
  - full implementation history
- Use Git history for that

### ❌ Detailed implementation logs

- Do not store:
  - step-by-step coding logs
  - trivial refactors
  - temporary notes
- That belongs in specs or commits, not memory

### ❌ Zero-maintenance workflows

- This system requires:
  - occasional reflection
  - conscious decisions about what to store
- It trades automation for **clarity and quality**

### ❌ Large, unstructured knowledge bases

- If you need:
  - massive data storage
  - full-text search across everything
  - automatic pattern mining

This approach may feel too minimal

---

# 🤝 Team Use vs Personal Agent Memory

This extension is designed for team use.

Compared with tools like `claude-mem`:

- `claude-mem` is strong for personal continuity, agent-local preferences, and session-to-session recall for a single developer or agent
- `memory-md` is strong for shared project knowledge that must be visible, reviewable, and reusable by the whole team
- personal agent memory can complement this extension, but it should not be the system of record for decisions, bug patterns, or architecture constraints that other people need to trust

Recommended split:

- use personal agent memory for temporary working context, preferences, and individual flow
- use repo-native memory for durable project knowledge that should survive sessions, tools, and team changes

Simple rule:

- if only one person or agent needs it temporarily, personal memory is fine
- if the team may need it later, put it in the repository

---

# 🧠 What “memory” means in this project

Memory is:

> **Durable, reusable knowledge that improves future decisions**

### Examples

- architectural tradeoffs
- important constraints
- recurring bug patterns
- non-obvious implementation lessons

### Not memory

- logs
- history
- raw data
- temporary notes

---

# ⚖️ Guiding principle

> If this information will help future work make better decisions, store it.  
> If not, leave it out.

---

# 🗂️ File Roles

These are the main files and what each one is for:

- `docs/memory/PROJECT_CONTEXT.md`
  Stable product context, domain language, and project-wide constraints.
- `docs/memory/ARCHITECTURE.md`
  System shape, ownership boundaries, integrations, and complexity hotspots.
- `docs/memory/DECISIONS.md`
  Durable cross-feature decisions, tradeoffs, and the mistakes those decisions prevent.
- `docs/memory/BUGS.md`
  Recurring failure patterns, root causes, prevention guidance, and detection ideas.
- `docs/memory/WORKLOG.md`
  Small, high-value durable lessons that do not belong in decisions or bug patterns.
- `specs/<feature>/memory.md`
  Active feature notes, open questions, and relevant durable memory for the current feature only.
- `specs/<feature>/memory-synthesis.md`
  Compact AI-facing summary of constraints, reused decisions, bug patterns, conflicts, and watchpoints.

Rule of thumb:

- if it should help future unrelated features, put it in `docs/memory/`
- if it only matters while the current feature is in flight, put it in `specs/<feature>/`

---

# ⚙️ Configuration

The extension ships a `config-template.yml` with the following options. Copy it into your project as `.specify/extensions/memory-md/config.yml` and adjust as needed:

| Key                                         | Default               | Description                                                           |
| ------------------------------------------- | --------------------- | --------------------------------------------------------------------- |
| `memory_root`                               | `docs/memory`         | Path to the durable memory folder                                     |
| `specs_root`                                | `specs`               | Path to the specs folder                                              |
| `use_project_copilot_instructions`          | `true`                | Whether to maintain `.github/copilot-instructions.md`                 |
| `definition_of_done_includes_memory_review` | `true`                | Whether memory review is required before a feature is considered done |
| `feature_memory_filename`                   | `memory.md`           | Filename for per-feature memory files                                 |
| `memory_synthesis_filename`                 | `memory-synthesis.md` | Filename for per-feature synthesis files                              |
| `require_memory_synthesis_before_plan`      | `true`                | Gate planning on a current synthesis being present                    |
| `require_memory_review_before_verify`       | `true`                | Gate verification on a memory review pass                             |

---

# 🏗️ Project structure

The following structure is created in your target project after running `/speckit.memory-md.bootstrap`:

```
.github/
  copilot-instructions.md

docs/
  memory/
    PROJECT_CONTEXT.md
    ARCHITECTURE.md
    DECISIONS.md
    BUGS.md
    WORKLOG.md

specs/
  001-feature-name/
    spec.md
    plan.md
    tasks.md
    memory.md
    memory-synthesis.md
```

Note: prompt files (`specify.memory.prompt.md`, `plan-with-memory.prompt.md`, etc.) live in this hub under `templates/prompts/` and are used by the extension commands. They are not copied into target projects by the install scripts.

---

# 🚀 Quick Start

1. Install the extension into a Spec Kit project.
2. Run `/speckit.memory-md.bootstrap`.
3. Fill in:
   - `docs/memory/PROJECT_CONTEXT.md`
   - `docs/memory/ARCHITECTURE.md`
4. Use feature `memory.md` and `memory-synthesis.md` during active delivery.
5. Use `/speckit.memory-md.plan-with-memory` before tasks or implementation.
6. Use `/speckit.memory-md.capture` or `/speckit.memory-md.capture-from-diff` after meaningful work.
7. Run `/speckit.memory-md.audit` occasionally to keep memory high-signal.

If you are using VS Code Copilot agents memory, also enable the Copilot Memory settings in VS Code and GitHub. This repository provides the files and conventions those agents use, but the feature itself is controlled by your editor and GitHub account settings.

Important:

- in this release, “required” means required by prompts, repo conventions, and agent instructions
- the extension does not yet ship separate `/tasks` or `/verify` commands or a CLI-level enforcement hook
- teams should treat the synthesis and review steps as workflow gates today, with optional automation to be added later

Future direction:

- if needed, this workflow can later be packaged into a shared VS Code custom agent or agent plugin so memory checks happen more ergonomically for the team
- the current release keeps the source of truth in the repository and treats editor integration as an optional future layer, not the core design

---

# ❓ Common Misunderstandings

- This is not a replacement for Spec Kit core.
  It adds memory to the existing Spec Kit workflow.
- This is not a hidden memory database.
  The source of truth is the repository.
- This is not a changelog generator.
  Memory should stay selective, durable, and useful.
- This is not only for one AI tool.
  The structure is repository-native and can help any agent or teammate that reads the repo.
- This is not a replacement for personal memory tools like `claude-mem`.
  Personal memory can still help individuals, while this extension keeps shared project memory visible to the team.

---

# 🧪 First 10 Minutes

Here is a minimal example of how a team might start using the extension on a real feature.

1. Bootstrap the repo

Run:

```bash
/speckit.memory-md.bootstrap
```

2. Fill in the durable project memory

Example `docs/memory/PROJECT_CONTEXT.md`:

```md
# Project Context

Last reviewed: 2026-04-22

## Product / Service

Internal support dashboard for triaging customer issues.

## Key Constraints

- Customer notes must stay inside the internal admin system.
- AI agents should not introduce flows that bypass role-based access.
```

Example `docs/memory/ARCHITECTURE.md`:

```md
# Architecture

Last reviewed: 2026-04-22

## Boundaries

- The web app reads through the API service.
- Only the API service writes customer note records.
```

3. Start a feature

Example `specs/042-note-search/memory.md`:

```md
# Feature Memory

## Scope Notes

- Add search across existing customer notes in the admin dashboard.

## Relevant Durable Memory

- Customer note writes must stay in the API service.

## Open Questions

- Should search include archived notes?
```

4. Create the synthesis before planning

Example `specs/042-note-search/memory-synthesis.md`:

```md
# Memory Synthesis

feature: 042-note-search
status: draft
hard_conflicts: 0
soft_conflicts: 1
assumptions_to_confirm: 1

## Current Constraints

- [C1] Search must respect role-based access.

## Reused Decisions

- [D1] Customer note writes stay in the API service.

## Relevant Bug Patterns

- [B1] Avoid loading unrestricted records before permission filtering.

## Architecture Boundaries

- [A1] The web app may query search results but must not write note data directly.

## Feature-to-Memory Conflicts

- [S1] Soft conflict: proposed direct browser filtering may drift from API-owned access rules.

## Assumptions Requiring Confirmation

- [Q1] Archived notes should remain searchable for admins only.

## Implementation Watchpoints

- [W1] Apply permission filtering before returning search results.

## Verification Watchpoints

- [V1] Verify users cannot retrieve notes outside their allowed scope.
```

5. Plan and implement with memory in view

- use `/speckit.memory-md.plan-with-memory`
- keep the plan aligned with the synthesis
- treat watchpoints as implementation requirements

6. Capture only durable lessons after verification

If the feature reveals a reusable bug pattern or design rule, add it to durable memory.
If not, leave durable memory unchanged.

This is the intended behavior:

- feature files help the current delivery
- durable memory helps future delivery
- only reusable lessons move from feature scope into project memory

---

# 🛠️ How To Use The Commands

## `/speckit.memory-md.bootstrap`

Use this first in a new or existing Spec Kit project.

It should:

- create missing `docs/memory/` files
- create starter spec files, including feature memory templates, when needed
- add or update shared Copilot instructions

Use it when:

- you are adopting this extension in a repo for the first time
- the repo is missing the expected memory structure

## `/speckit.memory-md.plan-with-memory`

Use this during `/plan`, after `/specify` has produced the spec and feature memory, and before `/tasks` or `/implement`.

It should:

- read the current spec, feature memory, and durable memory files
- refresh a compact `memory-synthesis.md`
- surface prior decisions and recurring bug risks
- block progress on unresolved hard conflicts

Use it when:

- starting a new feature
- revisiting a feature that touches known architectural decisions

Enforcement note:

- this command is the main shipped gate in this release
- `/tasks`, `/implement`, and `/verify` are integrated by shared prompts and instructions, not by separate extension commands yet

## Design update

This release shifts the extension from passive documentation toward workflow-integrated AI memory:

- durable project memory stays in `docs/memory/`
- active feature memory lives in `specs/<feature>/memory.md`
- a required `specs/<feature>/memory-synthesis.md` gives the AI a compact working view
- capture and audit now require evidence, scope discipline, and conflict handling

See [memory-workflow-v0.6.md](/home/galih/IdeaProjects/spec-kit-memory-hub/docs/memory-workflow-v0.6.md) for the full critique, workflow, migration guidance, and example flow.

## `/speckit.memory-md.capture`

Use this after meaningful work is complete.

It should:

- review the spec, plan, tasks, and validation results
- decide whether any durable lessons should be kept
- update only the relevant memory files

Use it when:

- a feature introduced a reusable decision
- a fix revealed a durable lesson
- implementation uncovered a non-obvious constraint

## `/speckit.memory-md.capture-from-diff`

Use this when the diff is the best source of truth.

It should:

- inspect changed files
- extract decisions, bug patterns, and important tradeoffs
- update memory only when the lesson is worth keeping

Use it when:

- you want to review memory directly from code changes
- the implementation is already done and you want a fast memory pass

## `/speckit.memory-md.audit`

Use this when memory starts to feel noisy, repetitive, stale, or hard to trust.

It should:

- find duplicate, stale, vague, contradictory, or misplaced entries
- suggest removals, merges, rewrites, and moves
- keep memory concise and high-signal

Use it when:

- memory files have grown messy
- the team is unsure which entries are still useful
- you want periodic cleanup before memory quality degrades

---

# 🔄 Workflow

## For a new feature

1. During `/specify`:
   - read constitution plus durable memory
   - create or refresh `specs/<feature>/memory.md`
   - create or refresh `specs/<feature>/memory-synthesis.md`

2. During `/plan`:
   - run `/speckit.memory-md.plan-with-memory` after `/specify`
   - block or resolve hard conflicts before continuing

3. During `/tasks`:
   - rerun `/speckit.memory-md.plan-with-memory` if the plan, spec, or memory changed
   - keep tasks aligned with synthesis watchpoints

4. During `/implement`:
   - re-read `memory-synthesis.md`
   - treat implementation watchpoints as active constraints

5. After `/implement` and `/verify`:
   - run `/speckit.memory-md.capture` or `/speckit.memory-md.capture-from-diff`
   - update durable memory only when the lesson is evidenced and reusable

---

## For a bug fix

1. Read:
   - BUGS.md
   - DECISIONS.md
   - any active feature memory if the fix is inside an open spec

2. Refresh `memory-synthesis.md` when the fix belongs to active scoped work

3. Fix and verify the issue

4. If reusable and evidenced:
   - add root cause, prevention, and evidence to BUGS.md

---

## For cleanup and simplification

1. Run `/speckit.memory-md.audit`.
2. Review suggested removals, merges, rewrites, file moves, and follow-up questions.
3. Simplify entries until they are:
   - durable
   - concise
   - reusable
4. If a finding should become a tracked task or bug, run `/speckit.memory-md.log-finding`.
5. Keep only information that improves future work.

Use this flow whenever memory starts feeling messy.

---

# 🧩 Commands (Spec Kit extension)

- /speckit.memory-md.bootstrap
- /speckit.memory-md.plan-with-memory
- /speckit.memory-md.capture
- /speckit.memory-md.capture-from-diff
- /speckit.memory-md.audit
- /speckit.memory-md.log-finding

---

# 🚀 Installation

## Community extension install

```
specify extension add memory-md
```

Use this when installing the approved community extension from the Spec Kit origin repo.

## Local development install

```bash
specify extension add --dev /path/to/spec-kit-memory-hub
```

Use this only when you are developing the extension locally.

## From GitHub (after a tagged release exists)

```
specify extension add memory-md --from https://github.com/DyanGalih/spec-kit-memory-hub/archive/refs/tags/v0.6.5.zip
```

The install example above works only after the `v0.6.5` release tag is published.
When you cut a newer release, replace that tag with the actual version you publish.

## Manual install via scripts

Two bash scripts are provided for teams that prefer manual setup without the `specify` CLI:

- `scripts/install-into-project.sh <hub_path> <target_path>`
  Copies the starter memory files (`docs/memory/`, `.github/copilot-instructions.md`, `specs/README.md`) into a target project. Skips files that already exist.

- `scripts/sync-from-hub.sh <hub_path> <target_path>`
  Syncs only `.github/copilot-instructions.md` from the hub into a target project. Intentionally does not overwrite project-specific memory files.

---

# ✅ Release Checklist

- Valid `extension.yml` at repo root
- Commands install successfully with current `specify` CLI
- README includes install and usage instructions
- `LICENSE` included
- Extension tested in a fresh Spec Kit project
- Command descriptions and file paths reflect the shipped initial-release behavior

---

# 📌 Design philosophy

- Memory should be **curated, not automatic**
- Knowledge should be **visible in Git**
- Specs and memory should remain **separate**
- AI should **use memory, not replace thinking**

---

# 📚 Further Reading

Additional documentation in this repository:

- [docs/memory-workflow-v0.6.md](docs/memory-workflow-v0.6.md) — full critique, workflow design, migration guidance, and example flow for v0.6
- [docs/architecture.md](docs/architecture.md) — layer model, initial release boundary, and design principles
- [docs/comparison.md](docs/comparison.md) — how this extension compares to personal agent memory tools and community DB-style memory
- [docs/adoption-playbook.md](docs/adoption-playbook.md) — phased rollout guidance and quality bar for memory entries

---

# 🏁 Summary

This extension helps you:

- build with structure (Spec Kit)
- learn from experience (memory)
- improve over time without increasing complexity
