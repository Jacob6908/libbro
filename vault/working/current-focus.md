# Current Focus

v1 of libbro (auth, book tracking, recommendations) was built and merged
to `main` on GitHub (`Jacob6908/libbro`, public). Since then, a string of
features shipped to `production` and are open as **PR #7** into `main`,
not yet merged (nav bar, avatar upload, genre-preference modal, the
genre palette as primary theme, the bookshelf-grid search redesign,
search relevance ranking, categorized recommendations — see `decisions/`
and `specs/` for each).

**Most recent work (2026-08-09), on top of all of the above — shipped in
two fast iterations the same day:**

- Folded the standalone `/my-list` page into `/profile`, which is now a
  shelf-based "Your Books" view; editing username/bio/avatar/genres
  moved into its own `ProfileEditModal`, reached via an "Edit profile"
  button, separate from the browsing view.
- **Iteration 1**: added bookshelves with 5 default shelves auto-synced
  to reading status plus optional custom shelves, and made profiles
  viewable by other signed-in users at `/u/:username` (read-only) —
  `decisions/ADR-007-custom-bookshelves-and-profile-visibility.md`.
  Required new live-schema objects (`shelves`, `shelf_books`, a
  `public_reading_status` view) applied via
  `mcp__supabase__apply_migration`, per `decisions/ADR-002`'s
  established pattern. Hit the same bug class as `book_genres` did
  during v1: both new tables shipped with correct RLS but no
  table-level `GRANT`, causing every request to 403 until caught by
  browser testing — see `quality.md`.
- Added a new `/quality-check` skill (`.claude/skills/quality-check/`):
  runs lint/typecheck/build plus a browser-driven verification pass in a
  background subagent, so other work (like vault reconciliation) can
  proceed in parallel instead of blocking on it.
- **Iteration 2, hours later**: after reviewing iteration 1 running in
  the app, the user asked to go further — drop the default/status-linked
  shelf concept entirely in favor of full customizability. Shelves are
  now flat (no `status_key` column at all); every profile gets exactly
  one ordinary, auto-seeded "My shelf" instead of 5, renamable/deletable
  like any shelf. Reading-status tracking (want to read/reading/
  completed/on hold/dropped + progress/rating/notes) was kept but made
  fully independent of shelving — still lives on `BookDetail.tsx`
  exactly as before either iteration. The now-unneeded
  `public_reading_status` view and its client function were deleted.
  See `decisions/ADR-008-flat-shelves-no-default-status-shelves.md`
  (current) and `specs/bookshelves.md` (rewritten to describe this
  shape). ADR-007 is marked superseded, not edited, per this vault's
  rule against rewriting accepted ADRs.
- Verified end-to-end both times via two rounds of the `/quality-check`
  skill (lint/typecheck/build + a background subagent's browser-driven
  pass), including disposable-account tests of the signup-seeding
  trigger both before and after the flat-shelves rework.
- Committed to `production` alongside this vault reconciliation; not yet
  pushed to `origin/production` or folded into PR #7.

**Known gap from this work, not yet built:** shelf reordering exists at
the service/hook layer (`reorderShelves`) but isn't wired to any UI
control — see `working/open-questions.md`.

Not yet done, in rough priority order (see `working/open-questions.md`
for the reasoning behind each):

- No CI/CD or deployment target has been chosen.
- No automated test suite (deliberately deferred).
- Series/volume tracking (deliberately deferred, see
  `decisions/ADR-005-defer-series-and-volumes.md`).
- No "remove avatar" action — only replace (see
  `specs/avatar-upload.md`).
- Whether `profile_genre_preferences.weight` stays fixed at 2, is
  retired, or eventually gets driven by a real signal (see
  `specs/genre-preferences.md`).
- Shelf reordering UI, and whether custom-shelf book-adding should
  eventually move onto the shelf/profile view itself (see
  `specs/bookshelves.md`'s "Out of scope").
- No hover/`focus-visible` states on any button anywhere.
- Whether the now-unused `getRecommendationsForUser`/`useRecommendations`
  flat-list code path should be kept, removed, or repurposed.
- Whether the multi-query Google Books search strategy's higher request
  volume is a real quota concern in practice.

Update this file as focus shifts — it's temporary scratch context, not a
changelog.
