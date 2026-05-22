# 🧠 Spec Kit Memory Hub

> Durable project memory and context for AI-assisted development.

[![Version](https://img.shields.io/badge/version-1.0.0-22c55e)](extension.yml)
[![Spec Kit](https://img.shields.io/badge/Spec%20Kit-compatible-2563eb)](https://spec-kit.dev)
[![Repo-native](https://img.shields.io/badge/storage-repo--native-f59e0b)](https://spec-kit.dev)

**Spec Kit Memory Hub** (`memory-md`) is a repository-native, Git-reviewable memory extension that provides AI coding assistants with persistent context across features. It ensures your agents reuse past architectural decisions, domain constraints, bug patterns, and lessons learned instead of repeating mistakes.

---

## ⚡ Core Value: Up to 10x Token Savings

Traditional systems either read the entire codebase (wasting thousands of tokens) or start every prompt from scratch. Memory Hub uses a **three-tier architecture** with a **SQLite Caching Optimizer** to compress context:

| Feature Layer | Storage Location | Retention / Scope | Context Strategy |
| :--- | :--- | :--- | :--- |
| **1. Governance Law** | `.specify/memory/` | Immutable guidelines (principles, rules, constitution) | Injected only during planning/validation |
| **2. Project History** | `docs/memory/` | Long-term memory (decisions, worklogs, bug preventions) | Stored as Markdown, indexed and retrieved selectively |
| **3. Feature Memory** | `specs/<feature>/` | Temporary context (watchpoints, open questions) | Generates `memory-synthesis.md` hard-capped at **900 words** |

### Why Developers and Teams Use It:
*   **Up to 10x Token Reduction**: Replaces broad codebase context dumps with highly compressed, 900-word targeted synthesis.
*   **Prevent Recurring Bugs**: Ensures a bug solved in Feature #2 is never reintroduced in Feature #5.
*   **Seamless Onboarding**: New developers and AI agents immediately inherit the project's historical memory.
*   **Zero-Leak Privacy**: Global cross-project sync operates entirely locally using SHA-256 project path anonymization.

---

## 🚀 Quick Start in 3 Steps

### 1. Install the Extension
Add the extension to Spec Kit CLI (either from the official registry, a release artifact URL, or a local directory):

**From the Registry (Recommended):**
```bash
specify extension add memory-md
```

**From a Release Artifact (ZIP):**
```bash
specify extension add memory-md --from https://github.com/DyanGalih/spec-kit-memory-hub/archive/refs/tags/v1.0.0.zip
```

**From a Local Developer Artifact:**
```bash
specify extension add memory-md --dev /path/to/spec-kit-memory-hub
```

### 2. Bootstrap Your Project
Initialize the folder structure and instructions inside your repository:
```text
/speckit.memory-md.init
```
This creates:
*   `docs/memory/` — Permanent, Git-tracked project memory templates.
*   `.github/copilot-instructions.md` — Active agent workflow context.
*   `.specify/extensions/memory-md/config.yml` — Customizable extension settings.

### 3. Profile Stack sync channels
Profile the repository's technologies to subscribe to cross-project shared lessons:
```text
/speckit.memory-md.init-project
```

---

## 🛠️ Memory Commands Directory

| Spec Kit Command | When To Use | What It Does |
| :--- | :--- | :--- |
| **`/speckit.memory-md.init`** | Once, at project setup | Bootstraps the folder structure, templates, and config. |
| **`/speckit.memory-md.plan-with-memory`** | Before planning a feature | Selectively indexes memory files and synthesizes a `memory-synthesis.md` file. |
| **`/speckit.memory-md.prepare-context`** | During active implementation | Refreshes the local database cache and regenerates synthesis blocks. |
| **`/speckit.memory-md.capture`** | After verifying feature work | Reviews work to propose high-value permanent lessons for BUGS.md or DECISIONS.md. |
| **`/speckit.memory-md.capture-from-diff`** | After rapid bug fixes | Fast capture path: reviews git diffs and extracts durable bug prevention patterns. |
| **`/speckit.memory-md.share-lesson`** | When local lesson is validated | Elevates an approved local lesson globally and anonymizes paths via SHA-256. |
| **`/speckit.memory-md.sync-shared`** | When beginning a new feature | Syncs matching tech-stack lessons from other projects into `docs/memory/SHARED_LESSONS.md`. |
| **`/speckit.memory-md.audit`** | When memory gets noisy | Finds contradictions, stale items, or duplicates, proposing cleanups. |
---

## 🔌 Native Model Context Protocol (MCP) Server

Memory Hub includes a native, fully-compliant **Model Context Protocol (MCP) Server**. This allows modern LLM clients (such as Claude Desktop, VS Code Cline, Roo-Cline, Cursor, etc.) to query, synthesize, share, and sync memory directly via JSON-RPC, without needing to execute terminal CLI subprocesses.

### Key MCP Tools Exposed to Your Agent:
*   **`speckit_memory_search`**: Fast SQLite-cached semantic search across local project memories.
*   **`speckit_memory_synthesize`**: Directly generates a 900-word compressed `memory-synthesis.md` context file.
*   **`speckit_memory_share_lesson`**: Elevates and publishes an approved local lesson into the global local database.
*   **`speckit_memory_sync_shared`**: Pulls matching technology stack lessons into `docs/memory/SHARED_LESSONS.md` with interactive review banners.
*   **`speckit_memory_init_project`**: Profiles active project languages/frameworks to configure sync channels.

To start the server, configure your client to run the `mcp-start` command:
```bash
npx -y speckit-memory mcp-start
```

*For complete configurations for Claude Desktop, Cline, and other IDE client settings, see the **[SQLite & MCP Architecture Guide](docs/sqlite-mcp-architecture.md)**.*

---

## 📚 Technical Documentation Map

We have split the Spec Kit Memory Hub manual into focused technical resources:

```
spec-kit-memory-hub/
├── README.md                           ← Highly readable, high-level project summary
└── docs/
    ├── value-proposition.md             ← Business case: Team velocity, alignment, and 10x token ROI
    ├── governed-memory-workflow.md      ← Integration guides for Architecture Guard governed pipelines
    ├── reference-manual.md              ← Detailed specs: File formats, CLI command list, and config schemas
    ├── sqlite-mcp-architecture.md       ← Blueprints: SQLite cache, Model Context Protocol (MCP), and global sync
    ├── first-ten-minutes.md             ← Step-by-step developer walkthrough for bootstrapping a new project
    └── optimizer-roadmap.md             ← Execution roadmap: SQLite Phase 1-4 and Phase 3.5 milestones
```

### Direct Links:
*   🧠 **[Value Proposition & ROI](docs/value-proposition.md)** — Deep-dive on team velocity, alignment gains, and exact token benchmarks.
*   🛡️ **[Governed Memory Workflow](docs/governed-memory-workflow.md)** — Best practices for combining Memory Hub with **Architecture Guard** and **Security Review** validation gates.
*   📘 **[Reference Manual](docs/reference-manual.md)** — File schema layouts, available prompts, environment variables, configuration properties, and IDE agent settings.
*   🔌 **[SQLite & MCP Architecture](docs/sqlite-mcp-architecture.md)** — Architectural details of the local optimizer, exposed Stdio MCP JSON-RPC tools, and anonymized sync protocols.
*   ⏱️ **[First 10 Minutes: Concrete Example](docs/first-ten-minutes.md)** — Practical developer walkthrough from `/init` through context planning.
*   🗺️ **[Technical Roadmap](docs/optimizer-roadmap.md)** — The active development roadmap across SQLite, MCP, and high-performance hybrid indexing.

---

## ⚖️ Design Philosophy

*   **Automated Confidence-Based Capture**: Memory capture evaluates AI confidence. If confidence is > 50%, memory is automatically captured and registered. If <= 50%, it is ignored to keep permanent memory pristine.
*   **Visible in Git**: All decisions and lessons are fully tracked in Git history, not hidden in local app state.
*   **Specs Remain Clean**: Specifications define the active target; Memory Hub captures durable past constraints.
*   **AI Complements Thinking**: The agent prepares synthesis context, but developers review and authorize all changes.
