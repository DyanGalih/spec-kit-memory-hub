---
description: "Memory-first prompt for security-review follow-up workflows."
---

Before turning findings into follow-up work:

- Read the latest review findings and the current plan/tasks.
- If the optimizer is enabled, prepare context with `/speckit.memory-md.prepare-context --feature specs/<feature> --query "security constraints vulnerabilities authentication authorization data-leakage"`.
- Read `specs/<feature>/memory-synthesis.md` before broad memory scans.
- Do not call `npx memory-hub` directly; use the `speckit.memory-md` command surface or the MCP tools exposed by the installed Memory Hub.
- Keep follow-up items deduplicated, sequenced, and compatible with Spec Kit task formatting.

If the follow-up reveals durable security lessons, propose capture via `/speckit.memory-md.capture` after the plan is shown.
