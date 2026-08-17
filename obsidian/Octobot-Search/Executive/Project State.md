---
type: project-state
status: verified
verified: 2026-08-16
tags:
  - executive/state
---

# Project State

## Evidence boundary

This snapshot is based on repository inspection, canonical writable checks, a production build with
live Cerebro access, and focused live route checks on 2026-08-16. It verifies the local application
baseline, not Vercel production behavior or subjective visual acceptance.

## Present in the working tree

- Next.js 16 / React 19 / TypeScript application using the Pages router.
- Centralized Cerebro and Merlin access under `src/api/` with typed result and parsing modules.
- Vitest and Testing Library coverage across API contracts, page data, search, components, utilities,
  accessibility, and serialization.
- Vercel-only deployment documentation and a verification-oriented GitHub Actions workflow change.
- Local automation for hero data, ImageMagick bleed, and Photoshop print sheets.
- A completed 19-part refactor checklist plus six implemented first-round review fixes.

## Verified locally on 2026-08-16

- Focused review regressions: 4 files / 46 tests passed.
- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0.
- `npm test`: 19 files / 172 tests passed.
- `npm run build`: exit 0 with live Cerebro access; all static pages generated.
- `npm audit --omit=dev --audit-level=info`: zero vulnerabilities.
- Five repaired co-authored Merlin routes returned 200 from the built app.
- `/cards/ms/bad%20code`, `/cards/si/set_a_%26_b`, `/cards/n/whatever`, and
  `/card/99999999` returned 404.
- Direct Merlin counts for the five routes were 19, 20, 18, 18, and 6. The differing counts in the
  implementation report are not independently confirmed.

## Not yet verified through this workflow

- The batch overwrite fix under a real `cmd.exe`/ImageMagick run.
- Footer wrapping with a layout-capable browser; its CSS was source-reviewed only.
- Vercel production behavior, analytics, subjective visual acceptance, and real assistive-technology
  acceptance.

## Risks

- The worktree is broad and uncommitted, so authorship and slice boundaries cannot be inferred from Git
  status alone.
- No `REPORT.md` exists for the latest implementation slice.
- The batch and footer review fixes lack automated regressions despite the repository-wide regression
  rule.
- The production build depends on live Cerebro availability.
- External response formats and collection contents can drift after local fixtures were authored.

Sources: `README.md`, `CONTEXT.md`, `TODO.md`, `package.json`, current working tree.
