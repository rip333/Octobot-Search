# Octobot Search - Assistant Guide

Octobot Search is a Next.js/TypeScript browser for Marvel Champions card data from Cerebro and Merlin.
The repository also contains Python, PowerShell, batch, and Photoshop automation for data and print work.

## Executive memory and role split

When Codex is asked to brainstorm, plan, prioritize, recall decisions, manage project state, reconcile
documentation, steward `TODO.md`, review `REPORT.md`, or prepare an implementation handoff, use
`.agents/skills/octobot-search-executive-memory/SKILL.md` and the vault at
`obsidian/Octobot-Search/`.

- The owner decides product direction, priority, and subjective acceptance.
- Codex owns executive memory, planning, evidence reconciliation, and implementation handoffs.
- Claude Code or another implementation agent normally executes one bounded `TODO.md` slice, verifies
  it, updates implementation documentation, and replaces root `REPORT.md` after completion.

Codex may implement directly when explicitly asked. Isolated implementation work does not require vault
updates unless the user also asks for planning, capture, or reconciliation.

## Read before changing code

1. Read the active section of `TODO.md`, this file, `CONTEXT.md`, and `RUNNING.md`.
2. Read `REPORT.md` when present as the previous implementation agent's claims, not current truth.
3. Inspect `git status --short` and preserve unrelated dirty and untracked changes.
4. Read the closest code, tests, and documentation for the behavior being changed.
5. Keep the change inside one named slice and its explicit stop boundary.

## Product and architecture invariants

1. Production deploys only to Vercel. Do not add GitHub Pages or a static-export deployment path.
2. Official search uses official Cerebro cards only. Creator Drive Libraries remain disabled unless the
   owner explicitly restores them through a security-reviewed feature.
3. Keep all external HTTP under `src/api/`. Centralize timeouts, bounded responses, retries, parsing,
   safe diagnostics, and typed result handling there.
4. Build Cerebro expressions only through `src/api/cerebroQuery.ts`. Validate route parameters with
   `src/api/routeParams.ts` before making an upstream call.
5. Never cache a transient upstream failure as successful empty content. Preserve the last good ISR
   result where the current architecture supports it.
6. Keep raw upstream models narrow: represent consumed fields and validate external responses before
   rendering or caching them.
7. Do not mutate React props. Keep filtering, sorting, normalization, and tokenization pure when
   practical.
8. Preserve accessible semantics, keyboard behavior, focus visibility, responsive layouts, and stable
   card/printing identity.
9. Do not log full user search URLs or secrets. Use safe endpoint labels and request identifiers.
10. Treat live Cerebro and Merlin behavior as external evidence that can change; record the date and
    boundary of any observation.

## Regression and verification rules

- Every corrected bug gets a regression test that can fail without the fix and guards the bug class.
- Prefer focused Vitest tests against public behavior, then run the complete repository checks.
- Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` before declaring a completed
  application slice. Also run `npm audit --omit=dev --audit-level=info` for dependency/security work.
- `npm run build` reads live Cerebro data. Report an upstream/network failure honestly; do not infer a
  pass from the other checks.
- Do not deploy, change Vercel project settings, publish, stage, commit, or push unless the user asks.
- Report exact command results. A checked TODO item or an implementation-agent report is not independent
  verification.

## Documentation ownership

- `TODO.md`: executable implementation contract and completion gates.
- `REPORT.md`: implementation agent's replace-in-place report for the latest completed slice. Codex
  reads but never edits it.
- `obsidian/Octobot-Search/`: rationale, decisions, priorities, verified state, history, and open
  questions.
- `CONTEXT.md`: current technical map and cross-module contracts.
- Closest `README.md` or source-adjacent documentation: detailed implementation behavior and operations.
- `RUNNING.md`: authoritative commands and verification caveats.

Do not duplicate a full checklist or technical schema into the vault. Link to the owning source.

