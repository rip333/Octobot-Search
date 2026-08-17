# Octobot Search TODO

## Confirmed product and deployment decisions

- Production is deployed exclusively on Vercel; GitHub Pages is not a target.
- Creator Drive Libraries are disabled and are not part of the active product.
- Search is intentionally limited to official Cerebro cards.
- Expected traffic is low. Prefer lean payloads and measured optimization; defer virtualization until result sizes or field data justify it.
- Test strategy: Vitest with jsdom for component and page behavior. No headless-browser suite; the behaviors the plan named are asserted against the real React components instead.
- Every bug caught gets a unit test that reproduces it, verified to fail without the fix. Guard the class of bug, not just the one input that surfaced it.

1. [x] Upgrade and secure the dependency/tooling baseline.
   - [x] Upgrade Next.js and `eslint-config-next` to 16.3.1 or newer patched releases.
   - [x] Upgrade Axios to 1.19.0 or newer to remove the reported SSRF, request-tampering, and denial-of-service advisories.
   - [x] Upgrade React/React DOM to 19.2.8 or newer and PostCSS to 8.5.26 or newer.
   - [x] Remove the unused `googleapis` runtime dependency while Creator Drive Libraries are disabled; choose the narrowest maintained Drive client when the feature is redesigned.
   - [x] Refresh transitive dependencies and require `npm audit --omit=dev` to report zero production vulnerabilities.
   - [x] Replace the removed `next lint` command and legacy `.eslintrc` file with ESLint 9 flat configuration.
   - [x] Verify the slice with type-checking, linting, a production build, and a production dependency audit.

2. [x] Disable Creator Drive Libraries in the UI, creator route, API route, CI credentials, and runtime dependencies.
   - Future note: if the product decision changes, treat restoration as a new security-reviewed feature using the requirements documented in `src/pages/creators/[id].tsx`.

3. [x] Fix missing-card handling so nonexistent cards do not render and cache a permanent loading state.
   - [x] Return `notFound` from `src/pages/card/[id].tsx` when Cerebro returns no matching card.
   - [x] Use an appropriate revalidation policy for 404 responses so newly added cards can eventually become available (`NOT_FOUND_REVALIDATE_SECONDS`, 15 minutes).
   - [x] Add tests for valid, missing, malformed, and upstream-error card IDs (`src/__tests__/pages/card.getStaticProps.test.ts`).

4. [x] Prevent transient upstream failures from being cached as successful empty pages.
   - [x] Replace the Merlin API's `[]`/`null` error fallbacks with typed success and failure results, or allow errors to propagate to the page layer.
   - [x] Distinguish a genuinely empty card set from an unavailable Cerebro or Merlin service (`success | empty | unavailable | invalid` in `src/api/result.ts`).
   - [x] Use short retry/revalidation behavior for failures while retaining the last known good content where possible. `getStaticProps` throws `UpstreamUnavailableError` so Next keeps serving the last good page; partial homepage outages get a 2-minute revalidate.
   - [x] Add tests for timeouts, retryable responses, malformed payloads, and partial upstream outages (`src/api/http.test.ts`, `src/api/contracts.test.ts`, `src/__tests__/pages/index.getStaticProps.test.ts`).

5. [x] Make `CardDisplay` safe for cards with missing or changing printing data.
   - [x] Derive `usablePrintings` from unique-art printings when present, otherwise fall back to all printings; allow the selected printing to be absent.
   - [x] Pass `selectedPrinting?.ArtificialId ?? card.Id` to `CardImage` and render metadata conditionally so an empty printing list cannot throw.
   - [x] Reset or clamp the active printing index when the displayed card or usable printing list changes.
   - [x] Replace the split/length heuristic with an explicit tokenization loop that styles only single-character `{icon}` tokens and preserves all surrounding text and malformed braces.
   - [x] Add component tests for zero, one, multiple, changing, and malformed printings plus leading/trailing single-character text and mixed icon/plain-text rules.
   - [x] Acceptance: every valid `Card` shape renders without throwing and changing cards never leaves an out-of-range active printing.

