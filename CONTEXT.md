# Octobot-Search Context

## Project Overview

Octobot-Search is a Next.js + TypeScript web application that provides a searchable browser for Marvel
Champions card data. It consumes data from external APIs (Cerebro and Merlin) and presents it in a
card-browsing UI. The repository also includes local automation scripts for data extraction (Python)
and print-sheet layout (Photoshop/ExtendScript, ImageMagick).

## Key Features
- **Card Browser:** browse official sets and packs, plus community sets loaded on demand.
- **Search:** official Cerebro cards only, with exact-then-partial matching.
- **Static Generation:** `getStaticProps`/`getStaticPaths` with ISR.
- **Styling:** CSS Modules, `src/globals.css`, and a small amount of inline `style`. Tailwind is
  removed; see "Styling" below.
- **Analytics:** Vercel Web Analytics and Speed Insights, page-level only. No custom events.

## Tech Stack
- **Framework:** Next.js 16 (Pages router)
- **Language:** TypeScript 5 (target ES2022), Python (scripts), ExtendScript (Photoshop)
- **UI:** React 19
- **Styling:** CSS Modules plus `globals.css`, compiled through PostCSS (autoprefixer only). Tailwind
  is not installed; see "Styling".
- **Data fetching:** Axios, behind the shared client in `src/api/`
- **Testing:** Vitest, Testing Library (jsdom opt-in per file for component tests)
- **Deployment:** Vercel only

## Key Directories & Files
- `src/api/` — the only place external HTTP happens. See "External data" below.
- `src/pages` — Next routes and page components.
- `src/pages/api/browse/unofficial.ts` — community sets on demand.
- `src/pages/api/card-images/v1/[origin]/[...filename].ts` — cacheable Cerebro image bytes.
- `src/components` — reusable UI components.
- `src/models` — the narrow, consumed subset of each upstream shape.
- `src/utils` — pure helpers (collections, filtering, rules tokenizing, card vocabulary, contrast).
- `src/searchUtils.ts` — tokenizes search text into a Cerebro expression via `src/api/cerebroQuery.ts`.
- `src/merlin-adapter.ts` — maps `MerlinCard`/`MerlinPack` onto the shared `Card`/`CardSet` shapes.
- `scripts/` — local automation; see `scripts/README.md`.
- `src/data/` — `heroes.json` plus the Python refresher for it. Not imported by the application; it is
  input for local tooling only.

## Routes

| Route | Data strategy |
| --- | --- |
| `/` (`index.tsx`) | `getStaticProps` + ISR; official sets and packs |
| `/card/[id]` | `getStaticProps`, `getStaticPaths` with `paths: []` and `fallback: 'blocking'` |
| `/cards/[filter]/[type]` | same on-demand pattern; Cerebro or Merlin depending on `filter` |
| `/search` | client-side only — no `getStaticProps`; queries Cerebro from the browser |
| `/rip` | fully static, no data fetching |
| `/creators/[id]` | `getServerSideProps` returning `notFound` — intentionally disabled |
| `/api/browse/unofficial` | API route; Cerebro unofficial sets plus Merlin packs |
| `/api/card-images/v1/[origin]/[...filename]` | GET/HEAD; bounded R2 reads with browser/CDN caching |
| `/404`, `/500` | static error pages |

Only the homepage and the static pages are generated at build time. Every card and collection page is
generated on first request.

## External data

All upstream access goes through `src/api/`:

- `http.ts` — one GET path with a 5s total server budget across up to 3 attempts and jittered
  backoff, a 12s per-attempt browser timeout, and a 5 MiB response limit. A deadline aborts active
  transport or backoff and becomes `unavailable`; caller cancellation still throws. Server completion
  logs contain only endpoint labels, request IDs, outcomes, elapsed time, summed attempt time, and
  actual attempt counts. No response content or user search text is logged.
- `staticPropsTiming.ts` — logs total `getStaticProps` duration, outcome, and an allowlisted
  revalidation reason for the homepage and card route. It rethrows failures unchanged so ISR retains
  last-good content. This timing excludes module initialization before entry and rendering after return.
- `result.ts` — the `success | empty | unavailable | invalid` model every client returns.
- `parse.ts` — narrow schema helpers; failures become `invalid` with a safe reason.
- `cerebroQuery.ts` — the only place a Cerebro `input=` expression is built or escaped.
- `routeParams.ts` — route-parameter contracts for the dynamic card routes.
- `cerebro.ts` / `merlin.ts` — the typed clients.
- `revalidate.ts` — ISR policy and `UpstreamUnavailableError`.
- `cardImageSource.ts` / `cardImageBinary.ts` — canonical same-origin Cerebro art keys and bounded
  raster reads, without JSON-client retries. See `src/api/IMAGE_DELIVERY.md` for the full contract.
