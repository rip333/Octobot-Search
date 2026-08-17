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

## Deployment boundary

Vercel's Git integration owns production deployment. Local verification and GitHub Actions do not
publish. Do not invoke a deployment or change Vercel configuration unless the owner explicitly asks.

