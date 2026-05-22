Review completed work using:
- spec, plan, tasks
- implementation diff
- tests or verification
- review findings
- incident context when available

Capture is manual and human-approved. Show proposed durable entries first, then ask for approval before writing.

### Duplicate Prevention (run before proposing)

1. Call `speckit_memory_refresh_cache(scope="memory")` or `npx speckit-memory refresh-memory`.
2. Call `speckit_memory_search(query="architecture constraints boundaries decisions <topic>")` for candidate topics.
3. Review results — do NOT read `.md` memory files directly. SQLite search results are the authoritative source.

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

Use a letter prefix + sequential number. Query the SQLite cache to estimate the next ID, or pick a high enough number to avoid collisions.

| Prefix | File |
|---|---|
| `A` | `ARCHITECTURE.md` |
| `B` | `BUGS.md` |
| `D` | `DECISIONS.md` |
| `W` | `WORKLOG.md` |

### Registration

Use `speckit_memory_register` to write the entry, update `INDEX.md`, and sync the SQLite cache in a single MCP call:

```text
speckit_memory_register(
  id="<ID>",
  title="<Short title>",
  tags="<tag1,tag2>",
  file="<SourceFile.md>",
  status="active",
  content="### YYYY-MM-DD - <Title>
..."
)
```

Set `prepend=true` for `WORKLOG.md` only (newest-first order).

The MCP call will automatically update the `.md` backups and `INDEX.md`. Do not edit the files manually.
Reject changelog-style, speculative, or feature-local updates.