6. [x] Constrain dynamic card routes and prevent unbounded ISR cache growth or upstream-query injection.
   - [x] Validate `filter` against an explicit supported enum before constructing a Cerebro query (`BROWSE_FILTERS = si | pi | usi | ms`).
   - [x] Validate `type` and card IDs according to their source-specific formats and reject malformed values (Cerebro UUIDs, Merlin slugs, numeric card IDs).
   - [x] Escape all Cerebro query-language values through one typed query builder instead of interpolating route parameters (`src/api/cerebroQuery.ts`).
   - [x] Return `notFound` for unsupported route combinations and establish limits for dynamically generated cache entries. Invalid parameters short-circuit before any upstream call, so only well-formed IDs can create a cache entry.
   - [x] Replace the ineffective pre-rendered `/cards/si/core` path with valid popular paths or use an empty path list. Now an empty list: collection IDs change every release, so a hardcoded path only goes stale.

7. [x] Make client-side search race-safe, URL-safe, and explicit about supported sources.
   - [x] Replace independent booleans with an explicit `idle | loading | success | empty | error` search state so SSR and hydration render an idle prompt rather than a false "No results" state.
   - [x] Wait for `router.isReady`; when the query changes, clear stale results and create an `AbortController` whose cleanup cancels both exact and fallback requests.
   - [x] Guard state updates with the active request/query so a late response cannot overwrite a newer search even if cancellation races with completion.
   - [x] Enforce the confirmed official-only scope: remove `origin` from `handleSearch`, search URLs, and query-builder options; always add the official Cerebro predicate internally.
   - [x] Remove the unused `incomplete` parameter and ensure search navigation uses a structured router query rather than hand-built URL strings.
   - [x] Refactor `createSearchQuery` into a typed Cerebro expression builder that operates on raw values, omits empty trait clauses, then serializes once with `URLSearchParams`.
   - [x] Preserve exact-then-partial behavior while distinguishing aborts, upstream errors, and genuine empty results; expose a retry action for errors.
   - [x] Add query-builder tests for spaces, quotes, ampersands, Unicode, numeric-only, punctuation-only, and multiple quoted phrases.
   - [x] Add tests proving no initial empty-state flash and no stale-result overwrite during rapid consecutive searches (`src/__tests__/pages/search.test.tsx`, jsdom against the real page component).

8. [x] Correct collection sorting and Merlin normalization without mutating React props.
   - [x] Extract pure `compareCardSets` and `compareCardPacks` helpers and sort copies with `[...items].sort(...)` or `toSorted()`; never call `.sort()` on props.
   - [x] Make the pack comparator deterministic when both numbers are zero or invalid, using name/ID as a stable tie-breaker.
   - [x] Define one shared set-type order with `Hero Set` first, an explicit position for `Leader Set`, and unknown types after known types in alphabetical order.
   - [x] Normalize Merlin `fm_story` packs as campaign sets and create an exhaustive mapping for every observed live `pack_type`, with a named fallback for unknown values. All nine live types are mapped, including the previously missing `core` and `encounter`.
   - [x] Review Merlin field mappings for double-sided images, nullable stats, set numbers, status, and absolute image URLs. Found and fixed: absent (not just null) stat keys made every `/cards/ms/*` page throw; image origin moved to the canonical `mc4db.merlindumesnil.net`; `null as any` replaced with real optionals; missing positions no longer render as `0`; `BackImageUrl` added for double-sided cards.
   - [x] Add unit tests that freeze input arrays, verify they remain unchanged, exercise zero/invalid pack numbers, and cover known and unknown Merlin pack types.

9. [x] Add runtime contracts and a centralized external-API layer.
   - [x] Inventory the exact Cerebro/Merlin fields consumed by each route and define narrow raw-response schemas rather than validating unused upstream fields. The models in `src/models/` are now exactly the consumed subset.
   - [x] Choose Zod for reusable declarative schemas or lightweight type guards if bundle/dependency cost is preferable; keep validation in the server/API layer where possible. Chose hand-written guards: no new runtime dependency, and the shapes are small.
   - [x] Parse every external response before rendering or caching it and convert validation failures into a typed upstream-data error with safe diagnostics (`UpstreamDataError`, surfaced as `invalid`).
   - [x] Replace `any` and `null as any` with accurate nullable types and a discriminated `success | empty | unavailable | invalid` result model.
   - [x] Centralize base URLs, typed request functions, Cerebro query construction, response mapping, logging, timeout behavior, and retries with jitter (`src/api/http.ts`).
   - [x] Add response-size limits and log endpoint/request IDs rather than full user search URLs (5 MB cap; logs carry an endpoint label and a request ID only).
   - [x] Remove scattered and unused Axios imports after consumers use the shared clients.
   - [x] Add contract fixtures for valid, missing-field, null-heavy, malformed, oversized, and forward-compatible extra-field responses (`src/api/contracts.test.ts`).

