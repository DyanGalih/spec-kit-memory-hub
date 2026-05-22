---
description: Capture durable knowledge and architecture decisions from current or provided diffs.
scripts:
  sh: ../../scripts/bash/detect-changed-files.sh
  ps: ../../scripts/powershell/detect-changed-files.ps1
---

# Capture From Diff

You are capturing durable knowledge for `memory-hub` by analyzing code changes.

Resolve configuration first. Use `.specify/extensions/memory-md/config.yml` when present; otherwise default to `memory_root: docs/memory` and `specs_root: specs`.

Capture is automatic based on your confidence score. Evaluate the proposed durable memory and determine your confidence (0-100%) that it is correct, durable, and non-duplicate. If your confidence is > 50%, automatically approve the capture and register it. If your confidence is <= 50%, ignore it and do not capture. However, you must always allow the user to trigger this manually and bypass the confidence check if they explicitly request a capture.

## Determine Review Scope

1. **Identify Changed Files**:
   - If the user provided a diff or explicit instructions, follow them.
   - Otherwise, you **MUST** execute the platform-appropriate script with `--json` to detect changed files since the merge-base or in the working directory.
     - **Linux/macOS**: run the script at `scripts/bash/detect-changed-files.sh --json`
     - **Windows**: run the script at `scripts/powershell/detect-changed-files.ps1 --json`
     - When invoked via a Spec Kit command context that resolves `{SCRIPT}`, use the provided value directly.
   - Use the `changed_files` list as the primary set for knowledge extraction.

### Durable Memory Context (Duplicate Prevention)

Before proposing new entries, check the existing memory to avoid duplicates.

#### Optimizer-Aware Flow
When `.specify/extensions/memory-md/config.yml` has `optimizer.enabled: true`:
1. **Refresh Cache**: Call `speckit_memory_refresh_cache(scope="memory")`.
2. **Targeted Search**: Call `speckit_memory_search(query="architecture constraints boundaries decisions <topic>")` for candidate topics identified from the diff.
3. **Read Results**: Review the search results or the index to ensure the candidate lesson is not already captured.
4. **Do NOT read durable memory files directly** (`DECISIONS.md`, `ARCHITECTURE.md`, `BUGS.md`, `WORKLOG.md`). When the optimizer is enabled, MCP search results are the authoritative dedup source.

#### Markdown-Only Flow
When the optimizer is disabled, you **MUST** read `{memory_root}/INDEX.md` and relevant source sections.

## Capture Process

1. **Inspect Changes**: Analyze the diff of the identified files.
2. **Identify High-Signal Knowledge**:
   - **Architecture Decisions**: New boundaries, patterns, or choices.
   - **Integration Gotchas**: Non-obvious failure modes or hidden dependencies.
   - **Recurring Patterns**: Bug patterns to prevent or conventions to follow.
   - **Tradeoffs**: Conscious decisions to prefer one quality over another.
3. **Verify Evidence**: Ensure every finding is backed by:
   - The actual diff content.
   - Successful tests or verification results.
   - Explicit task completion in `tasks.md`.
4. **Categorize and Route**:
   - Create a flat date-based file: `YYYY-MM-DD-short-title.md` (e.g., `2026-05-22-auth-pattern.md`).
   - DO NOT use monolithic category files like `DECISIONS.md`, `ARCHITECTURE.md`, `BUGS.md`, or `WORKLOG.md`.
   - `INDEX.md`: Compact routing rows for every durable entry added or changed. Use the ID prefix to correctly categorize the entry in the index (A for Architecture, B for Bugs, D for Decisions, W for Worklog).
5. **Filter Noise**: Reject entries that are obvious, transient, feature-local, or weakly evidenced.

## Output Format

1. **Proposed Memory Updates**
   - **File**: [Target memory file]
   - **Category**: [Decision / Bug Pattern / Milestone]
   - Use `WORKLOG.md` for concise, high-value project milestones and durable lessons that do not belong in decisions, architecture, or bugs.
   - When adding durable memory to `DECISIONS.md`, `ARCHITECTURE.md`, `BUGS.md`, or `WORKLOG.md`, you MUST register the update in `INDEX.md`.
   - **Optimizer-Aware Registration (Preferred)**: When the optimizer is available, call `speckit_memory_register`. **Do NOT read or rewrite the target durable file yourself** — the MCP tool writes the durable entry, updates `INDEX.md`, and syncs SQLite:
     ```text
     speckit_memory_register(
       id="<ID>",
       title="<Short title>",
       tags="<tag1,tag2>",
       file="YYYY-MM-DD-short-title.md",
       status="active",
       content="### YYYY-MM-DD - <Title>

**Status**
Active

**Why this is durable**
<reason>

**Decision / Finding**
<body>

**Tradeoffs / Prevention**
- Gained: ...
- Reconsider: ..."
     )
     ```
     For `WORKLOG.md` only, set `prepend=true` to insert at the top (newest-first order).
     This single MCP call: (1) writes the entry to `<SourceFile.md>` behind a `---` separator, (2) updates `INDEX.md`, and (3) syncs the SQLite cache. No further file edits are needed.
   - **Markdown-Only Registration (Fallback)**: When the optimizer is disabled, write the entry to the target file manually following the `### YYYY-MM-DD - Title` format, then update `INDEX.md` with the compact row.
   - Keep `INDEX.md` short (20-50 rows target) ONLY when the optimizer is disabled.
   - **INDEX.md size guard (Markdown-Only Flow)**: When the optimizer is disabled, before writing, count the existing `|`-prefixed table rows in `INDEX.md`. If the count already exceeds 50, do not proceed silently — warn the user and recommend running `/speckit.memory-md.audit` first. When the optimizer is enabled, `INDEX.md` is unlimited, you MUST avoid reading the `INDEX.md` file entirely, and you should skip this size guard.

   #### ID Convention

   The `--id` value uses a letter prefix + sequential number:

   | Prefix | File | INDEX.md section |
   |--------|------|------------------|
   | `A` | `ARCHITECTURE.md` | `## Architecture` |
   | `B` | `BUGS.md` | `## Bugs` |
   | `D` | `DECISIONS.md` | `## Decisions` |
   | `W` | `WORKLOG.md` | `## Workflow` |

   To pick the next number: count existing entries with that prefix in `INDEX.md` and add 1.

   Approval flow:
   1. Show proposed durable memory entries and state your confidence score (0-100%).
   2. If confidence > 50%, automatically call `speckit_memory_register` to write the entry WITHOUT asking the user for confirmation — it handles all file writes, index synchronization, and cache refresh in one step.
   3. If confidence <= 50%, ignore the entry and explain why the confidence was too low.
   4. After successfully capturing a memory in step 2, automatically trigger the `/speckit.memory-md.share-lesson` command to evaluate if it should be published globally.

---
## Capture Principles
- **Concise**: 1-2 sentences of durable guidance.
- **Actionable**: Tells a future developer exactly what to do or avoid.
- **Durable**: Remains relevant long after the current feature is shipped.
