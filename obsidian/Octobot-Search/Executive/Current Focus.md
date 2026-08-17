---
type: executive-focus
status: verified
verified: 2026-08-16
tags:
  - executive/focus
---

# Current Focus

The active implementation checklist lives in repository-root `TODO.md`. This note records priority and
evidence context without duplicating it.

## Now: protect the reconciled refactor before opening a new feature slice

Independent reconciliation on 2026-08-16 confirmed the broad refactor and all six first-round review
fixes are present. Focused tests passed 4 files / 46 tests; the canonical writable checks passed
TypeScript, ESLint, 19 files / 172 tests, a live Cerebro production build, and a zero-vulnerability
production audit.

The repaired Merlin routes independently returned 200, while malformed Merlin/Cerebro routes and a
missing card returned 404. The current live Merlin counts are 19, 20, 18, 18, and 6, not the
implementation report's 19, 20, 20, 2, and 6; treat counts as dated external evidence.

The remaining gate is repository protection and evidence hygiene:

1. Decide whether the source-reviewed batch/footer fixes need automated regressions or an explicit
   exception to the "every fixed bug" rule.
2. Stage and commit the broad working tree only when the owner explicitly authorizes it.
3. Create a current `REPORT.md` through the implementation-agent workflow if that handoff record is
   still desired; none exists today.
4. Select the next product priority only after the baseline is committed.

## Open product questions

- Whether safely formatted Merlin HTML card text is the next user-facing feature.
- Whether CI should retry a build when live Cerebro is temporarily unavailable.
- Whether any removed community/profile links should return if upstream data reappears.
