# Current Focus

v1 of libbro (auth, book tracking, recommendations) was built and merged
to `main` on GitHub (`Jacob6908/libbro`, public). Since then, five more
features shipped:

- A persistent top nav bar (`libbro` home link + links to every
  authenticated page + sign out) via a shared `AppShell` layout.
- Real avatar upload: file picker → Instagram-style crop
  (react-easy-crop) → fixed 512×512 JPEG → Supabase Storage, replacing
  the earlier URL-text-field placeholder. Default person-outline
  placeholder when no avatar is set.
- Genre preference editing reworked into a floating, tap-to-highlight
  modal (`GenrePreferenceModal`), replacing the old flat Meh/Like/Love
  button list. Preference strength is no longer user-adjustable — see
  `specs/genre-preferences.md` and the open weight-column question
  below.
- The genre palette promoted to the app's primary visual theme: a
  warm-tinted page background, white content surfaces, and a single
  slate primary accent for buttons/links/active states everywhere — see
  `decisions/ADR-006-genre-palette-as-primary-theme.md`.
- Book search redesigned as a five-per-row bookshelf grid
  (`BookShelfCover`), with the search query moved into the URL's `q`
  param so it survives navigating to a book and back — see
  `specs/book-metadata-import.md`.

The first four are merged to `main` (PR #4 and PR #5) — **local `main`
is currently 7 commits behind `origin/main`** and needs the sync step in
`vault/runbooks/git-workflow.md`. The bookshelf-grid redesign is open as
PR #6 (`book_style` → `main`), not yet merged.

**Git workflow deviation, not yet reconciled with the documented
convention:** PR #6 was opened from a new branch, `book_style`, branched
off `production` at the pastel-theme commit — not from `production`
itself as `runbooks/git-workflow.md` describes. Whether this is a
one-off (e.g. an experiment kept separate from `production`
deliberately) or a shift toward per-feature branches going forward is
unclear from the repo alone; see `working/open-questions.md`. The
runbook itself hasn't been changed, since only one branch has deviated
from it so far.

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
  `specs/genre-preferences.md`) — recommended to keep it during this
  session's rework, not yet confirmed by the user.
- No hover/`focus-visible` states on any button anywhere (predates the
  new primary-color theme, but more noticeable now that there's a real
  accent color to react on).
- Book search has no relevance ranking: `searchLocalBooks`
  (`src/services/supabase/books.ts`) filters on `search_vector` via
  `textSearch` but never orders by `ts_rank`, so matches return in
  whatever order Postgres's scan produces; `mergeResults`
  (`src/hooks/useBookSearch.ts`) then just concatenates local results
  before remote Google Books results with no re-sorting. User flagged
  this explicitly (2026-08-07) — searching "blood" surfaces an
  unrelated book with "blood" as its third word above "Blood Meridian".
  Confirmed future work, not started.
- Recommendations: user wants named categories in the feed (e.g.
  "longer than you'd usually read", "horror for you") rather than one
  flat ranked list — see `specs/recommendations.md`'s current scoring
  model. Confirmed future work, not started, no design decided yet.

Update this file as focus shifts — it's temporary scratch context, not a
changelog.
