# Current Focus

v1 of libbro (auth, book tracking, recommendations) was built and merged
to `main` on GitHub (`Jacob6908/libbro`, public). Since then, four more
features shipped on `production`:

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

The first three are merged to `main` (PR #4, the genre-picker rework,
merged on GitHub outside a session — **local `main` is still behind
`origin/main`** and needs the sync step in
`vault/runbooks/git-workflow.md`). The pastel-theme work is committed on
`production` but not yet pushed/PR'd as of this audit — `/ship` covers
that when ready.

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

Update this file as focus shifts — it's temporary scratch context, not a
changelog.
