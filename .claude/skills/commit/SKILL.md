---
name: commit
description: Stage and commit all pending changes in the repo, after screening for large files, secrets, build artifacts, and other things that shouldn't be tracked. Use whenever the user says "/commit", "commit my changes", "commit everything", or asks to bring pending changes into a commit. Updates .gitignore and notifies the user if it finds anything that should be excluded rather than committed.
---

# Commit

Stage and commit all pending changes, but screen for problems first so nothing
bad ends up in git history. Unlike a blind `git add -A && git commit`, this
skill actively looks for reasons *not* to commit something before committing
everything else.

## Steps

### 1. Survey the working tree

Run in parallel:
- `git status` (never `-uall`, it can be slow/memory-heavy on large repos)
- `git diff` (unstaged) and `git diff --cached` (already staged, if anything)
- `git log --oneline -10` to match the repo's existing commit message style

### 2. Screen for things that shouldn't be committed

Before staging, check the untracked and modified files against these categories.
The goal is to catch mistakes *before* they're staged, not to relitigate every
past commit — only look at files that are currently pending (untracked or
modified), not the whole tree.

- **Large files**: anything sizable (a good default threshold is >5MB, but use
  judgment — a 2MB binary in a repo that's otherwise all text is still worth
  flagging) that isn't already an established pattern in the repo (e.g. if
  there's already a `models/*.bin` tracked at that size, a new one isn't a
  surprise). Check with something like:
  `git status --porcelain | awk '{print $2}' | xargs -I{} du -h {} 2>/dev/null | sort -rh | head -20`
- **Secrets / credentials**: `.env`, `.env.*` (except `.env.example`/`.env.sample`),
  `*.pem`, `*.key`, `credentials.json`, `id_rsa*`, API keys or tokens that show
  up in a diff, cloud provider credential files, etc.
- **Build artifacts / dependency dirs**: `node_modules/`, `.venv/`, `venv/`,
  `dist/`, `build/`, `__pycache__/`, `*.pyc`, `.next/`, `target/`, etc. — these
  should be excluded even if they got created but aren't yet tracked.
- **OS/editor cruft**: `.DS_Store`, `Thumbs.db`, `*.swp`, `.idea/`, `.vscode/`
  (only if not intentionally shared).
- **Anything that looks like it doesn't belong**: use judgment — e.g. a stray
  dump file, a personal notes file clearly not meant for the repo, a log file.

If a file is currently *tracked* and matches one of the above, that's a bigger
deal (it means it's already in history) — flag it to the user explicitly rather
than silently fixing it, since removing it from tracking is a more consequential
change than just adding a gitignore rule.

### 3. If something should be excluded

For untracked files/directories that shouldn't be committed:
1. Add an appropriate pattern to `.gitignore` (create the file if it doesn't
   exist). Keep patterns as general as sensible (e.g. `node_modules/` not the
   full path) but don't over-broaden past what's actually needed.
2. Leave those files out of `git add`.
3. Tell the user what you excluded and why, and what you added to `.gitignore` —
   don't just do this silently. If a matching file is already *tracked*, tell
   the user and ask before untracking it (`git rm --cached`) rather than doing
   it automatically.

If nothing needs excluding, no `.gitignore` changes are needed — don't add
speculative rules for things that aren't present.

### 4. Stage and commit everything else

- Stage the remaining pending changes by name (not `git add -A`/`git add .`,
  to avoid re-sweeping in anything just excluded).
- Draft a commit message following this repo's existing style (check the
  `git log` output from step 1): concise, focused on *why* over *what*.
- Commit with the message via a heredoc. Do not add a `Co-Authored-By`
  trailer or any other Claude/Anthropic attribution — the user is the
  sole author on this repo's commits and PRs.
- Run `git status` after to confirm a clean result.

### 5. Report back

Summarize in a couple of sentences: what got committed, and — if applicable —
what got excluded and why, and what changed in `.gitignore`.

## Notes

- Never commit without staging first being screened — even if everything
  looks pending and "obviously fine," do steps 1-2 before step 4.
- Don't invent problems: if the pending changes are all clearly legitimate
  source/doc changes, say so and move straight to committing. This skill is
  about catching real risks, not adding ceremony to every commit.
- This skill only commits — it does not push. Pushing is a separate,
  explicitly-confirmed action.
