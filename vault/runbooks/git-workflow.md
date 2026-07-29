# Git / GitHub workflow

Established and verified in practice (two real PRs merged this way) as
of the 2026-07-28 audit. Repo: `github.com/Jacob6908/libbro` (public).

## Branches

- **`main`** — merge target. Not worked on directly.
- **`production`** — where changes are made before going to `main`. Not
  named for a deployment environment; it's the working branch in this
  repo's convention. Push here after committing locally.

## Making a change

1. Work on `production` (already checked out in the normal case).
2. Commit locally (see the `/commit` skill — it screens for secrets/large
   files/build artifacts before staging).
3. `git push origin production`.
4. Open a PR into `main`:
   `gh pr create --base main --head production --title "..." --body "..."`
5. Merge it: `gh pr merge <number> --merge --delete-branch=false` — a
   real merge commit, not squash or rebase; `production` is kept, not
   deleted, since it's the ongoing working branch.
6. Sync local `main` (it doesn't update itself just because GitHub
   merged something):
   ```
   git checkout main
   git merge --ff-only origin/main
   git checkout production
   ```
   The `--ff-only` is safe here because local `main` is never worked on
   directly, so it never has commits origin doesn't already have.

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
