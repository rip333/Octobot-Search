---
name: slice-report
description: Replace repository-root REPORT.md with the completion report for the latest finished Octobot Search implementation slice. Use only after code, tests, documentation, and requested verification are complete, or when the user explicitly asks for the latest implementation handoff.
---

# Slice Completion Report

`REPORT.md` holds only the most recent finished implementation slice. Replace it wholesale; never append
history. Do not write it for planning, investigation without a completed change, work in progress, or an
abandoned slice.

Write these sections in order. Use "None." when a section has nothing to report.

1. **Slice, date, and status**
2. **Confirmed problem or requested outcome**
3. **Shared production seam changed**
4. **Exact behavior before and after**, including deliberately unchanged boundaries
5. **Files changed**, grouped by production, tests, configuration, and documentation
6. **Regression coverage**, mapping each contract item to its proof
7. **Verification results**, with exact commands, totals, warnings, and network/upstream boundaries
8. **Incidental findings and remaining owner judgment**

Report only commands that actually ran. State baseline disagreements, changed test meaning, unavailable
external services, and visual or production behavior that still needs owner acceptance. Cross-reference
owning documentation instead of duplicating it.

Stay inside the role boundary in `CLAUDE.md`: do not edit the vault or rewrite priorities. Preserve
unrelated dirty work and do not stage, commit, push, or deploy unless asked.

