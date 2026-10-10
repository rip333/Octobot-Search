# Running and Verification

This is the authoritative runbook for Octobot Search. Run commands from the repository root.

## Prerequisites

- Node.js 20 or newer; CI uses Node.js 22.x.
- npm.
- Network access for dependency installation, `npm audit`, and the production build's live Cerebro read.

## Install and run locally

```powershell
npm install
npm run dev
```

The development server normally listens at `http://localhost:3000`.

## Focused tests

Run a changed test file first:

```powershell
npx vitest run src/path/to/file.test.ts
```

Use a test-name filter for a tight red/green loop:

```powershell
npx vitest run src/path/to/file.test.ts -t "behavior name"
```

## Completion checks

Run each command and record its actual result:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

For dependency or security work, also run:

```powershell
npm audit --omit=dev --audit-level=info
```

`npm run build` generates the homepage against live Cerebro. A total upstream outage or blocked network
can fail the build even when local compilation and tests are sound. Record that as an unverified build
boundary; do not convert it into a pass.

## Local server timeout policy

`src/api/http.ts` defaults server upstream work to 5,000 ms in total, including all
attempts and retry waits. Parallel homepage sources each use this budget concurrently.
Browser search retains its 12,000 ms per-attempt timeout. This leaves nominal headroom
under the production deployment's observed 10-second execution limit; it does not
guarantee that startup, synchronous parsing, or rendering fit the remaining time.
Do not lengthen the budget without checking the actual deployed function limit.

Server logs report `duration_ms`, `upstream_ms` (sum of attempt durations, excluding
retry backoff), and actual `attempts`. Homepage/card `static-props` logs report the
duration within `getStaticProps`; they exclude module startup and subsequent HTML
rendering. Compare these with Vercel's execution duration to investigate remaining
overhead. Log labels are fixed routes/endpoints, never concrete IDs or search URLs.
Deadline failures retain existing typed outage and last-good ISR behavior.

### Verification — 2026-10-06

The local timeout-budget/timing slice passed these checks; production is unchanged:

- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0.
- `npm test -- --hookTimeout=30000 --maxWorkers=2`: exit 0, 23 files / 221 tests.
  The longer hook allowance accommodates cold page-module imports, not HTTP deadlines.
  The initial focused default run hit two 10s import-hook timeouts; the focused rerun
  with a 30s hook allowance passed all 31 tests before two additional regressions
  were added and covered by the full suite.
- `npm run build`: exit 0. The first build, concurrent with tests, timed out one
  Cerebro source and generated the supported partial homepage. The subsequent build
  run alone had both official sources healthy (160 ms packs, 237 ms sets), a 237 ms
  `getStaticProps` duration, and the healthy 1h homepage revalidation interval.
- `git diff --check`: exit 0. Existing unrelated dirty documentation was preserved.

New regressions first demonstrated missing server deadlines, retry-budget sharing,
interruptible cancellation, and safe completion timing. Coverage also exercises
deadline expiry during backoff, pre-cancelled callers, unchanged browser timeout,
safe page timing with unchanged error propagation, and an actual local HTTP
connection that never sends response headers. The stalled-connection check uses
a short explicit budget; the default 5s server budget is tested with fake time.

## Cerebro R2 image slice — verified locally 2026-10-10

- `npm run typecheck`: exit 0.
- `npm run lint`: exit 0.
- `npm test -- --hookTimeout=30000 --maxWorkers=2`: exit 0, 27 files / 260 tests.
- `npm run build`: exit 0 with live official packs/sets healthy; final homepage `getStaticProps`
  completed in 224 ms with one-hour revalidation. The image API route appears in the build output.
- Initial `npm audit --omit=dev --audit-level=info`, before pulling the dependency upgrades: exit 1,
  four vulnerability groups: Axios,
  Next.js, sharp and source-map-js (three high, one critical). Dependencies/lockfile are unchanged;
  that initial audit was not clean. The later pulled upgrade resolves these findings, as verified below.

Actual local production-server checks returned the official JPEG (264,964 bytes), HEAD 200 with
matching content length and no body, and creator-scoped unofficial JPEG (315,207 bytes). Both use
the intended browser/CDN headers. An unexpected query returned 400/no-store. Across the direct
source checks and local route checks, exactly five live image reads were made, involving two distinct
images; there was no catalog crawl or cache warming. Local servers were stopped after verification.

The real unofficial sample exposed a creator/card ID that the initial single-filename resolver
rejected. Its focused regression failed before the catch-all/path-contract fix, then passed in the
full suite. HTTP fixture regressions use the real Axios adapter for redirects, chunked oversized
responses and a stalled body. Component fixtures check stable local image source attributes and no
direct-origin fallback; they do not exercise a real browser's cache.

Initial lint discovered generated code in nested `.claude` worktrees; lint, TypeScript and Vitest now
explicitly exclude that directory while retaining normal defaults. A typecheck immediately after
the route rename encountered stale `.next/types` referencing the old filename; rebuilding regenerated
the route types and the standalone typecheck passed. An initial component assertion was adjusted for
Next's absolute localhost URL rendering, while still asserting same-origin delivery and no optimizer.

Source, guardrails, cache headers and release/invalidation instructions live in
`src/api/IMAGE_DELIVERY.md`. No deployment or provider change occurred. Hosted CDN hits, real-browser
cache reuse and account-wide quota checks remain separate authorized release gates.

## Review fix — 2026-10-10, after pulling main `dfb540c`

Incomplete raster files now return 503/no-store before cacheable success. The new structure checker
walks bounded container bytes without image decoding/transformation; it does not prove arbitrary
compressed pixel data is decodable. All success fixtures are locally generated complete images,
including progressive JPEG, animated GIF/WebP and alpha WebP. Ten new truncation cases failed before
the fix. Prefix/block/chunk tests and real HTTP GET/HEAD tests cover the corrected behavior, and
synchronous validation is accounted for in the total deadline.

The pulled dependency upgrades were installed with `npm ci --ignore-scripts` without changing the
lockfile. Verification uses Next 16.4.0 and Axios 1.20.0. The production audit now passes with zero
vulnerabilities; the initial audit finding above is historical.

Final checks: typecheck and lint exit 0; direct full Vitest run below exits 0 (29 files / 306 tests);
`npm run build` exits 0 with live packs/sets healthy and 226 ms homepage data generation;
`npm audit --omit=dev --audit-level=info` exits 0 with zero vulnerabilities; `git diff --check` exits 0.

On Windows, the npm wrapper failed to forward the earlier hook-timeout options, leading to three
10-second import-hook timeouts during the post-pull review. The direct Vitest command correctly
applies the allowance; it does not change HTTP deadlines:

```powershell
node node_modules/vitest/vitest.mjs run --hookTimeout=30000 --maxWorkers=2
```

No live image requests, deployment, staging, commits or pushes were performed for this review fix.

## Deployment boundary

Vercel's Git integration owns production deployment. Local verification and GitHub Actions do not
publish. Do not invoke a deployment or change Vercel configuration unless the owner explicitly asks.

