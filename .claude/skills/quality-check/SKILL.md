---
name: quality-check
description: Launches a background subagent that runs lint/typecheck/build and a browser-driven visual verification pass against the running dev server, then reports back when done — so the main session can keep working (reconciling the vault, continuing implementation, starting the next task) instead of blocking on checks. Use whenever the user says "/quality-check", asks to "verify this in the browser", "check that it actually works", or after finishing a change that touches UI or live app behavior and needs confirmation before being called done.
---

# Quality check

Verification (static checks + visual/browser confirmation) and other work
(vault reconciliation, the next implementation step, documentation) are
almost always independent — nothing about running `npm run lint` or
clicking through a page depends on writing docs, and vice versa. This
skill runs the verification half in a background subagent so the main
session isn't stuck waiting on it.

## Steps

### 1. Scope the check

Look at what actually changed (`git status`, `git diff`, or the current
task/plan context) and figure out:

- Which files/routes/components are new or modified.
- Which user-facing flows exercise them (e.g. "create a custom shelf,
  add a book to it from BookDetail, view it on `/u/:username`" — not just
  "load the homepage").
- Whether the change is UI/behavior-facing at all. If it's purely
  internal (a doc update, a refactor with no behavior change, a vault
  edit), the browser half isn't needed — just run the static checks
  yourself inline and skip spawning an agent; this skill exists for the
  case where a visual/dynamic pass is actually warranted.

### 2. Confirm the dev server

Per `vault/quality.md`, the app runs via `npm run dev` (default
`http://localhost:5173`). Check with
`curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/` — if it's
not already up, note that the subagent should start it itself.

### 3. Launch one background verification agent

Use the `Agent` tool with `run_in_background: true` (never `false` — the
whole point is not to block). Give it a fully self-contained prompt,
since it starts with no memory of this conversation:

- Repo path, and a one-paragraph summary of what was built/changed and
  why (so it isn't rediscovering context you already have).
- The exact commands to run from `vault/quality.md`: `npm run lint`,
  `npx tsc -b --noEmit`, `npm run build`. Tell it to report exact
  output/exit status, not just "passed."
- The exact flows to click through from step 1, using the
  `mcp__claude-in-chrome__*` tools (load them first via `ToolSearch` with
  query `"select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__find"`
  if not already loaded). Tell it to take screenshots at each meaningful
  step and describe what it actually saw, not just "looked fine."
- **If the flow needs a live-data action that would leave junk in the
  real database** (creating a test account, a test shelf, a test book
  entry, etc.) — this app's Supabase project is the single live
  production project (confirmed in `vault/architecture.md`/
  `decisions/ADR-002-dashboard-managed-schema.md` — no separate
  dev/staging project exists), not a sandbox. Tell the agent to load
  `mcp__supabase__execute_sql` (via `ToolSearch` if needed) and clean up
  anything it created afterward (e.g. `delete from auth.users where
  email = '...'`, which cascades), then verify the cleanup with a row
  count.
- Ask for a concise report (pass/fail per check, exact error text if
  something failed, under ~250 words) rather than a full transcript.

### 4. Keep going — don't wait

Immediately continue with other pending work (vault reconciliation, the
next implementation step, whatever else is queued). The agent notifies
this session automatically when it finishes; do not poll it, do not
guess at its outcome, and do not tell the user it passed or failed until
the actual notification arrives.

### 5. On completion

Relay the agent's pass/fail findings to the user. If it found a real
issue, fix it and consider re-running this skill to confirm the fix — a
caught bug isn't done until it's re-verified, not just noted.

## Notes

- One verification agent per pending change — don't spawn a second one
  for the same change while the first is still running.
- This skill doesn't replace judgment about *what* to check; a vague
  "make sure it works" pass is weaker than one scoped to the actual
  flows touched by the change (step 1 is the part that makes this
  useful, not the backgrounding itself).
- If there's nothing to visually verify (no dev server needed, change is
  non-UI), don't force the browser half just to use this skill — run the
  static checks yourself and say so.
