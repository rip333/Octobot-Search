# Octobot Search - Claude Code Guide

## Agent role boundary

Claude Code primarily performs implementation, debugging, tests, and implementation documentation from
repository-root `TODO.md`, `AGENTS.md`, `CONTEXT.md`, and `RUNNING.md`.

Do not curate `obsidian/Octobot-Search/`, rewrite project decisions, or maintain executive memory unless
the user explicitly asks. Codex owns that workflow through
`.agents/skills/octobot-search-executive-memory/SKILL.md`.

Preserve unrelated dirty changes. Do not stage, commit, push, deploy, or change external project settings
unless the owner explicitly requests it.

## Repository skills

- Use `/octobot-search-slice <exact TODO.md heading>` to execute one bounded implementation slice.
- Use `/slice-report` last, only after a completed slice and its verification, to replace `REPORT.md`.
- If either skill is unavailable, follow the same behavior directly rather than widening the task.

Repository rules and the active `TODO.md` contract override generic skill defaults. Surface a conflict
instead of silently choosing one.

