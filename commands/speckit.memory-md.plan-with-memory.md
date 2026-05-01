# Plan With Memory

Before planning the feature, resolve configuration: 0. If `.specify/extensions/memory-md/config.yml` exists, read it for `memory_root`, `specs_root`, `feature_memory_filename`, `memory_synthesis_filename`, and `require_memory_synthesis_before_plan`.
Otherwise use defaults: `memory_root: docs/memory`, `specs_root: specs`, `feature_memory_filename: memory.md`, `memory_synthesis_filename: memory-synthesis.md`, `require_memory_synthesis_before_plan: true`.
If `require_memory_synthesis_before_plan` is `false`, skip the synthesis gate but still produce a synthesis when possible.

Then read in this order:

1. constitution or project principles
2. active feature spec
3. `specs/<feature>/memory.md` if present
4. durable memory:
   - docs/memory/PROJECT_CONTEXT.md
   - docs/memory/ARCHITECTURE.md
   - docs/memory/DECISIONS.md
   - docs/memory/BUGS.md
   - docs/memory/WORKLOG.md when it contains durable lessons
5. existing `specs/<feature>/memory-synthesis.md` if present

Required synthesis step:
Create or refresh `specs/<feature>/memory-synthesis.md` with only:

- current constraints
- reused decisions
- relevant bug patterns
- architecture boundaries
- feature-to-memory conflicts
- assumptions requiring confirmation
- implementation watchpoints
- verification watchpoints

Format rules:

- keep the metadata keys in this order: `feature`, `status`, `hard_conflicts`, `soft_conflicts`, `assumptions_to_confirm`
- keep every required section, even when empty
- use `- [none]` for empty sections
- use stable item IDs such as `[C1]`, `[D1]`, `[B1]`, `[A1]`, `[Q1]`, `[W1]`, `[V1]`
- keep conflict counts aligned with the listed conflicts

Conflict rules:

- Hard conflict: block progress when the spec or plan violates constitution rules, an explicit architecture boundary, a still-valid decision, or a known safety / data integrity bug prevention rule.
- Soft conflict: warn when memory suggests a preferred approach but the spec can still proceed with a justified alternative.
- Ask for clarification when the spec cannot satisfy memory without changing scope, requirements, or an existing durable decision.
- Mark memory stale instead of obeying it blindly when implementation reality or verified behavior clearly contradicts older memory.

Output:

- a concise planning synthesis
- conflict status: `none`, `soft`, or `hard`
- reused decisions and bug patterns
- assumptions that need confirmation
- recommended implementation and verification approach

Do not dump full memory files into the plan.
Do not continue to task breakdown or implementation with unresolved hard conflicts.
