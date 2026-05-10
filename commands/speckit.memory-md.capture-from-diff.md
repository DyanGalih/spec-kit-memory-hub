---
description: Capture durable knowledge and architecture decisions from current or provided diffs.
scripts:
  sh: ../../scripts/bash/detect-changed-files.sh
  ps: ../../scripts/powershell/detect-changed-files.ps1
---

# Capture From Diff

You are capturing durable knowledge for `memory-hub` by analyzing code changes.

Resolve configuration first. Use `.specify/extensions/memory-md/config.yml` when present; otherwise default to `memory_root: docs/memory` and `specs_root: specs`.

Capture is manual and human-approved. Do not write durable memory unless the user explicitly ran this command and approves the proposed updates.

## Determine Review Scope

1. **Identify Changed Files**:
   - If the user provided a diff or explicit instructions, follow them.
   - Otherwise, you **MUST** execute the `{SCRIPT}` with `--json` to detect changed files since the merge-base or in the working directory.
   - Use the `changed_files` list as the primary set for knowledge extraction.

### Durable Memory Context (Duplicate Prevention)

Before proposing new entries, check the existing memory to avoid duplicates.

#### Optimizer-Aware Flow
When `.specify/extensions/memory-md/config.yml` has `optimizer.enabled: true`:
1. **Refresh Cache**: Execute `cd .specify/extensions/memory-md && npx speckit-memory refresh-memory` (or `npx . refresh-memory` if in the extension repo).
2. **Targeted Search**: Execute `cd .specify/extensions/memory-md && npx speckit-memory search-memory "architecture constraints boundaries decisions <topic>"` for candidate topics identified from the diff.
3. **Read Results**: Review the search results or the index to ensure the candidate lesson is not already captured.
4. **Do NOT read durable memory files directly** (`DECISIONS.md`, `ARCHITECTURE.md`, `BUGS.md`, `WORKLOG.md`). When the optimizer is enabled, the `search-memory` results are the authoritative dedup source.

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
   - `DECISIONS.md`: Durable architectural or technical choices.
   - `ARCHITECTURE.md`: Durable boundaries or constraints.
   - `BUGS.md`: Lessons from fixed bugs and prevention rules.
   - `WORKLOG.md`: High-value project milestones.
   - `INDEX.md`: Compact routing rows for every durable entry added or changed.
5. **Filter Noise**: Reject entries that are obvious, transient, feature-local, or weakly evidenced.

## Output Format

1. **Proposed Memory Updates**
   - **File**: [Target memory file]
   - **Category**: [Decision / Bug Pattern / Milestone]
   - Use `WORKLOG.md` for concise, high-value project milestones and durable lessons that do not belong in decisions, architecture, or bugs.
   - When adding durable memory to `DECISIONS.md`, `ARCHITECTURE.md`, `BUGS.md`, or `WORKLOG.md`, you MUST register the update in `INDEX.md`.
   - **Optimizer-Aware Registration (Preferred)**: When the optimizer is available, use the single command below. **Do NOT read or rewrite the target durable file yourself** — the `--content` flag delegates the file write entirely to Node.js:
     ```
     cd .specify/extensions/memory-md && npx speckit-memory register-memory \
       --id <ID> --title "<Short title>" --tags "<tag1,tag2>" \
       --file "<SourceFile.md>" --status "active" \
       --content "### YYYY-MM-DD - <Title>

**Status**
Active

**Why this is durable**
<reason>

**Decision / Finding**
<body>

**Tradeoffs / Prevention**
- Gained: ...
- Reconsider: ..."
     ```
     For `WORKLOG.md` only, add `--prepend` to insert at the top (newest-first order).
     This single command: (1) writes the entry to `<SourceFile.md>` behind a `---` separator, (2) updates `INDEX.md`, and (3) syncs the SQLite cache. No further file edits are needed.
   - **Markdown-Only Registration (Fallback)**: When the optimizer is disabled, write the entry to the target file manually following the `### YYYY-MM-DD - Title` format, then update `INDEX.md` with the compact row.
   - Keep `INDEX.md` short (20-50 rows target). It points to source entries; it does not duplicate full lessons.
   - Refuse routine implementation detail, feature narrative, or speculative lessons.

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
   1. Show proposed durable memory entries and the matching `register-memory --content` command first.
   2. Ask for approval before writing.
   3. If approval is not explicit, stop after the proposal.
   4. After approved writes, execute the `register-memory --content` command — it handles all file writes, index synchronization, and cache refresh in one step.

---
## Capture Principles
- **Concise**: 1-2 sentences of durable guidance.
- **Actionable**: Tells a future developer exactly what to do or avoid.
- **Durable**: Remains relevant long after the current feature is shipped.
