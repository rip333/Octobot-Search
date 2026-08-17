---
name: octobot-search-executive-memory
description: Maintain Octobot Search executive memory and its owner-Codex-implementation workflow. Use for brainstorming, planning, roadmaps, prioritization, product or architecture decisions, project status, TODO.md stewardship, implementation-agent handoffs, reviewing REPORT.md, reconciling reported work with the repository, note capture or retrieval, and documentation reconciliation. Do not use for isolated coding, debugging, testing, or building unless the user also requests planning, memory capture, implementation review, or project-state reconciliation.
---

# Octobot Search Executive Memory

Maintain durable product memory while keeping owner intent, proposed direction, implementation claims,
and verified behavior distinct.

## Default role split

- **Owner:** product judgment, priorities, acceptance, and external-service policy.
- **Codex:** analyze evidence, curate decisions, manage `TODO.md`, review implementation work, verify
  claims, maintain the vault, and construct the next implementation prompt.
- **Implementation agent:** execute one bounded `TODO.md` slice, add regression coverage, run required
  verification, update implementation documentation, and replace `REPORT.md` after completion.

Codex may implement directly when explicitly asked. The split is a workflow default, not a capability
restriction.

## Canonical locations

- Latest implementation-agent handoff: repository-root `REPORT.md` (read-only for Codex)
- Vault home: `obsidian/Octobot-Search/OCTOBOT SEARCH.md`
- Current priorities: `obsidian/Octobot-Search/Executive/Current Focus.md`
- Verified snapshot: `obsidian/Octobot-Search/Executive/Project State.md`
- Decisions: `obsidian/Octobot-Search/Decisions/Decision Index.md`
- Evidence policy: `obsidian/Octobot-Search/Process/Source of Truth.md`
- Coding-agent contract: repository-root `TODO.md`
- Cross-system implementation rules: repository-root `AGENTS.md`
- Technical map: repository-root `CONTEXT.md`
- Commands and live verification: repository-root `RUNNING.md`

Resolve paths from the repository root. Stop and report a missing vault rather than creating a second
one.

## Start work

1. Read `REPORT.md` first when it exists. Treat it as claims and observed command output, not proof.
   Never edit it; the implementation agent owns replace-in-place reporting.
2. Read the vault home, Current Focus, Decision Index, and Source of Truth completely. Follow only links
   relevant to the task.
3. Inspect `git status --short` and preserve unrelated dirty or untracked work.
4. Classify material statements as intent, decision, implementation, or verified behavior.
5. Inspect current code, tests, configuration, documentation, Git history, builds, or the running app
   when implementation status matters.

Do not treat a TODO checkbox, old document, filename, or agent report as proof that behavior exists.

## Capture and plan

Capture durable owner direction, decisions and reasoning, rejected alternatives, priority changes,
risks, product observations, external-service assumptions, verified milestones, and documentation
contradictions. Do not capture casual exploration or silently promote Codex suggestions into decisions.

Use these states consistently: **Idea**, **Proposed**, **Decided**, **Implemented**, **Verified**, and
**Stale**. Retain superseded decisions as history.

When discussion produces actionable implementation work:

1. Write or update the repository-root `TODO.md` contract.
2. Include outcome, established decisions, affected seams, non-negotiable rules, ordered work,
   verification, exclusions, and completion criteria when material.
3. Keep rationale, priority, and history in the vault without duplicating the checklist.
4. Keep technical contracts in `CONTEXT.md`, `README.md`, or the closest owning documentation.

## Construct implementation handoffs

Build one self-contained prompt for exactly one open `TODO.md` slice. Include repository path, required
reading, current evidence, established decisions, ordered tasks, behavioral contracts, exclusions,
verification commands, report requirements, and an explicit stop boundary.

Require the implementation agent to:

- preserve unrelated dirty changes and avoid staging, committing, pushing, or vault edits unless asked;
- inspect the current repository rather than trusting the prompt as implementation truth;
- reproduce bugs with a red-capable test before changing production behavior;
- run focused tests first, then the complete command sequence in `RUNNING.md`, and report exact results;
- treat `npm run build` as network-dependent because it reads live Cerebro data;
- review the result against both the active `TODO.md` slice and `AGENTS.md`/owning docs; and
- replace `REPORT.md` only after a completed, verified slice.

Do not delegate unresolved product judgment or exact policy choices without a decision rule.

## Reconcile implementation work

1. Parse `REPORT.md` into claimed changes, claimed verification, limitations, and incidental findings.
   Check that it names the current slice rather than an older one.
2. Compare the report and `TODO.md` with the dirty working tree and recent commits. Do not attribute all
   dirty files to the latest agent.
3. Inspect changed production seams, tests, configuration, and owning documentation.
4. Run focused checks and the complete command sequence in `RUNNING.md` in proportion to the requested
   confidence. Record exact
   commands and totals; do not infer results for commands that did not run.
5. Preserve verification boundaries, especially live upstream availability, Vercel behavior, visual
   acceptance, and production analytics.
6. Update `TODO.md` and vault notes only where the evidence changes their state.

## Octobot invariants

- Keep external HTTP in `src/api/`.
- Build Cerebro expressions only through `src/api/cerebroQuery.ts`.
- Validate route parameters before upstream calls.
- Never cache transient upstream failure as successful empty content.
- Keep official search limited to official Cerebro cards unless the owner changes that decision.
- Treat Vercel as the sole deployment target unless the owner decides otherwise.
- Every fixed bug needs a red-capable regression test that guards the bug class.
- Do not claim `npm run build` verified when live Cerebro access prevented it from running.

## Finish

1. Verify links in changed vault notes and check changed Markdown for trailing whitespace.
2. Confirm no unrelated files changed.
3. Summarize decisions, notes, TODO changes, verification, and uncertainty.
4. Do not stage or commit unless asked.

For isolated implementation that does not change direction or require memory reconciliation, leave the
vault untouched.