10. [x] Reduce homepage HTML and serialized page data below Next.js's 128 kB warning threshold.
    - [x] Map upstream sets and packs to lean view models containing only fields used by the homepage.
    - [x] Load unofficial Cerebro and Merlin data only when the unofficial view is requested or selected (`/api/browse/unofficial`, fetched by `Browse` on demand).
    - [x] Measure generated HTML, page-data JSON, hydration cost, and client bundle size after each change. **Serialized page data: 176 kB → 40 kB (-77%).** Generated HTML: 105 kB. Both under the 128 kB threshold.
    - [x] Preserve useful content during partial upstream outages instead of failing the entire homepage `Promise.all`.

11. [x] Improve card-image and large-result rendering performance.
    - [x] Replace the per-card window resize listener and React dimension state with responsive CSS, media queries, and `aspect-ratio`.
    - [x] Reserve intrinsic image dimensions to reduce layout shift and prevent fixed-width overflow on small screens.
    - [x] Add image loading/error fallbacks and verify scheme-card orientation across viewport changes. Orientation now derives from card data alone, so it cannot drift with the viewport.
    - [x] Use stable card/printing keys rather than array indexes.
    - [x] Measure real result sizes first; add pagination, incremental rendering, or virtualization only if low-traffic production usage demonstrates a need. **Measured:** largest set ~15 cards; largest pack (Core Set) 209 cards / ~220 kB. With lazy-loaded images that is a plain list's job — no virtualization added. Rationale recorded in `src/components/results/Results.tsx`.
    - [x] Resolve the remaining `no-img-element` lint warnings with `next/image` or documented custom-loader exceptions. All `<img>` replaced with `next/image`; `remotePatterns` added for both card hosts. Lint is clean.

12. [x] Simplify filter/result state and document filter semantics.
    - [x] Derive filtered and sorted results with memoized data rather than synchronizing duplicate state through effects (`filterAndSortCards` + `useMemo`; `FilterOptions` is now controlled).
    - [x] Reset filters explicitly when the base search changes without relying on component-key side effects. The `key={cerebroQuery}` hack is gone.
    - [x] Decide whether selecting multiple traits means "any trait" or "all traits" and make the UI communicate that behavior. **Decision: any within a group, all across groups.** Stated in the filter panel and in `src/utils/cardFilters.ts`.
    - [x] Verify numeric sorting for missing values and remove or redefine Resource sorting if resources are nonnumeric symbols. Missing stats now sort last in either direction; `"X {d}"` counts as missing. Resources are icons (`{p} {m} {e} {w}`), so that option is redefined as "Resource icon" and groups in game order.

13. [x] Align deployment and CI with the application's server requirements.
    - [x] Confirm Vercel as the exclusive production deployment target; GitHub Pages is not supported.
    - [x] Rename the current "GitHub Pages deploy" workflow to CI and let the Vercel integration own deployment.
    - [x] Run type-checking, linting, tests, build, and `npm audit --omit=dev` in CI.
    - [x] Add npm caching and least-privilege workflow permissions; consider pinning actions to immutable revisions. Actions are pinned to commit SHAs with the release recorded in a trailing comment.
    - [x] Self-host Manrope or use a checked-in local font so builds do not depend on Google Fonts availability (`src/fonts/Manrope-Variable.woff2` via `next/font/local`).

14. [x] Improve page metadata, semantics, and accessibility.
    - [x] Add shared title/description defaults and route-specific metadata for home, search, card, browse, and profile pages (`PageMeta`).
    - [x] Add a custom document with the correct HTML language and other global document metadata (`src/pages/_document.tsx`, `lang="en"`).
    - [x] Use semantic `header`, `main`, navigation, list, and list-item elements instead of button roles on links or bare children inside `ul`.
    - [x] Add visible focus styles and accessible names to icon/close controls.
    - [x] Make clickable Drive cards keyboard-operable and implement modal semantics, focus trapping/restoration, Escape handling, and scroll locking before the feature is restored. The dormant component is removed; the requirement stays recorded in `src/pages/creators/[id].tsx`.
    - [x] Test color contrast and mobile layouts, including card images and footer wrapping. Found and fixed one AA failure (`#e53e3e` behind white text, 4.13:1 → `#c53030`, 5.47:1). Card frames are width-capped per breakpoint so they cannot overflow. Footer wrapping was missed on the first pass and fixed in review item 25.

