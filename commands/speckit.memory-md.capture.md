---
description: "Propose human-approved durable lessons and matching index updates from completed work."
---

# Capture

Reflect on completed work and update durable memory only if needed.

Resolve configuration first. Use `.specify/extensions/memory-md/config.yml` when present; otherwise default to `memory_root: docs/memory` and `specs_root: specs`.

Capture is manual and human-approved. Do not write durable memory unless the user explicitly ran this command and approves the proposed updates.

Inputs to review:
- active spec / plan / tasks
- final implementation diff or summary
- tests or validation results
- review findings (Architecture Guard, Security Review, etc.), if any
- incident or bug-fix context, if any

### Durable Memory Context (Duplicate Prevention)

Before proposing new entries, check the existing memory to avoid duplicates.

#### Optimizer-Aware Flow
When `.specify/extensions/memory-md/config.yml` has `optimizer.enabled: true`:
1. **Refresh Cache**: Execute `cd .specify/extensions/memory-md && npx speckit-memory refresh-memory` (or `npx . refresh-memory` if in the extension repo).
2. **Targeted Search**: Execute `cd .specify/extensions/memory-md && npx speckit-memory search-memory "architecture constraints boundaries decisions <topic>"` for the candidate lesson topics.
3. **Read Results**: Review the search results or the index to ensure the candidate lesson is not already captured.
4. **Do NOT read durable memory files directly** (`DECISIONS.md`, `ARCHITECTURE.md`, `BUGS.md`, `WORKLOG.md`). When the optimizer is enabled, the `search-memory` results are the authoritative dedup source.

#### Markdown-Only Flow
When the optimizer is disabled, you **MUST** read `{memory_root}/INDEX.md` and the relevant source sections to check for existing entries.

For each candidate lesson, require all of these:
- reusable
- non-obvious
- likely to prevent future mistakes
- evidenced by the diff, tests, review feedback, or incident analysis
- correctly scoped to durable memory rather than feature-local notes

Every new entry must answer:
- why this is durable
- what future mistake it prevents
- what evidence supports it
- where maintainers should look next

Candidate files:
- `{memory_root}/DECISIONS.md`
- `{memory_root}/ARCHITECTURE.md`
- `{memory_root}/BUGS.md`
- `{memory_root}/WORKLOG.md`
- `{memory_root}/INDEX.md`

Rules:
- Prefer `DECISIONS.md` for still-active cross-feature choices and tradeoffs.
- Prefer `ARCHITECTURE.md` for durable boundaries or constraints.
- Prefer `BUGS.md` for repeatable failure modes and prevention guidance.
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

**Decision**
<decision text>

**Tradeoffs**
- Gained: ...
- Made harder: ...
- Reconsider: ..."
  ```
  For `WORKLOG.md` only, add `--prepend` to insert at the top (newest-first order).
  This single command: (1) writes the entry to `<SourceFile.md>` behind a `---` separator, (2) updates `INDEX.md`, and (3) syncs the SQLite cache. No further file edits are needed.
- **Markdown-Only Registration (Fallback)**: When the optimizer is disabled, write the entry to the target file manually following the `### YYYY-MM-DD - Title` format used in the template, then update `INDEX.md`.
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

To pick the next number: count existing entries with that prefix in `INDEX.md` and add 1. Example: if `D3` is the last decision entry, use `D4`.

#### Orchestration Note
This command is **proactively triggered** by `spec-kit-architecture-guard` as the final step of its `governed-*` workflows when new lessons are identified. Manual execution is supported but optional since it is managed by the governance layer.

Approval flow:
1. Show proposed durable memory entries and the matching `register-memory --content` command first.
2. Ask for approval before writing.
3. If approval is not explicit, stop after the proposal.
4. After approved writes, execute the `register-memory --content` command — it handles all file writes, index synchronization, and cache refresh in one step.
