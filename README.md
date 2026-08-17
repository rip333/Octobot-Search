# Octobot Search

THE OCTOBOT!!

A searchable browser for Marvel Champions cards, built with Next.js and
TypeScript on top of the Cerebro and Merlin card databases.

---

## Requirements

- Node.js 20 or newer (CI runs 22.x)
- npm

No environment variables are required. Both upstream APIs are public and their
base URLs are constants in `src/api/cerebro.ts` and `src/api/merlin.ts`, so a
fresh clone runs with no configuration.

## Install and run

```bash
npm install
npm run dev        # http://localhost:3000
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (generates the homepage against live Cerebro) |
| `npm start` | Serve a production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint 9 flat config |
| `npm test` | Vitest, single run |

Before opening a pull request, run the same four checks CI does:

```bash
npm run typecheck && npm run lint && npm test && npm run build
npm audit --omit=dev --audit-level=info
```

## Deployment

Vercel is the only supported deployment target, and the Vercel Git integration
owns it. GitHub Actions runs verification only — it never publishes. GitHub
Pages is not supported: the app needs a Node server for ISR, on-demand routes,
and the API route that loads community sets.

## Failure behavior

The rule everywhere is that a transient outage must never be cached as content.

- **Card and collection pages.** A card that Cerebro does not have returns
  `notFound` with a 15-minute revalidate, so a newly published card becomes
  reachable without a redeploy. An unreachable or unusable upstream throws
  `UpstreamUnavailableError` instead of returning props, which makes Next keep
  serving the last successfully generated page and retry on the next request.
  When no page was ever generated, visitors get `pages/500.tsx`.
- **Homepage.** Sets and packs are fetched independently. If one fails, the
  other still renders and the page carries a notice plus a 2-minute revalidate.
  Only a total failure throws.
- **Community sets.** Loaded on demand from `/api/browse/unofficial` when the
  unofficial view is opened, so the default homepage never pays for them. A
  partial source failure still returns what is available.
- **Search.** Distinguishes aborted, failed, and genuinely empty results, and
  offers a retry on failure. A late response from a superseded search is
  discarded rather than overwriting a newer one.
- **Builds.** `npm run build` renders the homepage against live Cerebro. If
  Cerebro is completely unreachable the build fails on purpose, rather than
  publishing an empty homepage.

## Architecture notes

All external HTTP goes through `src/api/`, which centralises base URLs,
timeouts, response-size limits, jittered retries, response validation, and the
`success | empty | unavailable | invalid` result model. Cerebro query strings
are built only by `src/api/cerebroQuery.ts`; route parameters are validated by
`src/api/routeParams.ts` before any upstream call. See `CONTEXT.md` for the
module-by-module map.

Search is intentionally limited to official Cerebro cards. Creator Drive
Libraries are disabled; restoration requirements are documented in
`src/pages/creators/[id].tsx`.

## Scripts

Local print and data automation lives in `scripts/` — see
[`scripts/README.md`](scripts/README.md) for ImageMagick and Photoshop usage,
and for which generated artifacts are source-controlled.

`src/data/extract-hero-ids.py` refreshes `src/data/heroes.json` from Cerebro.
It needs Python 3.9+ and `requests`:

```bash
pip install requests
python src/data/extract-hero-ids.py
```

## Contact

Maintained by Rip Britton (rip333). See the `/rip` page in the app for links.
