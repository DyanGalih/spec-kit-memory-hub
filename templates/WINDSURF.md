# Windsurf Instructions

This repository is built to work with Spec Kit Memory Hub and Windsurf.

## Mandatory Workflow
1. **Core Governance**: You MUST follow the memory-first workflow defined in [.specify/memory/workflow.md](.specify/memory/workflow.md).
2. **Proactive Check**: Before planning or tasking, you MUST prepare context using the best available path:
   - MCP: call `speckit_memory_refresh_cache`, `speckit_memory_search`, `speckit_memory_synthesize`, and `speckit_memory_synthesize_docs`
   - Spec Kit commands: run `/speckit.memory-md.prepare-context`
   - Markdown-first fallback: follow `.specify/memory/workflow.md` and refresh `memory-synthesis.md` manually
3. **Capture Lessons**: After implementation, you MUST review whether there is durable knowledge to preserve and use the best available capture path:
   - Spec Kit commands: `/speckit.memory-md.capture` or `/speckit.memory-md.capture-from-diff`
   - MCP maintenance flow: `speckit_memory_register` only after explicit approval

## MCP Optimization (Preferred)
If you are running with an active Model Context Protocol (MCP) server integration (e.g., speckit-memory-hub), you DO NOT need to run shell commands for cache work. You can instead invoke MCP tools directly (`speckit_memory_refresh_cache`, `speckit_memory_rebuild_cache`, `speckit_memory_audit_cache`, `speckit_memory_search`, `speckit_memory_synthesize`, `speckit_memory_search_docs`, `speckit_memory_synthesize_docs`, `speckit_memory_register`, `speckit_memory_share_lesson`, `speckit_memory_sync_shared`, `speckit_memory_init_project`) to manage the SQLite cache and synchronize lessons in the background.

## Proactive Self-Governance (Confidence > 50%)
Do not wait for a manual capture request at the end of your task. If you evaluate your confidence in a newly discovered design pattern, architectural trade-off, or bug resolution to be **greater than 50%**, you MUST proactively surface it for capture:
- **80–100% confident**: Propose the entry inline, state your confidence, and invoke `/speckit.memory-md.capture` immediately — awaiting a single user confirmation before writing.
- **50–80% confident**: Surface the proposal in the conversation and ask: *"I've identified a potential lesson worth capturing: [X]. Shall I record it?"*
- **For global sharing**: After local approval, call `speckit_memory_share_lesson` to propagate valuable, stack-specific lessons to the global shared memory.

> ⚠️ **Never write directly to `docs/memory/` files.** Always use the `capture` flow or `speckit_memory_register` so that `INDEX.md` and the SQLite cache stay in sync.

## Memory Source of Truth
- **Governance**: `.specify/memory/` (Constitution, Architecture, Workflow)
- **Durable**: `docs/memory/` (History, Decisions, Patterns)
- **Active**: `specs/<feature>/` (Local context and synthesis)

A task is not fully complete until memory has been reviewed and systemic lessons are captured.
