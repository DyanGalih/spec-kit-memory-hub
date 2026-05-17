Review completed work using:
- spec, plan, tasks
- implementation diff
- tests or verification
- review findings
- incident context when available

Capture is manual and human-approved. Show proposed durable entries and matching `{memory_root}/INDEX.md` rows first, then ask for approval before writing.

### Duplicate Prevention (run before proposing)

When `optimizer.enabled` is `true`:
1. Execute `npx speckit-memory refresh-memory` (or `npx . refresh-memory` in the extension repo).
2. Execute `npx speckit-memory search-memory "architecture constraints boundaries decisions <topic>"` for candidate topics.
3. Review results — do NOT read durable memory files directly. Search results are the authoritative dedup source.

When the optimizer is disabled, read `{memory_root}/INDEX.md` and the relevant source sections to check for existing entries.

### Entry Criteria

Update durable memory only when a lesson is:
- durable
- actionable
- non-obvious
- evidenced
- correctly scoped
- concise

Every entry must explain:
- why this is durable
- what future mistake it prevents
- what evidence supports it
- where maintainers should look next

### File Routing

| File | Use for |
|---|---|
| `DECISIONS.md` | Active cross-feature choices and tradeoffs |
| `ARCHITECTURE.md` | Durable boundaries or system constraints |
| `BUGS.md` | Repeatable failure modes and prevention rules |
| `WORKLOG.md` | High-value project milestones (prepend, newest-first) |

### ID Convention

Use a letter prefix + sequential number. Count existing entries in `INDEX.md` with that prefix and add 1.

| Prefix | File |
|---|---|
| `A` | `ARCHITECTURE.md` |
| `B` | `BUGS.md` |
| `D` | `DECISIONS.md` |
| `W` | `WORKLOG.md` |

### INDEX.md Size Guard

Before writing, count existing `|`-prefixed table rows in `INDEX.md`. If the count exceeds 50, warn the user and recommend running `/speckit.memory-md.audit` to remove stale entries before adding more.

### Registration

When the optimizer is available, use `register-memory` to write the entry, update `INDEX.md`, and sync the SQLite cache in a single command:

```bash
cd .specify/extensions/memory-md && npx speckit-memory register-memory \
  --id <ID> --title "<Short title>" --tags "<tag1,tag2>" \
  --file "<SourceFile.md>" --status "active" \
  --content "### YYYY-MM-DD - <Title>
..."
```

Add `--prepend` for `WORKLOG.md` only (newest-first order).

When the optimizer is disabled, write the entry manually using the `### YYYY-MM-DD - Title` format, then update `INDEX.md`.

When writing durable memory, update `{memory_root}/INDEX.md` with compact routing metadata that points to the source entry.
Reject changelog-style, speculative, or feature-local updates.
