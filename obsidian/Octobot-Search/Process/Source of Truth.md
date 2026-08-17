---
type: process
status: decided
created: 2026-08-16
tags:
  - process/documentation
---

# Source of Truth

## Evidence hierarchy

Use the narrowest authoritative source for the question:

1. Current runtime behavior and production code, followed by a focused reproduction.
2. Focused tests and the complete Vitest suite.
3. Type-check, lint, production build, and dependency audit output.
4. Live Cerebro/Merlin observations and Vercel behavior, dated because external state changes.
5. The closest technical documentation, checked against current call sites.
6. `CONTEXT.md` for cross-module architecture and `AGENTS.md` for repository rules.
7. This vault for intent, decisions, priorities, and verified project state.
8. `TODO.md` for planned and active implementation work.
9. `REPORT.md` for the latest implementation agent's claims and observed results.

A lower item cannot overrule observed implementation, but implementation can be a bug relative to a
decided product contract.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| **Idea** | Uncommitted possibility |
| **Proposed** | Concrete option awaiting owner acceptance or evidence |
| **Decided** | Accepted product or architecture direction |
| **Implemented** | Present in the working tree, not necessarily exercised |
| **Verified** | Confirmed against stated evidence on a stated date |
| **Stale** | Superseded or contradicted, retained for history |

## Duplication rule

- The vault explains why, priority, decisions, history, and relationships.
- `TODO.md` tells implementation agents what to do.
- `CONTEXT.md` and source-adjacent documentation explain technical contracts.
- Code implements current behavior.
- Tests establish repeatable evidence.
- `REPORT.md` communicates the latest completed implementation slice to Codex.

Link to the owning source rather than copying its schema or checklist.

## Verification workflow

1. Identify whether a claim concerns intent, implementation, automated behavior, external-service
   behavior, or visual/product acceptance.
2. Read relevant decisions and the current implementation contract.
3. Inspect the current source and tests.
4. Run the narrowest useful check, followed by broader checks in proportion to risk.
5. Record exact results, date, environment, and network/external-service boundaries.
6. Mark contradictions and superseded decisions explicitly.

