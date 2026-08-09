# Current Focus

v1 of libbro (auth, book tracking, recommendations) was built and merged
to `main` on GitHub (`Jacob6908/libbro`, public). Since then, six more
features shipped:

- A persistent top nav bar, real avatar upload with cropping, and a
  floating word-shelf genre-preference modal — all merged to `main`
  (PR #4, PR #5).
- The genre palette promoted to the app's primary visual theme (see
  `decisions/ADR-006-genre-palette-as-primary-theme.md`) — merged to
  `main` (PR #5).
- Book search redesigned as a five-per-row bookshelf grid
  (`BookShelfCover`) — originally opened as PR #6 from a one-off
  `book_style` branch; that PR was closed unmerged and its content
  instead folded directly into `production` (fast-forward merge), which
  answers last audit's open "is `book_style` a new pattern?" question:
  it wasn't — `production` remains the single working branch per
  `runbooks/git-workflow.md`, unchanged.
- Search relevance ranking: the merged local+remote search results are
  now scored and sorted by title/author match quality instead of
  arbitrary/source order, and the Google Books provider tries multiple
  query strategies for better recall — see `architecture.md`'s "Search
  result ranking".
- Recommendations reworked from one flat list into a Netflix-style
  categorized feed (`/recommendations` shows a random 3-4 rows that
  reroll every visit, `/recommendations/all` browses every category) —
  see `specs/recommendations.md`.

All of the above is committed to `production` and open as **PR #7**
(`production` → `main`), not yet merged. Local `main` remains 7 commits
behind `origin/main` (unchanged since the last audit — this always lags
until someone runs the sync step in `runbooks/git-workflow.md`).

**Notable fact from this session, not just a feature note:** the
search-ranking and recommendations work went through a review pass that
caught two real regressions before shipping — search was silently
dropping (not just deranking) non-matching results, and recommendations
had lost their random-reroll-on-visit behavior. Both were found via
in-browser verification (not caught by lint/typecheck/build) and fixed
before the PR was opened. Worth remembering as another data point for
`working/open-questions.md`'s testing/quality question: this class of
bug keeps only getting caught by manual browser-driven checks.

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
- No hover/`focus-visible` states on any button anywhere.
- Whether the now-unused `getRecommendationsForUser`/`useRecommendations`
  flat-list code path should be kept, removed, or repurposed.
- Whether the new multi-query Google Books search strategy's higher
  request volume is a real quota concern in practice.

Update this file as focus shifts — it's temporary scratch context, not a
changelog.
