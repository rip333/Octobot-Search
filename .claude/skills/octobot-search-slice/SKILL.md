---
name: octobot-search-slice
description: Execute one explicitly named Octobot Search TODO.md implementation slice through verified completion.
argument-hint: "Exact TODO.md section heading or owner-named slice"
disable-model-invocation: true
---

# Octobot Search Slice

Execute exactly one bounded implementation slice. Resolve `$ARGUMENTS` from an exact `TODO.md` heading
or an equally specific owner-named slice. Ask for the exact slice if the boundary remains ambiguous; do
not choose the next unchecked task.

## Establish the contract

1. Read `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, `RUNNING.md`, and `REPORT.md` when present.
2. Read the complete named `TODO.md` section, owning documentation, current code, and relevant tests.
3. Inspect `git status --short`; preserve unrelated dirty and untracked work.
4. Extract outcome, established behavior, approved seams, invariants, exclusions, verification, and the
   stop boundary.
5. Stop for owner direction only if completion requires a different public seam, unresolved product
   choice, destructive action, external mutation, or scope beyond the named slice.

## Build the feedback loop

- For a bug, establish one focused test that fails for the reported behavior before production changes.
- Implement vertical red-green slices through public behavior. Avoid bulk tests written against an
  imagined implementation.
- Reuse the established `src/api/`, parsing, result, and route-validation seams instead of bypassing
  them.

## Implement only the slice

Follow `AGENTS.md` and the current technical contracts in `CONTEXT.md` and owning documentation. Record
incidental findings for the report; fix them only if they block or invalidate the named slice.

## Verify and review

1. Run the focused test, then affected regressions.
2. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
3. For dependency/security work, run `npm audit --omit=dev --audit-level=info`.
4. Report exact results and preserve the live-Cerebro build boundary.
5. Review once against every requirement and exclusion in the active TODO slice, then once against
   `AGENTS.md`, `CONTEXT.md`, and owning documentation.

## Close

1. Update implementation documentation and TODO checkboxes only when evidence supports them.
2. Leave `obsidian/Octobot-Search/` untouched.
3. Do not stage, commit, push, deploy, or start a later slice unless explicitly asked.
4. Invoke `/slice-report` last to replace `REPORT.md` with the latest completed-slice report.