15. [x] Remove dead code and unused dependencies after confirming no planned consumers.
    - [x] Build an import/reference inventory for `src/cerebro-api.ts`, `HeroSelect`, each Merlin API function, adapter/model, SWR, and feature-specific CSS before deleting anything.
    - [x] Delete confirmed-unreferenced modules and their CSS/data imports in small commits; keep only code tied to an explicit near-term TODO owner.
    - [x] Remove SWR from `package.json` and the lockfile if the centralized fetching architecture does not adopt it.
    - [x] Since Drive is disabled, either remove its dormant component/types/styles or move them outside the active build; restore them only as part of the security-reviewed feature. Removed `DriveExplorer.tsx`, `DriveExplorer.module.css`, `api/drive/files.ts`, and the unreferenced `data/creators.*`.
    - [x] Remove obsolete comments, imports, props, and loading flags that are always false. Also dropped the now-unused `loadable-image` dependency.
    - [x] After each cleanup slice, run `rg` reference checks, type-check, lint, build, and audit to catch dynamic-route or dependency regressions.

16. [x] Modernize configuration and project documentation.
    - [x] Update `CONTEXT.md` from Next.js 14 to the actual framework version and remove claims that unused SWR code is active.
    - [x] Document installation, environment variables, supported deployment, local development, validation commands, and failure behavior in `README.md`.
    - [x] Review the ES5 TypeScript target and `allowJs` setting against the supported browser/runtime matrix. Target raised to ES2022 to match Next 16's browser floor. `allowJs` stays: Next re-adds it on every build and treats it as required.
    - [x] Keep Browserslist data current through a controlled dependency-update process (`npx update-browserslist-db@latest`; caniuse-lite refreshed, no target changes).

17. [x] Harden and document the data/image automation scripts.
    - [x] Make `extract-hero-ids.py` write to `src/data/heroes.json` relative to the script, add a timeout and HTTP/schema error handling, and document its Python dependency. It now also refuses to overwrite the file with an empty result.
    - [x] Prevent Photoshop scripts from recursively ingesting existing `print-files` outputs and make front/back traversal and natural sorting consistent. Both sheets now share `champions-grid-common.jsx` and differ only in column order and rotation.
    - [x] Replace hardcoded PSD paths with a prompt or configuration and close temporary documents safely after failures (`champions-grid-config.json`, or a file picker; `try`/`finally` around every document).
    - [x] Validate ImageMagick availability and exit codes in PowerShell/batch scripts, resolve paths canonically, prevent output collisions, and make noninteractive use possible (`-NoPause` / `BLEED_NOPAUSE=1`).

18. [x] Fix repository ignore rules and generated-artifact handling.
    - [x] Replace the broad `/scripts` ignore with targeted ignores for generated card JSON, Markdown, print files, and other local outputs.
    - [x] Ensure new maintained scripts cannot be silently omitted from Git. `scripts/json_to_markdown.py` was one such casualty and is now visible to Git.
    - [x] Document which generated data and image artifacts are source-controlled and how they are refreshed (`scripts/README.md`).

19. [x] Establish automated test coverage for critical behavior.
    - [x] Add unit tests for Cerebro query construction, adapters, sorting, filtering, and icon parsing.
    - [x] Add integration tests for static props, missing resources, retry behavior, and malformed upstream responses.
    - [x] Add tests for search navigation, exact-to-partial fallback, card details, responsive images, and disabled creator routes. Covered with jsdom against the real components rather than a headless browser, per the decision recorded at the top of this file.
    - [x] Add accessibility checks for keyboard navigation, semantic structure, focus behavior, and common contrast regressions (`src/components/accessibility.test.tsx`, `src/utils/contrast.test.ts`).

---

## Review round 1 — all six findings fixed

The four TypeScript/runtime fixes have red-capable regression coverage (172
tests total). The batch and footer fixes were source-reviewed but do not yet
have automated regressions; that remains a verification gap under the global
"every bug caught gets a unit test" rule. Live behavior was re-checked against
a production build.

