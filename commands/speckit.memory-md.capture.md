---
description: "Propose human-approved durable lessons and matching index updates from completed work."
---

# Capture

Reflect on completed work and update durable memory only if needed.

Resolve configuration first. Use `.specify/extensions/memory-md/config.yml` when present; otherwise default to `memory_root: docs/memory` and `specs_root: specs`.

Capture is automatic based on your confidence score. Evaluate the proposed durable memory and determine your confidence (0-100%) that it is correct, durable, and non-duplicate. If your confidence is > 50%, automatically approve the capture and register it. If your confidence is <= 50%, ignore it and do not capture. However, you must always allow the user to trigger this manually and bypass the confidence check if they explicitly request a capture.

Inputs to review:
- active spec / plan / tasks
- final implementation diff or summary
- tests or validation results
- review findings (Architecture Guard, Security Review, etc.), if any
- incident or bug-fix context, if any

### Durable Memory Context (Duplicate Prevention)

Before proposing new entries, check the existing memory to avoid duplicates.

1. **Refresh Cache**: If memory search is empty or you need the latest state, call `speckit_memory_refresh_cache(scope="memory")` or `npx speckit-memory refresh-memory` to restore the SQLite cache from the backup `.md` files.
2. **Targeted Search**: Call `speckit_memory_search(query="architecture constraints boundaries decisions <topic>")` for the candidate lesson topics.
3. **Read Results**: Review the search results to ensure the candidate lesson is not already captured.
4. **Do NOT read `.md` memory files directly**. MCP search results via SQLite are the single source of truth. The `.md` files are only backups managed by the extension.

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

Target files:
When registering a durable memory, you MUST generate a date-based filename organized into a category subfolder.
- Format: `<category>/YYYY-MM-DD-short-title.md` (e.g., `bugs/2026-05-22-auth-bug.md`, `decisions/2026-05-22-cache-strategy.md`).
- Allowed categories: `decisions`, `architecture`, `bugs`, `worklog`.
- DO NOT use monolithic category files like `DECISIONS.md`, `ARCHITECTURE.md`, `BUGS.md`, or `WORKLOG.md`.
- Ensure the filename is descriptive but short (max 5-6 words).

Rules:
- Categorize your entry by setting the correct `ID` prefix (A for Architecture, B for Bugs, D for Decisions, W for Worklog) so it is categorized correctly in the SQLite cache and backup index.
- Keep the `file` argument in `speckit_memory_register` clean and relative to the memory root (e.g., `decisions/2026-05-22-auth-pattern.md`). The tool will create the folders and write it to `{memory_root}`.
- **Registration**: You MUST call `speckit_memory_register` to add new memory. **Do NOT read or rewrite the target `.md` files yourself** — the MCP tool writes the entry to SQLite and backs it up to the `.md` files automatically:
  ```text
  speckit_memory_register(
    id="<ID>",
    title="<Short title>",
    tags="<tag1,tag2>",
    file="<category>/YYYY-MM-DD-short-title.md",
    status="active",
    projectRoot="<absolute_path_to_project>",
    content="### YYYY-MM-DD - <Title>

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
  )
  ```
  For `worklog/` only, set `prepend=true` to insert at the top (newest-first order).
  This single MCP call syncs the SQLite cache and backs it up to the file system. No further file edits are needed.
- Refuse routine implementation detail, feature narrative, or speculative lessons.

#### ID Convention

The `--id` value uses a letter prefix + sequential number:

| Prefix | Category Folder |
|--------|-----------------|
| `A` | `architecture/` |
| `B` | `bugs/`         |
| `D` | `decisions/`    |
| `W` | `worklog/`      |

To pick the next number: use `speckit_memory_search` to query for the prefix to estimate the next ID, or pick a high enough number to avoid collisions.

#### Orchestration Note
This command is **proactively triggered** by `spec-kit-architecture-guard` as the final step of its `governed-*` workflows when new lessons are identified. Manual execution is supported but optional since it is managed by the governance layer.

Approval flow:
1. Show proposed durable memory entries and state your confidence score (0-100%).
2. If confidence > 50%, automatically call `speckit_memory_register` to write the entry WITHOUT asking the user for confirmation — it handles all file writes, index synchronization, and cache refresh in one step.
3. If confidence <= 50%, ignore the entry and explain why the confidence was too low.
4. After successfully capturing a memory in step 2, automatically trigger the `/speckit.memory-md.share-lesson` command to evaluate if it should be published globally.
