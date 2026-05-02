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

### Retrieval Selection & Budget
Do NOT dump the entire repository memory into the synthesis. Adhere to this retrieval budget:
- Max 5 Active Architecture Decisions
- Max 3 Accepted Deviations
- Max 3 Relevant Security Constraints (from `specs/<feature>/security-constraints.md`)
- Max 3 Historical Lessons/Bug Patterns

### Phase-Aware Retrieval
Adapt synthesis based on the Spec Kit phase:
- **Specify/Plan**: Prioritize boundary definitions, module ownership, and architectural drift risks.
- **Tasks/Implement**: Prioritize migration patterns, security constraints, and known implementation risks.

### Decision State & Conflict Resolution
Treat memory as stateful.
- Supported states: `active`, `deprecated`, `superseded`, `experimental`, `accepted-deviation`.
- Prefer newer accepted decisions.
- Explicitly exclude `deprecated` or `superseded` memory.
- If an unresolved conflict exists, explicitly surface it in the "Conflict Warnings" section, preferring the current active standard.

### Required Synthesis Structure
Create or refresh `specs/<feature>/memory-synthesis.md` matching exactly this structure:

```markdown
# Memory Synthesis

## Current Scope
[Brief description of feature scope and affected modules]

## Relevant Decisions
- [Decision] (Reason Included: [X], Status: [Y], Source: [Z])

## Active Architecture Constraints
- [Constraint] (Reason Included: [X], Source: [Z])

## Accepted Deviations
- [Deviation] (Reason Included: [X], Status: Accepted-Deviation)

## Relevant Security Constraints
- [Constraint] (Reason Included: [X], Source: security-constraints.md)

## Related Historical Lessons
- [Lesson] (Reason Included: [X])

## Conflict Warnings
- [Explicit conflicts between old and new memory]

## Retrieval Notes
- [Items retrieved counts, budget status]
```

Conflict rules:
- Hard conflict: block progress when the spec or plan violates constitution rules, an explicit architecture boundary, a still-valid decision, or a known safety / data integrity bug prevention rule.
- Soft conflict: warn when memory suggests a preferred approach but the spec can still proceed with a justified alternative.
- Ask for clarification when the spec cannot satisfy memory without changing scope, requirements, or an existing durable decision.

Output:
- a concise planning synthesis
- Do not dump full memory files into the plan.
- Do not continue to task breakdown or implementation with unresolved hard conflicts.
