---
name: review-change
description: Reviews the current uncommitted change for correctness, architecture adherence, and risk before it is committed. Read-only — never modifies reviewable repository state or Git state/history.
disable-model-invocation: true
---

# Review Change

Review the change currently in progress in this repository.

This is a read-only review: do not modify reviewable repository state, and do not commit, push, merge, rebase, or otherwise change Git state or history.

## Read-only safety

Do not execute any command that can modify reviewable repository state, even temporarily.

Reviewable repository state includes tracked project files, reviewable untracked project files, the working tree, the index, Git refs, branches, stashes, and history.

Commands that only create known disposable or ignored build, test, coverage, or cache artifacts may be used when needed for validation, provided they do not alter reviewable project files or Git state.

The prohibition includes changes to tracked or reviewable untracked project files, the working tree, the index, Git refs, branches, stashes, or history.

In particular, do not run mutating Git commands such as:

- `git add`
- `git stash`
- `git checkout`
- `git switch`
- `git restore`
- `git reset`
- `git clean`
- `git commit`
- `git merge`
- `git rebase`
- `git cherry-pick`
- `git push`
- `git pull`

Do not temporarily mutate the repository in order to compare behavior with `HEAD`.

Use read-only alternatives such as `git show`, `git diff`, inspection of committed content, existing tests, and repository history.

## Procedure

1. Understand the intended change by reading the current conversation as a sequence of decisions, not only the earliest relevant instruction.

   A later explicit user instruction or decision supersedes a conflicting earlier constraint on the same change, and such a change must not be reported as unauthorized or scope creep.

   Base conclusions about why or how a change was made on evidence in the conversation or repository. If that evidence is insufficient to establish provenance or intent, state the uncertainty explicitly rather than inferring a cause.

2. Run `git status` to inspect the full state of the working tree, including untracked files.

3. Inspect staged and unstaged changes using read-only Git operations such as:

   - `git diff`
   - `git diff --cached`

4. Explicitly inspect the contents of untracked or newly-created files because they do not appear in normal `git diff` output.

   Do not dismiss an untracked regular file merely because it is tooling, configuration, or because it defines the Skill currently being executed. If it is part of the actual pending change, inspect its contents.

5. When suspicious untracked entries appear under Claude Code sandbox execution, check their filesystem type using a read-only command such as `stat` before treating them as project changes.

   Untracked entries that resolve to character special files are sandbox artifacts rather than real repository changes and must be excluded from the review without hardcoding a filename list.

   Regular files and normal directories remain candidate real changes and must still be inspected as described above.

6. Identify the applicable guidance for the changed files:

   - the project `CLAUDE.md`;
   - any matching `.claude/rules/*.md`;
   - other repository conventions that materially apply to the changed paths.

   Path-scoped rules must only be applied when their path patterns match the changed files.

7. Review the change against:

   - correctness and possible regressions;
   - adherence to the existing architecture and project conventions;
   - HTTP/API contracts when the change touches controllers, DTOs, routes, or other boundaries;
   - runtime/input safety versus compile-time type safety — a TypeScript type or DTO shape alone is not runtime validation;
   - error handling when relevant;
   - test coverage and whether behavior is verified at the appropriate layer, such as unit, integration, or end-to-end;
   - unrelated scope creep beyond the intended change;
   - unnecessary complexity or premature abstraction.

8. Before executing any project-defined quality gate or script, inspect its definition and determine whether it can modify reviewable repository state.

   Never execute an unknown project script first and inspect its behavior afterward.

   Do not execute auto-fix, update, write, snapshot-update, formatting-write, or equivalent mutating variants during a review.

   Examples of potentially mutating behavior include:

   - linters invoked with `--fix`;
   - formatters invoked in write mode;
   - tests invoked with snapshot-update options;
   - scripts that rewrite generated source or configuration files.

   Known disposable or ignored build/test/cache artifacts may be generated when necessary for validation, provided they do not modify reviewable repository state.

   If an applicable quality gate cannot be executed safely under these constraints, report it as not executed and explain why.

9. Where possible, distinguish issues introduced by the current change from pre-existing issues in surrounding code or configuration.

## Output language

Write all user-facing prose in the language requested by the active conversation and applicable user or project instructions.

Do not infer the response language from the language used in this Skill file.

Translate section headings to the active response language.

Keep code, identifiers, commands, logs, error messages, literals, and other technical tokens in their original language when translating them would reduce precision.

## Output

Produce a report with exactly four sections.

Localize each section heading to the active response language.

Do not output any preamble, introduction, commentary, summary, or other
user-facing text outside these four sections.

Start the response directly with the localized heading of the first section.

Every user-facing sentence in the report must follow the active response
language, including short observations, caveats, and transitional text.

1. Issues found, ordered by severity from most severe to least severe.

   For each issue, include when possible:

   - file and line;
   - the problem;
   - its impact.

   If there are no findings, say so explicitly rather than inventing suggestions.

   Avoid style-only findings unless they materially affect readability, maintainability, correctness, safety, or established project conventions.

2. Validations actually performed or evaluated.

   Clearly distinguish:

   - validations that were executed;
   - validations evaluated but intentionally not executed;
   - relevant validations that could not be performed.

3. Assumptions or residual risks, when applicable.

   Do not present uncertainty as fact.

4. A concise final assessment and verdict indicating whether the pending change appears ready to proceed.
