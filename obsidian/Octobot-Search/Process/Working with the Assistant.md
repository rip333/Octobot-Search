---
type: process
status: decided
created: 2026-08-16
tags:
  - process/assistant
---

# Working with the Assistant

## Default loop

1. **Orient:** read the dashboard, current focus, decision index, and latest report.
2. **Verify:** inspect repository evidence when implementation status matters.
3. **Collaborate:** explore product direction, compare options, or define one bounded gate.
4. **Plan:** put executable work in root `TODO.md`.
5. **Implement:** hand exactly one slice to the implementation agent.
6. **Report:** the implementation agent replaces root `REPORT.md` after verification.
7. **Reconcile:** Codex audits the report and working tree, then updates durable memory.

## Artifact ownership

| Artifact | Owner | Purpose |
| --- | --- | --- |
| Product judgment | Repository owner | Direction, priorities, and acceptance |
| `TODO.md` | Codex | One implementation contract and its gates |
| `REPORT.md` | Implementation agent | Latest completed-slice handoff only |
| Vault | Codex | Decisions, rationale, priority, history, and verified state |
| Code/tests/docs | Implementation agent for a delegated slice | Current implementation and repeatable evidence |

## Capture rules

Capture durable direction, decisions and reasons, material rejected alternatives, priority changes,
external-service assumptions, verified milestones, risks, and contradictions. Do not capture casual
exploration or promote an assistant suggestion without owner acceptance.

Preserve unrelated dirty changes. Do not rewrite history to make superseded choices disappear. Do not
mark implementation verified solely because a report or TODO checkbox says it is complete.

