---
description: "Initialize layered memory, synthesis, and spec starter files in a target repo."
---

# Init

Set up this repository to use the layered Spec Kit Memory workflow.

Tasks:

1. Read `config-template.yml` at the extension root for default values.
   If the project has `.specify/extensions/memory-md/config.yml`, use those values instead.
   Fall back to defaults: `memory_root: docs/memory`, `specs_root: specs`.
2. **Check for optimizer mode first**:
   - If `speckit-memory-hub` MCP is configured in the user's AI client (e.g., present in `mcp_config.json` or `config.toml`): explain that Phase 1 durable memory and Phase 2 doc cache management can run through MCP tools without per-project command-line cache calls.
     - If the project wants MCP-managed optimization: set `optimizer.enabled: true` in `.specify/extensions/memory-md/config.yml`.
     - If the project wants markdown-only operation: keep `optimizer.enabled: false`.
   - If MCP is **not** configured: Ask whether the project wants the optional SQLite optimizer enabled later through MCP. Explain the minimum runtime requirements for the central MCP server: Node.js 18+, npm, local filesystem access, and the ability to install the `better-sqlite3` native dependency if a prebuilt binary is not available.
     - If the user says no: keep the markdown-first workflow only.
     - If the user says yes: set `optimizer.enabled: true` in `.specify/extensions/memory-md/config.yml` and instruct them to configure/start the MCP server through their AI client before relying on cache tools.
3. Ensure these folders exist:
   - `{memory_root}` (default: docs/memory)
   - `{specs_root}` (default: specs)
   - .github
4. Ensure these subdirectories exist for flat date-based memory files:
   - `{memory_root}/decisions/`
   - `{memory_root}/architecture/`
   - `{memory_root}/bugs/`
   - `{memory_root}/worklog/`
5. Create or verify core memory files from the extension templates:
   - `{memory_root}/INDEX.md`
   - `{memory_root}/PROJECT_CONTEXT.md`
6. **Automatic Migration (Re-install Scenario)**:
   - Check if legacy monolithic files (`DECISIONS.md`, `ARCHITECTURE.md`, `BUGS.md`, `WORKLOG.md`) exist in `{memory_root}`.
   - If they do, this is an upgrade/re-install. Automatically run `npx speckit-memory migrate-memory` or `npm run migrate` (if available in the project) to safely split them into the new flat subfolder format.
7. Create or update spec starter files so every feature folder can contain:
   - spec.md
   - plan.md
   - tasks.md
   - `{feature_memory_filename}` (default: memory.md)
   - `{memory_synthesis_filename}` (default: memory-synthesis.md)
8. **Centralize Memory Governance**:
   - **Mandatory**: Create or Update `.specify/memory/workflow.md`. If the file already exists, reconcile its content with the extension template to ensure it contains the latest mandatory command references, while strictly preserving any existing project-specific governance rules.
   - **Migration**: Detect active agent context files: `.github/copilot-instructions.md`, `AGENTS.md`, `CODEX.md`, `CLAUDE.md`, `GEMINI.md`, `WINDSURF.md`, `ANTIGRAVITY.md`, and other local agent rules if present.
   - **Inject Pointer**: For each existing file, do NOT overwrite the whole file. Instead, find the `### Spec Kit` section (or create it) and replace it with the **Pointer Model**: "You MUST follow the memory-first workflow defined in `.specify/memory/workflow.md`. Before planning, prepare context using the best available path: MCP tools if configured, `/speckit.memory-md.prepare-context` if Spec Kit commands are available, otherwise the documented markdown-first fallback."
   - **Create Missing Templates**: For any agent file that does not yet exist but is in the standard set (`CODEX.md`, `CLAUDE.md`, `GEMINI.md`, `WINDSURF.md`, `ANTIGRAVITY.md`), create it from the corresponding extension template only if the user confirms they use that agent. Never create agent files speculatively.
9. If `.specify/extensions/memory-md/config.yml` does not exist, create it from `config-template.yml` with default values.
10. Summarize the memory model:
   - constitution / principles = stable operating rules
   - durable project memory = reusable cross-feature knowledge
   - active feature memory = feature-local constraints, open questions, and carry-forward context
   - memory index = compact routing map for selecting relevant durable entries
   - ephemeral run context = temporary prompt or terminal state that must not be committed

**Guardrails**:
- **Safety First**: Update existing files safely by targeting only managed sections (e.g., `### Spec Kit`).
- **No Destruction**: Never overwrite project-specific memory or custom agent instructions without explicit approval.
- **Reconciliation**: If `.specify/memory/workflow.md` exists, treat it as a "living document"—improve its technical requirements without deleting its existing context.

11. List the first customization steps:
   - fill in project context and architecture
   - migrate any durable lessons into decisions or bugs
   - stop using worklog as a changelog
   - use feature memory plus synthesis on the next spec
   - review config.yml and adjust paths if needed

Prioritize preserving existing project files.
Never overwrite project-specific memory without explicit approval.