- `cardImageStructure.ts` — bounded JPEG/PNG/GIF/WebP container checks before cacheable success;
  rejects incomplete files without decompressing or transforming pixels.

`src/api/` has callers in page `getStaticProps` (server, at build and on ISR regeneration),
internal API routes (server), and `src/pages/search.tsx` (browser). Search runs its
Cerebro requests directly from the visitor's browser, so search traffic reaches Cerebro without
appearing in Vercel server logs.

`src/components/browse/Browse.tsx` uses raw `fetch` for `/api/browse/unofficial`. That is an internal
same-origin call, not an upstream one, so it does not belong under `src/api/`.

### API endpoints

Cerebro — `https://cerebro-beta-bot.herokuapp.com`
- `/sets?official=true`, `/sets?origin=unofficial`
- `/packs?official=true`
- `/query?input=...`

Merlin — `https://mc4db.merlindumesnil.net/api/public`
- `/packs/`
- `/cards/<pack_code>`

Cerebro art is rewritten to the same-origin image endpoint, including old Azure URLs in API metadata.
The fixed source is Unicorn's R2 root. Merlin stays direct on `mc4db.merlindumesnil.net` and
`db.merlindumesnil.net`; these remain in `next.config.js`. `images.unoptimized: true` avoids image
transformation usage. These are local implementation facts; production migration is not yet verified.

## Caching policy

`src/api/revalidate.ts` holds every ISR interval:

| Constant | Seconds | Used by |
| --- | --- | --- |
| `CONTENT_REVALIDATE_SECONDS` | 604800 (7 days) | card and collection pages |
| `LISTING_REVALIDATE_SECONDS` | 3600 (1 hour) | homepage, healthy |
| `NOT_FOUND_REVALIDATE_SECONDS` | 900 (15 minutes) | `notFound` results |
| `PARTIAL_FAILURE_REVALIDATE_SECONDS` | 120 (2 minutes) | homepage with one failed section |

`/api/browse/unofficial` sets its own `Cache-Control`: `s-maxage=3600, stale-while-revalidate=86400`
when healthy, `s-maxage=120, stale-while-revalidate=600` when partial, and `no-store` on the 503 it
returns when both community sources fail.

Cerebro image 200 responses use seven-day browser freshness and thirty-day shared-CDN freshness;
genuine 404s use sixty seconds at the CDN. Other failures are no-store. Unlike ISR, this is an ordinary
HTTP response cache, regional and evictable. See `src/api/IMAGE_DELIVERY.md` for validation, observability,
invalidation and the separate hosted cache-hit verification gate.

## Styling

CSS Modules plus `src/globals.css` are the only styling system. Tailwind is gone: no `tailwindcss`
dependency, no `tailwind.config.ts`, and `postcss.config.js` lists only `autoprefixer`. The search
page's idle, partial-match, and error states are styled by the page-local
`src/pages/search.module.css`. `src/pages/_app.tsx` applies the local Manrope font through
`manrope.variable` and `manrope.className` from `next/font/local`. `src/__tests__/noTailwind.test.ts`
fails if Tailwind config, the plugin, the dependency, or utility class strings return.

Card sizing is CSS-only — no viewport measurement in React.

## Analytics

`src/pages/_app.tsx` mounts `<Analytics />` from `@vercel/analytics` and `<SpeedInsights />` from
`@vercel/speed-insights`. Nothing calls `track()`, so there are no custom events and no search
outcome, result-count, or upstream-failure signal reaches analytics. Analytics installed in code is
not the same as metrics retrievable in production; see `OPERATIONS.md`.

## AI Notes
- **Routing:** Pages router, not the App router.
- **Data fetching:** page-level `getStaticProps` calls the clients in `src/api/`; `/search` calls them
  from a `useEffect` in the browser. There is no SWR and no client-side data library.
- **Never** hand-build a Cerebro query string. Use `cerebroQuery.ts`.
- **Never** return props on an upstream failure in `getStaticProps`. Throw `UpstreamUnavailableError`,
  so Next keeps serving the last good page instead of caching an outage.
- **Creator Drive Libraries are disabled.** Restoration requirements are documented in
  `src/pages/creators/[id].tsx`.
- **No environment variables.** Nothing in `src/` or `next.config.js` reads `process.env`, and both
  upstream base URLs are constants, so a fresh clone runs with no configuration.
- **Styling:** CSS Modules plus `globals.css`. Do not add new Tailwind utility classes.

## Current status
- Active development/maintenance. Production access facts live in `OPERATIONS.md`.
