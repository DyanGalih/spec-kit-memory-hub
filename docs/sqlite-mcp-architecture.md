# SQLite & MCP Architecture

This document describes the under-the-hood caching and communication architecture of Spec Kit Memory Hub.

---

## Local SQLite Optimizer

Memory Hub includes a **local SQLite cache optimizer** to serve as the primary engine for fast, low-token semantic memory retrieval.

The CLI (`npx speckit-memory`) and MCP Server parse all markdown memory files, chunk them by section, and store them in a local `.specify/extensions/memory-md/cache.db`.

### How it is Wired to the LLM Commands

You do **not** need to run `npx speckit-memory` manually. The LLM commands (like `/speckit.memory-md.plan-with-memory`) mandate the use of the SQLite cache via MCP tools.

When the LLM runs a command, it follows this internal logic:
1. The LLM invokes the MCP tool `speckit_memory_refresh_cache` to sync the SQLite cache with the backup `.md` files.
2. The Node.js binary updates the SQLite cache in the background.
3. The LLM runs `speckit_memory_synthesize` to generate a highly compressed `memory-synthesis.md`.
4. The LLM reads only the final compressed synthesis file, saving thousands of context tokens.

### Enabling the Engine

The SQLite cache engine is the default workflow starting in v1.0.0. To use it, simply configure the MCP server in your AI client.

If you are running from a local developer setup instead of the npm registry:
1. Navigate to the extension directory and build the Node.js binary:
   ```bash
   cd .specify/extensions/memory-md
   npm install && npm run build
   ```

---

## Phase 3: Cross-Project Memory Sharing & Syncing (Global Shared Memory)

Memory Hub supports a local-first **cross-project shared memory network**. When you work across multiple repositories or projects sharing a similar technology stack (e.g. NestJS, Laravel, Next.js, Go), projects can publish and subscribe to high-signal architectural lessons and bug prevention patterns in a decentralized local cache.

### Core Architecture & Privacy Principles

1. **Local-Only Boundary (No Network Leaks)**:
   All sharing occurs strictly within your local environment. The central shared database resides locally at `~/.spec-kit/shared-memory.sqlite` and never makes external HTTP requests or network calls.
   
2. **Project Path Anonymization**:
   To preserve developer privacy, the real folder paths of repositories are **never** shared, stored, or echoed back in tool responses.
   - When a lesson is elevated, Memory Hub generates a cryptographic `SHA-256` hash of the absolute project root path to act as a unique, anonymized project identifier.
   
3. **Self-Exclusion Sync Filter**:
   When you sync global lessons to a project, Memory Hub calculates the active project's path hash and automatically filters out any lessons originating from the current project itself, ensuring you only receive external learnings.

---

### Step-by-Step Usage Guide

#### Step 1: Profile Your Project Stack
Run `/speckit.memory-md.init-project` inside a Spec Kit-capable client, or call the MCP tool `speckit_memory_init_project(language="typescript", framework="nestjs")`. This configures `sync_channels` inside your project's `.specify/extensions/memory-md/config.yml`.

#### Step 2: Elevate and Share a Local Lesson
Once you have written a high-value lesson to your local `docs/memory/BUGS.md` or `DECISIONS.md` file, promote it globally so your other projects benefit from it:
1. Register the lesson details locally:
   ```bash
   npx speckit-memory register-memory \
     --id "B99" \
     --title "Prevent NicePay Webhook 403 Forbidden Errors" \
     --tags "nicepay,webhook,cors,csrf" \
     --file "docs/memory/BUGS.md"
   ```
2. Publish it to the global cross-project store:
   - When the AI runs `/speckit.memory-md.share-lesson`, it automatically calls the high-level `speckit_memory_share_lesson` MCP tool.
   - The lesson is safely published globally under the `typescript/nestjs` channels.

#### Step 3: Synchronize External Lessons
When starting a new feature in another repository that shares the same stack:
1. Run `/speckit.memory-md.sync-shared` inside a Spec Kit-capable client or call the MCP tool `speckit_memory_sync_shared(projectRoot?)`.
2. Memory Hub retrieves matching lessons from other projects and writes them to a temporary local review buffer at `docs/memory/SHARED_LESSONS.md` formatted with interactive review banners:
   ```markdown
   # Shared Lessons — Synced 2026-05-17
   
   > These lessons were synced from the global cross-project memory.
   > **Review carefully before adopting.** Delete entries that do not apply to this project.
   
   ---
   ### B99 — Prevent NicePay Webhook 403 Forbidden Errors
   **Stack**: `typescript/nestjs`
   **Tags**: nicepay,webhook,cors,csrf
   **Source**: `proj-f83b2a5c`
   
   Verify that NicePay webhooks are explicitly exempted from local NestJS CSRF guards and that route wildcards are configured in the reverse-proxy.
   ```
3. Open `docs/memory/SHARED_LESSONS.md`, review the entries, copy any relevant patterns into your permanent local decisions or bugs files, and delete the temporary review file.

---

## Model Context Protocol (MCP) Integration

Spec Kit Memory Hub includes a native, fully-compliant **Model Context Protocol (MCP) Server**. This server enables modern LLM clients (such as Claude Desktop, VS Code Cline, Roo-Cline, Cursor, etc.) to query, synthesize, share, and sync memory directly via JSON-RPC, without needing to execute terminal CLI subprocesses.

### Why Use MCP Over CLI?

