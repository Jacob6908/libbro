# Git / GitHub workflow

Repo: `github.com/Jacob6908/libbro` (public). **The convention changed
partway through this project — see "History" below.** As of this audit
(2026-08-09), the observed pattern for the three most recent PRs (#10,
#11, #12) is a dedicated feature branch per change, merged straight into
`main` — `production` is not part of the flow anymore in practice.

## Current pattern (PRs #10, #11, #12 — verified via `gh pr list`)

1. Work on a new, purpose-named branch off `main` (e.g. `login_updates`,
   `small_tweaks`, `grainy_scroll` — named for the change, not a fixed
   branch name).
2. Commit locally (see the `/commit` skill — it screens for secrets/
   large files/build artifacts before staging).
3. `git push origin <branch-name>`.
4. Open a PR into `main`:
   `gh pr create --base main --head <branch-name> --title "..." --body "..."`

   Steps 2-4 can be run in one shot via the `/ship` skill: it commits
   anything pending, pushes, checks for an already-open PR before
   creating a new one, and stops — it never merges. The skill already
   uses "whatever branch is actually checked out" rather than
   hardcoding a name, so it didn't need updating when this pattern
   changed.
5. Merge it: `gh pr merge <number> --merge --delete-branch=false` — a
   real merge commit, not squash or rebase. Whether the feature branch
   itself gets deleted after merging isn't consistently established
   yet (`login_updates`/`small_tweaks` still exist as remote branches
   as of this audit).
6. Sync local `main`:
   ```
   git checkout main
   git merge --ff-only origin/main
   ```
   The `--ff-only` is safe here because local `main` is never worked on
   directly.

## History: the older `production`-branch pattern

PRs #1-#8 all used a single long-lived `production` branch as the head
for every PR into `main` (see `git-workflow.md`'s prior version, and
`decisions/`/`working/` notes from that period that still say
"production"). As of this audit, `production` is **10 commits behind
`main`** and has nothing merged from it that isn't already in `main` —
it's stale, not in active use. **Unknown**: whether abandoning
`production` for feature branches was a deliberate, permanent
convention change, or just what happened to fit these three specific
changes — see `working/open-questions.md`. Older vault text (ADRs,
older working notes) that refers to "the `production` branch" is
describing what was true when it was written, not necessarily the
current pattern — don't assume it still applies without checking
`gh pr list` first.

## Why `main` used to show "behind" after every merge (production-era only)

This applied under the old `production` pattern, where the same branch
was reused as the head of every PR: after merging `production` into
`main` on GitHub, `production` itself didn't gain the merge commit —
only `main` did, so the *next* PR from `production` would show `main`
as "ahead" by that merge commit even though `production`'s code content
was already included. Doesn't apply to the current one-branch-per-change
pattern, since each branch is only ever used for a single PR.

## Why `main` shows "behind" after every merge

After merging `production` into `main` on GitHub, `production` itself
doesn't gain the merge commit — only `main` does. So immediately after a
merge, `main` (once locally synced) is functionally caught up, but the
*next* time you check `production` against `main`, `production` will
look "behind" by that merge commit. This is expected, not a sign
something's wrong — `production`'s actual code content is already
included in `main` at that point, just not the merge-commit history
itself. Confirm with `git merge-base --is-ancestor <production-commit>
origin/main` if in doubt.
