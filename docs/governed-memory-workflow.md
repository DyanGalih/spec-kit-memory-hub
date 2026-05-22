# Governed Memory Workflow (v1.0.0)

## Architectural Critique

The `memory-md` approach is optimized for spec-driven AI execution through layered context and governed workflows.

Main principles:
- **Layered Context**: Separation between durable project memory and active feature memory.
- **Index-First Retrieval**: Normal workflows read a compact memory index before selected source sections.
- **Required Synthesis**: Every feature must have a `memory-synthesis.md` that acts as a focused lens for the AI.
- **Evidence-Based Capture**: Only reusable, evidenced lessons enter durable memory.
- **Governed Orchestration**: Integration with Architecture Guard for coordinated planning and implementation.

---

## Governed Delivery Lifecycle

Memory Hub acts as a cooperative citizen in the Spec Kit ecosystem. When used with Architecture Guard, it provides the "historical context" for the governed lifecycle:

1. **`/specify`** -> Write initial feature spec.
2. **`/speckit.architecture-guard.governed-plan`** -> Orchestrates memory synthesis, technical planning, and security/architecture validation.
3. **`/speckit.architecture-guard.governed-tasks`** -> Orchestrates task generation with memory, security, and architecture refactor awareness.
4. **`/speckit.architecture-guard.governed-implement`** -> Orchestrates implementation with memory context and post-implementation governance review.

---

## Memory Model

1. **Governance Layer (`.specify/memory/`)**
   Store stable operating rules, project constitution, architecture standards, and governance-level decisions. This is the authoritative "Project Law".
2. **Durable Project Memory (`docs/memory/`)**
   Store technical constraints, architecture boundaries, technical decisions, recurring implementation bug patterns, and a sequential lessons ledger. This is the authoritative "Project History".
3. **Memory Index**
   Store compact routing metadata in `{memory_root}/INDEX.md`; this decides what durable source sections are worth reading.
4. **Active Feature Memory**
   Store feature-local constraints, clarifications, open questions, and short-lived watch items in `{specs_root}/<feature>/memory.md`.
5. **Memory Synthesis**
   A compact, AI-facing summary of selected durable and feature memory for the current task (`{specs_root}/<feature>/memory-synthesis.md`).

---

## Capture vs Synthesis

Memory Hub separates two distinct operations to ensure safety and signal quality:

### Synthesis
Synthesis prepares relevant memory for the current workflow. It is safe to use during governed workflows because it reads the index, retrieves selected source sections, and summarizes compact context. It is triggered automatically by orchestrator commands like `governed-plan`.

### Capture
Capture persists new durable memory and matching index rows. It should be **intentional and human-approved**.

While Architecture Guard orchestration does not automatically mutate project memory without approval, it now includes a **Mandatory Self-Learning Check** as the penultimate step in every implementation and review flow. This ensures the agent evaluates the current execution for architectural lessons and is forced to propose any high-signal findings via `/speckit.memory-md.capture` before finalizing the governance summary.

---

## Command Integration

### Orchestrated Usage (via Architecture Guard)
Architecture Guard orchestrator commands automatically consume memory synthesis:
- **`governed-plan`**: Triggers `plan-with-memory` to provide context for the technical plan.
- **`governed-tasks`**: Ensures tasks respect known constraints and architecture boundaries.
- **`governed-implement`**: Provides the implementation watchpoints from the synthesis.

### Integration Contract
When another extension wires into Memory Hub, the integration should be predictable:

1. Detect capability first, then prefer the optimized SQLite/MCP path.
2. Use `/speckit.memory-md.prepare-context` or the equivalent MCP tools as the entrypoint.
3. Read `memory-synthesis.md` before broad repository scans.
4. Depend on command names, artifact names, and MCP tool names only. Do not couple to Memory Hub internals.
5. Keep the token-savings banner visible when the optimized path emits one.

