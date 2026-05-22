# Architecture

## Layers

### 1. Spec Kit execution layer

- constitution
- feature specs
- plans
- tasks
- implementation work
- **governed orchestration** (via Architecture Guard)

### 2. Durable project memory layer

- compact index
- project context
- architecture notes
- decisions
- recurring bugs
- worklog

### 3. Active feature memory layer

- feature-local memory
- memory synthesis
- open questions and watchpoints for the active feature

### 4. Editor/runtime behavior layer

- Copilot instructions
- prompt files
- local repo conventions

These files make the repository usable by VS Code Copilot agents memory without requiring hidden state.

## Initial Release Boundary

This project is a repository-first memory workflow, not a dynamic memory runtime.

It supports the repository-side conventions used by Copilot agents memory, but it does not provision the GitHub or VS Code feature flags for you.

The `v1.0.0` release introduces a paradigm shift towards:

- Database-backed retrieval (SQLite cache)
- Model Context Protocol (MCP) integrations
- Shared folder conventions
- Command-driven usage
- Governed orchestration

The release maintains the principle of explicit Markdown backups:
- No hidden memory state outside the repository (all SQLite data is backed by readable `.md` files)

Copilot Memory remains an external, opt-in feature in GitHub and VS Code settings.

## Principle

Specifications are for active delivery.
Memory is for durable learning.

Do not overload feature specs with cross-feature memory.
Do not overload durable memory with routine implementation detail or feature-local notes.
Use feature memory plus synthesis to keep active context close to execution without turning the repo into a knowledge base.

## SQLite and MCP Primary Engine

The Node.js + SQLite optimizer and Model Context Protocol (MCP) server act as the primary engine for Memory Hub, unlocking fast semantic retrieval at large scale.

The optimizer does not replace source files. The SQLite database is a rebuildable operational cache, while the underlying Markdown `.md` files remain the authoritative, Git-reviewable backups.

The core flow is:

1. Search local SQLite cache via MCP tools.
2. Read selected snippets or synthesized context.
3. Keep `memory-synthesis.md` as the small AI-readable package used in normal planning.

The optimizer caches:

1. Durable memory lessons (`docs/memory/**/*.md`).
2. Development docs and Spec Kit artifacts (`specs/**/*.md`, etc.).

Memory Hub commands mandate the use of the SQLite cache to search, read, and write memory. The legacy markdown-only fallback has been deprecated in `v1.0.0` to guarantee high token efficiency and prevent large file reads.
