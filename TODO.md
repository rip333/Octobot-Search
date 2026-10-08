# Octobot Search TODO

## Outcome

Improve official-card search quality and close the two small regressions identified in the 2026-08-17
assessment before adopting another framework, index, database, or hosted search service.

The implementation agent must work on exactly one named slice at a time and stop at that slice's
boundary. Priority and rationale live in `obsidian/Octobot-Search/`; this file is the executable
contract.

## Established direction

- Keep the Next.js Pages Router and the existing official-Cerebro-only search boundary.
- Use the current Cerebro result set first: add a pure, deterministic relevance scorer before changing
  dependencies or the data pipeline.
- Remove residual Tailwind usage and configuration; use CSS Modules instead of upgrading Tailwind.
- Do not add Algolia, Meilisearch, Typesense, Elasticsearch, a database-backed search service, or a
  client-side index in the current phase.
- Consider a lean, validated MiniSearch index only after privacy-safe outcome data demonstrates that
  typo tolerance or autocomplete is worth its bundle and maintenance cost.
- Keep search text, full search URLs, and secrets out of logs and analytics.
- Preserve all repository invariants in `AGENTS.md`, especially validated route parameters, centralized
  external HTTP, typed upstream failures, last-good ISR behavior, accessibility, and pure transforms.

## Reconciled evidence

- [x] **P0 - Restore Classification and Type routes.** Commit `6dc4e04` added `cl` and `type` to the
  strict route allowlist, validates values through `src/utils/cardVocabulary.ts`, maps them to the
  Cerebro `classification` and `cardType` fields, and added route/page regressions. Independent focused
  verification on 2026-08-17: `npx vitest run src/api/routeParams.test.ts
  src/__tests__/pages/cards.getStaticProps.test.ts` passed 2 files / 51 tests. Do not rewrite this seam
  unless a current reproduction fails. The owner's live Cerebro counts (123 Aggression cards and 328
  allies) are dated external observations, not fixed test expectations.
- [x] **P0 - Remove inert Tailwind remnants.** `src/globals.css` has no Tailwind layers, while
  `src/pages/search.tsx` still has four utility-class sites and `src/pages/_app.tsx` has one. Tailwind
  remains in PostCSS/configuration and `devDependencies` even though those selectors are not generated.
- [ ] **P1 - Relevance is the default search ordering.** Search reverses Cerebro's result, then
  `filterAndSortCards` applies the default card-ID sort. Browse routes should retain their current
  deterministic ID default.

## Active slice - P0 residual Tailwind removal

### Outcome

Every currently intended search status, fallback, and error style is emitted by CSS Modules, the local
Manrope font remains active through `next/font`, and Tailwind is absent from source configuration and
dependencies.

### Affected seams

- `src/pages/search.tsx` and a new adjacent CSS Module
- `src/pages/_app.tsx`
- `postcss.config.js`, `tailwind.config.ts`, `package.json`, and `package-lock.json`
- focused search-page tests plus a small repository styling-contract regression
- `CONTEXT.md` and any closest owning documentation that still claims Tailwind is active

### Non-negotiable rules

- Preserve the current visual intent and semantic roles for idle, fallback, and error states; this is
  not a redesign.
- Keep `manrope.variable` and `manrope.className`; remove only the inert `font-sans` utility.
- Do not introduce global selectors for page-specific states or another styling dependency.
- Add a red-capable regression that would fail if raw Tailwind utility strings, the Tailwind PostCSS
  plugin, its config, or its dependency returned.
- Preserve the already repaired `cl` and `type` route behavior and its strict vocabulary allowlists.

### Ordered work

- [x] Read the current search-page tests, CSS Modules, PostCSS configuration, and the relevant Next.js
  16 guides under `node_modules/next/dist/docs/` before editing.
- [x] Run the two focused route suites named under Reconciled evidence. If they fail, stop and report the
  contradiction instead of folding an unplanned route repair into this styling slice.
- [x] Move the four search-page utility-class groups into a page-local CSS Module and apply named module
  classes to the idle, partial-match, and error UI.
