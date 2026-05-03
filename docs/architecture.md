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

The initial release intentionally relies on:

- explicit Markdown files
- shared folder conventions
- command-driven usage
- governed orchestration

The initial release intentionally does not include:

- automatic hierarchical memory loading
- database-backed retrieval
- hidden memory state outside the repository

Copilot Memory remains an external, opt-in feature in GitHub and VS Code settings.

## Principle

Specifications are for active delivery.
Memory is for durable learning.

Do not overload feature specs with cross-feature memory.
Do not overload durable memory with routine implementation detail or feature-local notes.
Use feature memory plus synthesis to keep active context close to execution without turning the repo into a knowledge base.