### Direct Usage
The user can manually run memory commands:
- **`init`**: Initialize the memory structure.
- **`plan-with-memory`**: Manually refresh synthesis.
- **`capture`**: Propose evidenced lessons and index rows for explicit approval.
- **`audit`**: Clean up and de-duplicate memory.

### Orchestration Prompt Text
Use this wording for the Architecture Guard orchestration layer when you want memory-first behavior without changing the default Spec Kit commands directly.

These prompt templates correspond to:
- `templates/prompts/governed-plan.architecture-guard.prompt.md`
- `templates/prompts/governed-tasks.architecture-guard.prompt.md`
- `templates/prompts/governed-implement.architecture-guard.prompt.md`

#### `/speckit.architecture-guard.governed-plan`
```text
Before planning, refresh or read cached memory context first.
Read `memory-synthesis.md` before any broader file scan.
Validate the plan against memory, architecture, and security constraints.
Surface hard conflicts immediately and stop for clarification.
If `show_token_banner` is enabled, print the baseline / cached / saved token summary.
```

#### `/speckit.architecture-guard.governed-tasks`
```text
Before generating tasks, reuse the current synthesis instead of reopening the full memory set.
Convert the approved plan into tasks that preserve existing constraints and decisions.
Check for task-level conflicts, migration gaps, and review watchpoints.
Keep task generation compact and feature-scoped.
If `show_token_banner` is enabled, print the token summary after cached context is used.
```

#### `/speckit.architecture-guard.governed-implement`
```text
Before implementation, load the synthesis and active watchpoints.
Prefer cache-backed context instead of raw markdown scans.
Implement the agreed tasks while preserving architecture boundaries.
Run the post-implementation governance review.
If the review finds durable lessons, propose capture and wait for approval.
If `show_token_banner` is enabled, print the token summary after synthesis is refreshed.
```

#### Behavioral Rule
- Memory-first is a workflow rule, not just a suggestion.
- The orchestrator should prefer cached synthesis and targeted retrieval, then fall back to direct file reads only when needed.
- The default Spec Kit commands can remain intact as long as the orchestrator consistently wraps them.

---

## Conflict Detection Rules

### Hard Conflicts
- Spec contradicts constitution or project principles.
- Plan violates an explicit architecture boundary.
- Tasks require crossing a prohibited service or module boundary.
- Implementation diff breaks an active decision without updating that decision.
- New work repeats a known bug pattern without mitigation.

These should block progress until clarified or explicitly superseded.

### Soft Conflicts
- Memory suggests a preferred pattern, but the new feature can justify a different approach.
- A decision looks partially outdated but is not clearly invalid.
- Bug patterns are adjacent rather than directly applicable.

These should warn, not block.

---

## Capture Quality Rules

Every new durable entry must be **evidenced** by:
- Implementation diff
- Completed tasks
- Verification or test results
- Review findings

### Quality Rubric
- **Durable**: Will it matter beyond this feature?
- **Actionable**: Can an AI or maintainer do something differently because of it?
- **Non-obvious**: Is it more than common sense?
- **Evidenced**: Is there concrete support?
- **Concise**: Is it short enough to be used repeatedly?

---

## Migration Guidance

For projects moving to v1.0.0:
1. **Re-run Init**: Run `/speckit.memory-md.init` to ensure the latest `config.yml` and `INDEX.md` structure are in place. This is safe and will not overwrite your existing memory content.
2. **Review `INDEX.md`**: Ensure your routing table correctly points to active decisions, architecture constraints, and bug patterns.
3. **Adopt MCP Tools**: Configure your AI client to use the `speckit-memory-hub` MCP server, as the markdown-only fallback is now deprecated.
4. **Adopt the Orchestrator**: Transition from manual `/plan` to `/speckit.architecture-guard.governed-plan`.
5. **Preserve Selective Capture**: Continue to use the **Durable Lesson Test** before running `/speckit.memory-md.capture`.
