---
type: decision-index
status: active
created: 2026-08-16
tags:
  - decisions
---

# Decision Index

## D-001 - Vercel is the only production deployment target

- **Status:** Decided in repository documentation
- **Date captured:** 2026-08-16
- **Decision:** Vercel's Git integration owns deployment. GitHub Actions verifies but does not publish;
  GitHub Pages is unsupported.
- **Sources:** `README.md`, `TODO.md`.

## D-002 - Official search remains official Cerebro only

- **Status:** Decided in repository documentation
- **Date captured:** 2026-08-16
- **Decision:** Search excludes Creator Drive Libraries and other unofficial sources. Restoration is a
  new security-reviewed product decision rather than a dormant toggle.
- **Sources:** `README.md`, `CONTEXT.md`, `src/pages/creators/[id].tsx`.

## D-003 - Upstream failure is not empty content

- **Status:** Decided; implementation verified locally on 2026-08-16
- **Date captured:** 2026-08-16
- **Decision:** Distinguish empty, unavailable, invalid, and successful results. Never cache a transient
  outage as successful empty content; retain the last good ISR output when possible.
- **Sources:** `README.md`, `CONTEXT.md`, `src/api/result.ts`, `src/api/revalidate.ts`.

## D-004 - Every corrected bug receives a red-capable regression test

- **Status:** Decided in `TODO.md`; current compliance gap for the batch and footer review fixes
- **Date captured:** 2026-08-16
- **Decision:** Reproduce a defect before fixing it and guard the class of bug rather than only the one
  observed input.
- **Sources:** `TODO.md`, `AGENTS.md`.

## D-005 - Executive memory and implementation are separate roles

- **Status:** Decided by repository setup
- **Date:** 2026-08-16
- **Decision:** The owner sets direction; Codex curates memory, plans, and reconciliation; an
  implementation agent executes one `TODO.md` slice and owns replace-in-place `REPORT.md`.
- **Reason:** Separate intent, implementation claims, and independent verification while giving each
  agent one canonical artifact.
- **Sources:** `AGENTS.md`, `CLAUDE.md`,
  `.agents/skills/octobot-search-executive-memory/SKILL.md`.

## D-006 - The synthetic Player classification is exclusive

- **Status:** Decided and implemented
- **Date:** 2026-08-16
- **Decision:** `Player` means "not Encounter," so it must never coexist with another selected
  classification. Unions of real classifications may legitimately match every card and remain valid.
- **Reason:** Treating the negation as an ordinary union member creates a visible no-op filter; applying
  the same restriction to real classifications would break the decided any-within-group semantics.
- **Sources:** `TODO.md`, `src/utils/cardFilters.ts`, `src/utils/cardFilters.test.ts`.
