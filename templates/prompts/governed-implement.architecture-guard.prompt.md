Before implementation:

Read:
- the approved tasks
- `{specs_root}/<feature>/{memory_synthesis_filename}` when present
- active feature memory only when extra detail is needed
- selected index entries relevant to implementation and verification

When `optimizer.enabled` is `true` and the MCP server is available:
1. Load the cached synthesis and active watchpoints first.
2. Prefer cache-backed retrieval instead of raw markdown scans.
3. Recheck the cache only when the approved plan or tasks changed.
4. If `show_token_banner` is enabled, surface the baseline / cached / saved token banner.

Implement the agreed tasks while:
- preserving architecture boundaries
- respecting existing decisions and accepted deviations
- keeping changes aligned with the approved plan
- following the verification watchpoints

After implementation, run the post-implementation governance review.
If the review finds durable lessons, propose capture and wait for approval before writing durable memory.

Do not widen scope unless the review or tasks explicitly require it.
Do not read the full memory set unless the synthesis is insufficient.

Block progress on unresolved hard conflicts.
Warn on soft conflicts.
Keep implementation guidance compact and execution-oriented.
