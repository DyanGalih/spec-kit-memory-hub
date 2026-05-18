---
description: "Profile and configure project technical stack for cross-project shared memory sync channels."
---

# Profile Project Technical Stack

Configure this project's primary programming language and optional web framework to enable cross-project shared memory channels and syncing.

Use this when:

- you are initializing Memory Hub in a project for the first time
- the project technical stack changes or you want to update sync channels
- you want to verify or adjust synchronization parameters

Tasks:

1. Identify the project's primary programming language and optional web framework (e.g., `php` / `laravel`, `typescript` / `nestjs`, `go` / `gin`).

   To auto-detect, inspect project root files:
   - `package.json` → check `dependencies` for `@nestjs/core` → `typescript/nestjs`
   - `composer.json` → check `require` for `laravel/framework` → `php/laravel`
   - `go.mod` → `go` (+ check imports for gin, echo, fiber)
   - Confirm detected stack with the user before proceeding.

2. **Execution Path**:
   - Use the MCP tool exposed by the `speckit-memory-hub` server:
   ```
   speckit_memory_init_project(language="<lang>", framework="<fw>")
   ```
   *(Omit `framework` if the project uses a pure language stack.)*
   - Do not instruct the user to run a local command-line cache tool for project profiling.

3. Confirm that the command successfully ran and saved the new configuration profile. The config file will now have a strictly typed `project_profile` field:

   ```yaml
   project_profile:
     language: <language>
     framework: <framework>
     shared_memory:
       enabled: true
       sync_channels:
         - global
         - <language>
         - <framework>
   ```

4. Explain to the user that their project profile is now active, allowing targeted lesson sharing and syncing across workspace boundaries without exposing local path details.
