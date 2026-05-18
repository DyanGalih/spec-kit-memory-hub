---
description: "Memory-first prompt for security-review staged workflows."
---

Before reviewing staged changes:

- Read the staged diff and the current task/plan context.
- If the optimizer is enabled, use `/speckit.memory-md.prepare-context --feature specs/<feature> --query "security constraints vulnerabilities authentication authorization data-leakage"` first.
- Read `specs/<feature>/memory-synthesis.md` before any broader repository memory scan.
- Do not call `npx memory-hub` directly; use the `speckit.memory-md` command surface or the MCP tools exposed by the installed Memory Hub.
- Check that the staged changes still preserve the secure sequencing already established by the plan.

If systemic lessons emerge, follow the normal capture flow with `/speckit.memory-md.capture` after the review is delivered.