- [x] Remove the `_app.tsx` `font-sans` class while retaining both `next/font` classes.
- [x] Remove Tailwind from PostCSS, delete `tailwind.config.ts`, uninstall `tailwindcss`, and refresh the
  lockfile. Retain PostCSS/autoprefixer only if the current Next.js configuration still uses them.
- [x] Add focused regressions for the styled search states and a repository-level guard for the
  no-Tailwind contract.
- [x] Update `CONTEXT.md` from "Tailwind CSS plus CSS Modules" to the verified post-change styling
  contract.
- [x] Run focused tests first, then `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and
  `npm audit --omit=dev --audit-level=info`; record exact results and any live-Cerebro boundary.
- [x] Replace `REPORT.md` with the completed slice report only after reviewing the diff against this
  contract and `AGENTS.md`.

### Completion criteria

- Search idle, fallback, error, and retry states retain their intended styling and accessible roles.
- No application source contains residual Tailwind utility strings; no Tailwind config, PostCSS plugin,
  package entry, or lockfile package remains.
- The Manrope local font still applies without a Google Fonts network dependency.
- Route focused tests and all canonical completion checks have exact reported results.

### Stop boundary

Do not add relevance ranking, snippets, URL-synchronized filters, Playwright, security headers, a new
loader, general dependency upgrades, native `fetch`, analytics events, or a search index in this slice.

## Queued roadmap

Promote only one item below into a new self-contained active slice after the current slice is completed
and reconciled.

### P1.1 - Default search relevance

- Add a pure scorer over the cards already returned by Cerebro; do not change query matching or add a
  dependency.
- Rank normalized exact full-name matches first, then name-prefix/name matches, subname matches, trait
  matches, and rules-text matches. Within a tier, prefer greater query-token coverage and use card ID as
  the final deterministic tie-break.
- Add a `Relevance` option that is the default only for `/search`; preserve ID as the default on browse
  routes and preserve every explicit user sort.
- Keep ranking and filtering immutable. Add table-driven regressions for exact names, prefixes,
  subnames, traits, rules text, multi-token fallback results, ties, and non-mutation.
- Verify representative cases such as `spidr man` and `energy barrier` with fixtures; do not freeze live
  result counts into tests.

### P1.2 - Bound search input

- Reject oversized input before an upstream request and show an actionable, accessible message.
- Centralize the character and token limits beside tokenization so the UI and query builder cannot
  disagree; cover quoted tokens, Unicode, whitespace-only input, and direct pathological URLs.
- Proposed policy to settle when this slice is promoted: 200 Unicode characters and 12 non-empty
  tokens. Do not silently truncate because that changes user intent.

### P1.3 - Explain why a result matched

- Reuse scorer metadata to show one short, plain-text matched excerpt from the highest-priority matching
  field, centered around the first match and bounded in length.
- Prefer a concise match label when an exact name needs no excerpt. Never render upstream rules as raw
  HTML.
- Preserve the image grid's responsive behavior, stable card identity, accessible link naming, and
  keyboard behavior; test selection, clipping, escaping, and missing fields.

### P1.4 - Put sort and filters in the URL

- Define one canonical, compact query-string schema for sort, classifications, types, and traits on
  result routes. Keep the existing `query` search-text key.
- Initialize UI state from validated URL values, update it with shallow routing, support back/forward,
  omit defaults, ignore unknown values, and keep shared URLs deterministic.
- Preserve the exclusive synthetic `Player` classification contract and any-within/all-across filter
  semantics. Add router-level regressions for round trips and malformed URLs.

### P1.5 - Add a tiny browser regression suite

- Add Playwright only for gaps jsdom cannot cover: homepage Classification/Type navigation, responsive
  wrapping/no horizontal overflow at 320 px and 375 px, keyboard focus visibility, and a small Axe scan.
- Make fixtures deterministic and avoid live Cerebro/Merlin dependence in browser assertions.
- Keep screenshot coverage to a few stable layouts and document intentional snapshot updates. Do not
  turn this into broad cross-browser duplication of Vitest behavior.

### P1.6 - Privacy-safe search outcome measurement

- Measure only outcome categories: strict versus fallback, empty, latency bucket, and result-count
  bucket. Never record search text, token content, or full URLs.
- Vercel Hobby was verified on 2026-09-11 and does not support custom events. Before implementation,
  obtain an owner decision on the proposed privacy-restricted PostHog proof in
  `obsidian/Octobot-Search/Decisions/Hosting and telemetry strategy.md`.
- If selected, first prove the integration outside production with autocapture, session replay, person
  profiles, and user identification disabled. Inspect emitted payloads and verify that no query text,
  token content, full URL, card text, IP-derived property, or stable user identifier is sent.
- Verify dashboard aggregation and read-only API/export access for daily reporting before production use.
- Use the resulting evidence to decide whether typo tolerance/autocomplete should advance.

### P1.7 - Baseline response security headers

- Add `nosniff`, a conservative Referrer Policy, a minimal Permissions Policy, and framing protection
  through `next.config.js`, following the installed Next.js 16 documentation.
- Add configuration tests and verify headers against the built local server. Do not introduce a broad
  Content Security Policy without separately inventorying every required source.

### P2 - Product expansion, pending primary-user decision

- Searchable collection lists, recently viewed cards, and local-only favorites.
- Official-quality detail pages for unofficial/Merlin cards, including safely tokenized/formatted rules
  text and stable front/back identity.
- Replace the one-use `react-spinners` dependency with an accessible CSS loader.
- Run a controlled TypeScript 5.9 and Vercel-package refresh. Do not jump to TypeScript 7 or ESLint 10
  until the installed Next.js release explicitly supports the combination.

Before ordering these items, the owner must choose the primary experience: quick tabletop/rules lookup,
deckbuilding/card-pool research, or custom-content and print creators.

### P3 - Conditional local index

- Only if measurement shows a real typo-tolerance/autocomplete need, evaluate MiniSearch against the
  validated official corpus.
- Generate a lean index containing only consumed searchable fields, validate it during generation, load
  it lazily, and prefer a worker so parsing/index work does not block the main thread.
- Do not ship the full Cerebro response on initial load. Record bundle, index, latency, and relevance
  measurements before adoption.

## Proposed separate initiative - Octobot Brain

**Status:** Proposed; priority unassigned; not part of the active Octobot Search implementation slice.

Create a separate `octobot-brain` repository for a local-first Marvel Champions rules expert. Once the
repository exists, move its executable checklist into that repository's own `TODO.md`; retain only a
cross-project dependency and status link here.

### Intended outcome

A user can ask a rules or card-interaction question and receive a concise answer grounded only in the
locally indexed rules, rulings, errata, and card data, with inspectable citations and an explicit
"insufficient evidence" result when the corpus does not support an answer.

The expert should run without a required hosted service. Users supply their own embedding and chat
models through replaceable adapters. A remote API-backed model may be an explicit opt-in adapter, but
the default architecture must not transmit rules, card data, questions, retrieved passages, or secrets
off the machine.

### Architectural guardrails

- Keep ingestion/retrieval separate from generation. The vector store and the small, low-latency
  ("flash") model are replaceable components rather than application-wide choices.
- Prefer hybrid retrieval: exact structured card lookup plus lexical search plus embeddings. Do not rely
  on vector similarity alone for card names, timing words, quantities, or rule-reference identifiers.
- Store source identity, title, version/effective date, checksum, page/section, and authority level with
  every chunk. Apply an explicit precedence policy for current rules, FAQ/rulings, and errata.
- Require answer-level citations that resolve to the retrieved source passages. Distinguish quoted rule
  text, card text, official rulings, and model inference.
- Bind services to STDIO or loopback by default. Do not expose the corpus, model, or API to the LAN or
  internet without a separate security decision.
- Do not commit copyrighted rulebooks, rulings exports, card dumps, generated embeddings, or model
  weights until their redistribution terms are established. Support ignored, user-provided local source
  directories and reproducible ingestion manifests.
- Keep secrets outside configuration committed to Git. Log source IDs, timings, and retrieval metrics,
  never full private questions or retrieved passages by default.
- Do not couple the first version to Octobot Search, Vercel, Cerebro availability, or a browser UI.

### Client interfaces

- Make a local MCP server the primary agent interface. At minimum expose narrow tools for exact card
  lookup, source retrieval, and grounded rules answering. Return structured citations and confidence/
  insufficiency metadata rather than prose alone.
- Provide project-scoped Codex configuration and setup documentation, not user-machine configuration or
  secrets committed to the repo. Local Codex clients support STDIO MCP servers and project-scoped MCP
  configuration; see the [official OpenAI MCP documentation](https://learn.chatgpt.com/docs/extend/mcp?surface=cli).
- Target the same standards-compliant MCP tools for Claude-compatible clients, but verify the current
  client configuration and tool behavior during the spike rather than assuming parity.
- Offer a versioned loopback HTTP/JSON API only as a secondary adapter for local model runtimes or
  clients that cannot consume MCP. MCP and HTTP must call the same application service and return the
  same citation model.

### First slice - corpus, retrieval, and interface spike

- [ ] With explicit owner authorization, create the `octobot-brain` repository with its own `README.md`,
  `AGENTS.md`, `TODO.md`, runbook, architecture decision records, tests, and ignored local-data paths.
- [ ] Inventory candidate rulebooks, FAQ/rulings, errata, and card-data sources. Record authority,
  version, update cadence, stable citation coordinates, and redistribution constraints before ingesting
  them.
- [ ] Define validated source, document, chunk, card, retrieval-hit, citation, and grounded-answer
  schemas. Preserve raw source text separately from normalized/indexed text.
- [ ] Build a deterministic, idempotent ingestion proof for a small legally usable corpus. Detect source
  changes by checksum, delete stale chunks, and make a rebuild reproducible without hand edits.
- [ ] Create a reviewed evaluation set covering direct lookup, timing windows, nested references,
  multi-card interactions, errata precedence, conflicting sources, unanswerable questions, and prompt-
  injection text inside the corpus.
- [ ] Benchmark exact/lexical, vector-only, and hybrid retrieval against the evaluation set before
  selecting a vector store or embedding model. Record retrieval recall, citation accuracy, latency,
  index size, and rebuild time on named local hardware.
- [ ] Implement one thin model-provider interface and prove it against one owner-selected local runtime.
  Keep generation optional so retrieval and citations can be evaluated without an LLM.
- [ ] Implement the MCP proof with `get_card`, `search_rules`, and `answer_rules_question`; add the
  loopback HTTP adapter only after the shared application contract is stable.
- [ ] Add adversarial tests that require abstention when sources are absent or conflicting and reject
  instructions found inside retrieved documents.
- [ ] Validate a complete local workflow from clean corpus ingest through a cited answer in Codex, then
  verify or document one Claude-compatible MCP setup. Record exact commands and limitations.

### Spike completion criteria

- A clean local setup can rebuild the test index deterministically and answer the evaluation questions
  without requiring a cloud service.
- Every substantive answer claim maps to a source ID and stable citation coordinate; unsupported or
  conflicting questions abstain instead of inventing a ruling.
- Hybrid retrieval is compared against non-vector baselines with recorded evidence; the chosen store,
  embedding model, and local model runtime follow from that evidence.
- Codex can invoke the tools through a local MCP connection. The HTTP adapter, if present, is loopback-
  only, versioned, and behaviorally equivalent.
- No repository artifact contains model credentials or redistributes unapproved source content,
  embeddings, or weights.

### Stop boundary

Do not build an Octobot Search chat UI, deploy a public rules bot, fine-tune a model, purchase hosted
vector/search infrastructure, or ingest the full private corpus in the first slice. Do not let this
initiative preempt the active P0/P1 Octobot Search roadmap without an explicit priority change.

### Decisions required before promotion

- Priority relative to the current search-quality roadmap.
- Which source material may be committed or redistributed versus remaining user-supplied and local.
- Whether remote model APIs are allowed as an opt-in fallback or the product must be strictly offline.
- The minimum supported local hardware and acceptable answer latency.

## Explicitly deferred

- Pages Router migration, React Compiler work without a measured rendering bottleneck, and any hosted
  search/database service.
- Replacing Axios with native `fetch` except as its own reviewed slice that preserves streamed response
  limits, retries, cancellation, safe diagnostics, and typed errors.
- MarvelCDB/deck features or prioritizing Merlin search/detail work before the primary-user decision.
- Deployment, Vercel setting changes, staging, committing, or pushing unless the owner asks.