20. [x] **High — five live Merlin sets always 404'd.** `MERLIN_PACK_CODE` rejected `&`,
    but co-authored packs join creators with it. Five released packs were
    affected: `ms_marvel_by_cptscorp_&_rycoran`, `rom_by_alias_&_merlin`,
    `ghost_rider_by_swept_&_jiub`, `stature_by_captain_corp_&_hax`,
    `infinity_stones_by_merlin_&_co`. All were linked from the unofficial browse
    view and rejected before ever reaching Merlin.
    - Widened the Merlin alphabet to `[a-z0-9_&-]`. Audited all 145 live codes:
      `&` is the only character outside the old set, and the longest code is 45
      characters, so the 64 cap stands.
    - `&` stays rejected for `si`/`pi`/`usi`, where it *is* a Cerebro operator. A
      Merlin code only ever becomes a percent-encoded path segment.
    - Fixtures added for all five codes plus the length boundary, and a test
      asserting Cerebro filters still reject `&`.
    - Verified live on 2026-08-16: all five return 200. A later independent
      Merlin read returned 19, 20, 18, 18, and 6 cards respectively; this
      differs from the implementation report's 19, 20, 20, 2, and 6 counts and
      is recorded as external-data drift or a reporting mismatch, not a route
      regression.

21. [x] **Medium — a failed card image never recovered when switching printings.**
    `failed` was a boolean held for the component's lifetime, and `CardDisplay`
    swaps `artificialId` without remounting, so one bad printing poisoned every
    later one.
    - Now stores *which* URL failed, so a new URL retries. No effect needed.
    - New `CardImage.test.tsx` covers retry on printing change, retry on the
      double-sided back face, and that the fallback persists while the failed URL
      is still the one displayed.

22. [x] **Medium — `Player` and `Encounter` were not mutually exclusive both ways.**
    Adding `Player` to an existing `Encounter` selection produced
    `['Encounter', 'Player']`, which matches every card while displaying two
    active chips. Only the reverse order was tested.
    - Selecting `Player` now replaces the whole selection. `Player` is a negation
      ("not Encounter"), so it is only ever meaningful alone.
    - Added an invariant test over every reachable toggle sequence: whenever
      `Player` is selected it must be the only selection. Note the invariant is
      specifically about `Player` — a union of real classifications matching
      everything is correct behavior, not a bug.

23. [x] **Medium — the 5 MB response limit did not apply to browser searches.**
    `search.tsx` calls the shared client from the browser, where Axios defaults
    to the `xhr` adapter, and `xhr` ignores `maxContentLength`.
    - Set an explicit adapter preference of `['http', 'fetch', 'xhr']`. Axios
      picks the first supported: `http` on the server, `fetch` in the browser.
      Confirmed in the installed Axios 1.19.0 that `lib/adapters/fetch.js`
      enforces the limit both from a declared `Content-Length` and by counting
      streamed bytes, and that `lib/adapters/xhr.js` has no such handling.
    - `xhr` remains last purely as a fallback for runtimes without `fetch`; that
      narrow gap is documented at the call site.

24. [x] **Medium — the batch bleed script could overwrite its own output.**
    It checked only the unsuffixed name, then wrote the suffixed name without
    checking it, and created a needless duplicate on the first rerun.
    - Now tracks names claimed during the current run, which distinguishes "a
      sibling just took this name" (use the extension suffix) from "a previous
      run produced this" (skip). Both candidate names are existence-checked, so
      no path overwrites existing output. Reports skipped alongside processed and
      failed counts.
    - Verification boundary: no automated test currently exercises the batch
      behavior under `cmd.exe`.

25. [x] **Low — the footer could overflow narrow viewports.** Three items in a
    non-wrapping flex row, including a long hostname with fixed horizontal
    margins.
    - Added `flex-wrap: wrap` with gap-based spacing, `overflow-wrap: anywhere`
      for the hostname, and a single-column layout under 480px.
    - The earlier "footer wrapping verified" claim was wrong; contrast was
      checked, wrapping was not.
    - Verification boundary: the CSS was source-reviewed, but no layout-capable
      browser regression currently guards the narrow-viewport behavior.

---

## Follow-ups worth considering

- Merlin card text arrives as HTML (`<b>`, `<i>`) and currently renders as literal markup. Rendering it safely needs a small sanitising formatter.
- Three sets linked from `/rip` (Scarlet Spider, Superior Spider-Man, Venom) no longer exist upstream and were removed. Re-add them if they are republished.
- `npm run build` renders the homepage against live Cerebro, so a total Cerebro outage fails CI. That is intentional, but a scheduled retry would reduce noise.
