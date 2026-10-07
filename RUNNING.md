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

## Deployment boundary

Vercel's Git integration owns production deployment. Local verification and GitHub Actions do not
publish. Do not invoke a deployment or change Vercel configuration unless the owner explicitly asks.