- **Zero Overhead**: Instead of invoking `npx speckit-memory` or shell commands, the LLM calls standard tools directly inside the chat interface. This is faster and avoids subprocess execution overhead.
- **MCP-First Prompts**: The Spec Kit workflows are fully aware of the MCP server. If registered and active, the LLM automatically invokes the native MCP tools (like `speckit_memory_share_lesson` or `speckit_memory_sync_shared`). If the MCP server is not active, the prompts automatically fall back to equivalent `npx` CLI commands.

### Exposed MCP Tools

The server registers the following native JSON-RPC tools with the LLM client:

| Tool Name | Description | Key Arguments |
|---|---|---|
| `speckit_memory_search` | Search the local project's SQLite memory cache & indexing. | `query` (string, required), `projectRoot` (string, optional) |
| `speckit_memory_synthesize` | Generate the `memory-synthesis.md` file for a feature scope. | `feature` (string, required), `query` (string, optional), `projectRoot` (string, optional) |
| `speckit_memory_share_lesson` | Elevate an approved local technical lesson to the global database. | `id`, `title`, `content`, `language` (required); `framework` (optional), `tags` (array, optional) |
| `speckit_memory_sync_shared` | Sync matching tech stack lessons from global memory into review buffer. | `projectRoot` (string, optional) |
| `speckit_memory_init_project` | Profile and initialize project language/framework sync channels in `config.yml`. | `language` (required); `framework`, `projectRoot` (optional) |

### How to Run the MCP Server (No Publishing Required!)

You **do not** need to publish this plugin to npm to use it! You can run and test it completely locally in your development environment.

Because MCP uses Standard Input/Output (`stdio`) as its transport, the LLM client automatically launches and manages the lifecycle of the server process behind the scenes. You **do not** need to keep a terminal window open or manually run a background command.

To connect your LLM client to your local, unpublished plugin, configure the client using one of the two methods below:

#### Method A: Direct Node Path (Recommended for local development)
Point your LLM client directly to the built bundle in your local repository checkout. This guarantees that any code changes you make and build locally are immediately active:

- **Command**: `node`
- **Arguments**: `["/absolute/path/to/spec-kit-memory-hub/dist/bin/speckit-memory.js", "mcp-start"]`

#### Method B: Local npm Linking
If you prefer to use the standard CLI command globally without publishing, you can link the package to your local environment:

1. Inside your `spec-kit-memory-hub` repository root, run:
   ```bash
   npm link
   ```
2. This creates a global symlink on your machine. You can now configure the client to run the executable directly:
   - **Command**: `speckit-memory`
   - **Arguments**: `["mcp-start"]`

### Client Integration Configurations

#### 1. Claude Desktop Configuration
Add the server config block to your global Claude Desktop configuration file (typically `~/.config/Claude/claude_desktop_config.json` on Linux/macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "speckit-memory-hub": {
      "command": "npx",
      "args": [
        "-y",
        "speckit-memory",
        "mcp-start"
      ]
    }
  }
}
```

*For local development/development builds, you can point directly to your node installation path:*
```json
{
  "mcpServers": {
    "speckit-memory-hub": {
      "command": "node",
      "args": [
        "/absolute/path/to/spec-kit-memory-hub/dist/bin/speckit-memory.js",
        "mcp-start"
      ]
    }
  }
}
```

#### 2. VS Code Extensions (Cline, Roo-Cline)
If you use Cline or Roo-Cline in VS Code, add the configuration under the client's MCP Settings panel or directly in the settings file (e.g., `cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "speckit-memory-hub": {
      "command": "npx",
      "args": [
        "-y",
        "speckit-memory",
        "mcp-start"
      ],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

#### 3. Antigravity Configuration
If your Antigravity build exposes a local MCP stdio configuration, you can register Memory Hub using the same `command` + `args` pattern shown below. The exact settings file path and schema may vary by Antigravity release, so treat this as a compatibility template rather than a guaranteed product-specific path:

```json
{
  "mcpServers": {
    "speckit-memory-hub": {
      "command": "npx",
      "args": [
        "-y",
        "speckit-memory",
        "mcp-start"
      ]
    }
  }
}
```

If your Antigravity installation does not currently expose MCP settings, use the repository instruction template `ANTIGRAVITY.md` and ensure `npx speckit-memory` commands are explicitly invoked in the prompts.

*For local active development, you can point directly to your build directory:*
```json
{
  "mcpServers": {
    "speckit-memory-hub": {
      "command": "node",
      "args": [
        "/absolute/path/to/spec-kit-memory-hub/dist/bin/speckit-memory.js",
        "mcp-start"
      ]
    }
  }
}
```

#### 4. Codex CLI & Skills Configuration
For **Codex** (the OpenAI skills-based developer agent), you can hook up the MCP server by specifying the stdio configurations inside the Codex CLI configuration file (typically `~/.config/codex/config.toml`):

```toml
[mcp_servers.speckit_memory_hub]
command = "npx"
args = ["-y", "speckit-memory", "mcp-start"]
```

*For local active development, you can point directly to your build directory:*
```toml
[mcp_servers.speckit_memory_hub]
command = "node"
args = [
  "/absolute/path/to/spec-kit-memory-hub/dist/bin/speckit-memory.js",
  "mcp-start"
]
```

---

### Database Cache Maintenance

Memory Hub separates local project caches from the global shared database to allow atomic purging:

- **Flush Local Project Cache**:
  Purges the local repository SQLite database and cleans up orphaned `-wal` and `-shm` transaction logs.
  ```bash
  npx speckit-memory flush-memory
  ```
- **Flush Global Shared Database**:
  Deletes the central cross-project memory database. Because this affects all repositories on your system, it requires a manual confirmation prompt:
  ```bash
  npx speckit-memory flush-global
  ```
