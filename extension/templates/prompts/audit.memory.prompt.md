Audit memory for signal quality and correct layering.

Check for:

- duplicates
- stale entries
- speculative claims
- changelog noise
- wrong-file placement
- overlong entries
- feature detail leaking into durable memory
- stale or missing feature synthesis

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
