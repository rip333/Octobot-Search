# Octobot-Search Context

## Project Overview
Octobot-Search is a Next.js + TypeScript web application that provides a searchable browser for Marvel Champions card data. It consumes data from external APIs (Cerebro and Merlin) and presents it in a card-browsing UI. The repository also includes local automation scripts for data extraction (Python) and print-sheet layout (Photoshop/ExtendScript, ImageMagick).

## Key Features
- **Card Browser:** browse official sets and packs, plus community sets loaded on demand.
- **Search:** official Cerebro cards only, with exact-then-partial matching.
- **Static Generation:** `getStaticProps`/`getStaticPaths` with ISR.
- **Styling:** Tailwind CSS plus CSS Modules.
- **Analytics:** Vercel Analytics and Speed Insights.

## Tech Stack
- **Framework:** Next.js 16 (Pages router)
- **Language:** TypeScript 5 (target ES2022), Python (scripts), ExtendScript (Photoshop)
- **UI:** React 19
- **Styling:** Tailwind CSS, PostCSS, CSS Modules
- **Data fetching:** Axios, behind the shared client in `src/api/`
- **Testing:** Vitest, Testing Library (jsdom for component tests)
- **Deployment:** Vercel only

## Key Directories & Files
- `src/api/` — the only place external HTTP happens. See "External data" below.
- `src/pages` — Next routes and page components.
- `src/components` — reusable UI components.
- `src/models` — the narrow, consumed subset of each upstream shape.
- `src/utils` — pure helpers (sorting, filtering, rules tokenizing).
- `scripts/` — local automation; see `scripts/README.md`.
- `src/data/` — checked-in data plus the Python refresher for it.

## External data

All upstream access goes through `src/api/`:

- `http.ts` — one GET path with a bounded timeout, a bounded response size, jittered retries, and logging that records an endpoint label and request ID rather than user search text.
- `result.ts` — the `success | empty | unavailable | invalid` model every client returns.
- `parse.ts` — narrow schema helpers; failures become `invalid` with a safe reason.
- `cerebroQuery.ts` — the only place a Cerebro `input=` expression is built or escaped.
- `routeParams.ts` — route-parameter contracts for the dynamic card routes.
- `cerebro.ts` / `merlin.ts` — the typed clients.
- `revalidate.ts` — ISR policy and `UpstreamUnavailableError`.

### API endpoints

Cerebro — `https://cerebro-beta-bot.herokuapp.com`
- `/sets?official=true`, `/sets?origin=unofficial`
- `/packs?official=true`
- `/query?input=...`

Merlin — `https://mc4db.merlindumesnil.net/api/public`
- `/packs/`
- `/cards/<pack_code>`

## AI Notes
- **Routing:** Pages router, not the App router.
- **Data fetching:** page-level `getStaticProps` calls the clients in `src/api/`; there is no SWR and no client-side data library.
- **Never** hand-build a Cerebro query string. Use `cerebroQuery.ts`.
- **Never** return props on an upstream failure in `getStaticProps`. Throw `UpstreamUnavailableError`, so Next keeps serving the last good page instead of caching an outage.
- **Creator Drive Libraries are disabled.** Restoration requirements are documented in `src/pages/creators/[id].tsx`.
- **Styling:** Tailwind classes plus CSS Modules. Card sizing is CSS-only — no viewport measurement in React.

## Current status
- Active development/maintenance.
