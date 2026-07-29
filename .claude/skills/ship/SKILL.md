---
name: ship
description: Commit any pending changes (screening for secrets/large files/build artifacts first, same as /commit), push the current branch to GitHub, and open a PR into main. Does not merge. Use whenever the user says "/ship", "push to github", "push everything", "open a PR", or asks to get the current branch up on GitHub for review.
---

# Ship

Get the current branch onto GitHub and in front of a reviewer: commit
anything pending, push, open a PR into `main`. Stop there — merging is a
separate, explicitly-requested action, not part of this skill.

This is the push+PR half of the flow in
`vault/runbooks/git-workflow.md`; re-read that file if it's been a while,
in case the branch/merge conventions it describes have changed since
this skill was written.

## Steps

### 1. Commit anything pending

Run `git status`. If there are staged or unstaged changes, follow
`.claude/skills/commit/SKILL.md` in full (survey, screen for
secrets/large files/build artifacts, stage by name, commit) before
continuing — don't duplicate that logic here, and don't skip the
screening just because the end goal this time is to push.

If the tree is already clean, skip straight to step 2.

### 2. Push

- `git branch --show-current` for the branch name (the repo's convention
  is `production`, but use whatever is actually checked out).
- Check whether it's already up to date with its remote counterpart
  (`git status` after a `git fetch` makes this visible) — if there's
  nothing new to push, say so and skip the push rather than no-op it
  silently.
- Otherwise `git push origin <branch>`. Never force-push here; if a
  plain push is rejected (diverged history), stop and surface that to
  the user instead of resolving it unilaterally.

### 3. Open the PR into `main`

- First check whether a PR already exists for this branch so you don't
  create a duplicate: `gh pr list --head <branch> --base main --state open`.
- If one exists, report its URL and stop — nothing left to do.
- Otherwise, review everything that will be in the PR (not just the
  latest commit): `git log --oneline main..<branch>` and
  `git diff main...<branch>`. Draft a title (under 70 characters) and a
  body with a `## Summary` (bullet points) and, where there's something
  concrete to check, a `## Test plan` checklist — same conventions as
  any other PR description.
- Create it with a HEREDOC body, same pattern as the standard PR-creation
  flow:
  ```
  gh pr create --base main --head <branch> --title "..." --body "$(cat <<'EOF'
  ## Summary
  - ...

  ## Test plan
  - [ ] ...
  EOF
  )"
  ```

### 4. Report back

Give the PR URL. If step 1 committed something, mention what. Don't merge,
don't delete the branch, don't touch local `main` — those are the
merge-step half of the runbook, out of scope here.

## Notes

- Invoking this skill is the go-ahead to push and open the PR — no extra
  confirmation prompt before those steps. Merging is never included,
  regardless of how it's invoked; that's always a separate request.
- If `git status` shows the branch has diverged from its remote in a way
  a plain push can't resolve, or if commit screening (step 1) turns up
  something that shouldn't be committed, stop and ask rather than
  guessing.
