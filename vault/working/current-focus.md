# Current Focus

v1 of libbro (auth, book tracking, recommendations) was built and merged
to `main` on GitHub (`Jacob6908/libbro`, public). Since then, a string of
features shipped to `production` and are open as **PR #7** into `main`,
not yet merged (nav bar, avatar upload, genre-preference modal, the
genre palette as primary theme, the bookshelf-grid search redesign,
search relevance ranking, categorized recommendations — see `decisions/`
and `specs/` for each).

**Most recent work (2026-08-09), on top of all of the above:**

- Folded the standalone `/my-list` page into `/profile`, which is now a
  shelf-tab-based "Your Books" view; editing username/bio/avatar/genres
  moved into its own `ProfileEditModal`, reached via an "Edit profile"
  button, separate from the browsing view.
- Added **custom, user-titled bookshelves** alongside the 5 existing
  status-based ones, and made profiles viewable by other signed-in users
  at `/u/:username` (read-only). This is a real product-direction shift,
  not a routine refinement — see
  `decisions/ADR-007-custom-bookshelves-and-profile-visibility.md` and
  `specs/bookshelves.md` for the full design and the three forks the
  user resolved before any schema work started (default-shelf/status
  coupling, visibility scope, whether a shelf requires the book to be
  tracked).
- Required new live-schema objects (`shelves`, `shelf_books`, the
  `public_reading_status` view) applied directly against the Supabase
  project via `mcp__supabase__apply_migration`, per
  `decisions/ADR-002-dashboard-managed-schema.md`'s established pattern.
- Hit the same bug class as `book_genres` did during v1: both new tables
  shipped with correct RLS but no table-level `GRANT`, causing every
  request to 403 until caught by browser testing. Fixed in the same
  session — see `quality.md`.
- Added a new `/quality-check` skill (`.claude/skills/quality-check/`):
  runs lint/typecheck/build plus a browser-driven verification pass in a
  background subagent, so other work (like this vault reconciliation)
  can proceed in parallel instead of blocking on it. Used for the final
  verification pass on this feature, including a disposable-account test
  confirming new signups get their 5 default shelves via the
  `handle_new_user()` trigger (not just the one-time backfill migration
  that covered the 35 pre-existing profiles).
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
