Audit memory for signal quality and correct layering.

Audit may read all memory because it is intentionally expensive. Normal synthesis must rely on SQLite/MCP search.

Run `speckit_memory_audit_cache(scope="memory")` first to check cache health, then evaluate memory content quality.

Check for:

- duplicates
- stale entries
- speculative claims
- changelog noise
- wrong-file placement
- overlong entries
- feature detail leaking into durable memory
- stale or missing feature synthesis
- orphaned cache entries or missing files
- deprecated or superseded decisions selected in synthesis
- synthesis files exceeding `retrieval.max_synthesis_words`

Score each entry on:

- durable
- actionable
- non-obvious
- evidenced
- correctly scoped
- concise

Recommend only concrete removals, merges, rewrites, or freshness updates.
For each finding, include a follow-up question: do we need to address or clean up this finding?
If a finding should be tracked externally, route it to `/speckit.memory-md.log-finding`.
Do not invent missing knowledge.
