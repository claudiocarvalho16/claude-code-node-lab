---
name: review-change
description: Reviews the current uncommitted change for correctness, architecture adherence, and risk before it is committed. Read-only — never modifies files, and never commits, pushes, merges, rebases, or rewrites history.
disable-model-invocation: true
---

# Review Change

Review the change currently in progress in this repository. This is a read-only review: do not modify any file, and do not commit, push, merge, rebase, or otherwise change git history.

## Procedure

1. Understand the intended change by reading the current conversation as a sequence of decisions, not only the earliest relevant instruction. A later explicit user instruction or decision supersedes a conflicting earlier constraint on the same change, and such a change must not be reported as unauthorized or scope creep. Base conclusions about why or how a change was made on evidence in the conversation or repository; if that evidence is insufficient to establish provenance or intent, state the uncertainty explicitly rather than inferring a cause.
2. Run `git status` to see the full state of the working tree, including untracked files.
3. Inspect staged and unstaged changes (e.g. `git diff` and `git diff --cached`).
4. Explicitly inspect the contents of untracked/new files — they will not appear in `git diff` output. Do not dismiss an untracked regular file merely because it is tooling/configuration or because it defines the Skill currently being executed; if it is part of the actual pending change, inspect its contents.
5. When suspicious untracked entries appear under Claude Code sandbox execution, check their filesystem type (e.g. `stat`) before treating them as project changes. Untracked entries that resolve to character special files are sandbox artifacts, not real repository changes, and must be excluded from the review — without hardcoding a filename list. Regular files and normal directories remain candidate real changes and must still be inspected per step 4.
6. Identify the relevant guidance for the changed files: the project `CLAUDE.md` and any matching `.claude/rules/*.md` (rules apply by path pattern, so match them against the changed files).
7. Review the change against:
   - correctness and possible regressions;
   - adherence to the existing architecture and project conventions;
   - HTTP/API contracts, when the change touches controllers, DTOs, or routes;
   - runtime/input safety versus compile-time type safety — a TypeScript type or DTO shape is not runtime validation;
   - error handling, when relevant;
   - test coverage, and whether behavior is verified at the appropriate layer (unit vs e2e);
   - unrelated scope creep beyond the intended change;
   - unnecessary complexity.
8. Run or evaluate the relevant non-mutating quality gates (e.g. `npm run build`, `npm run lint`, `npm run test`) when appropriate for the changed code. Passing tests alone are not sufficient evidence the change is ready — also weigh build, lint, and other applicable gates.
9. Where possible, distinguish issues introduced by this change from pre-existing issues in the surrounding code.

## Output

Report:

- **Findings** — ordered by severity (most severe first). For each: file and line when possible, the problem, and its impact. If there are no findings, say so explicitly rather than inventing suggestions. Avoid style-only findings unless they materially affect readability, maintainability, correctness, or established project conventions.
- **Validations performed** — what was actually checked or run.
- **Assumptions or residual risks** — if any.
- **Final assessment** — a concise verdict.
