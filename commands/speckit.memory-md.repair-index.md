---
description: "Recover missing docs/memory/INDEX.md routing rows from durable memory files without deleting existing rows."
---

# Repair Memory Index

Use this command when an older Memory Hub workflow may have removed valid `docs/memory/INDEX.md` rows, or when durable entries exist in `docs/memory/**/*.md` but are no longer discoverable through the index.

## Source of Truth

SQLite is the primary operational cache. The Markdown memory files are the durable backups. `INDEX.md` is routing metadata for the backups and must not be pruned automatically.

## MCP Flow

1. Call `speckit_memory_repair_index(apply=false)` first.
2. Review the proposed `missingRows`.
3. If the proposed rows are valid, ask the user for approval.
4. After explicit approval, call `speckit_memory_repair_index(apply=true)`.
5. Call `speckit_memory_search` if you need to verify the appended rows are now indexed.

## Behavior

- Scans durable memory files for dated entries like `### YYYY-MM-DD - Title`.
- Detects entries missing from `INDEX.md`.
- Proposes compact routing rows with `recovered,needs-review` tags.
- Appends missing rows only when `apply=true`.
- Refreshes the SQLite memory cache after applying.
- Never deletes existing `INDEX.md` rows.
- Never edits durable source entries.

## Review Notes

Recovered rows should be reviewed later for better tags and clearer titles. The recovery step favors preserving discoverability over perfect metadata.
