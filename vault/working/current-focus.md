# Current Focus

v1 of libbro (auth, book tracking, recommendations) was built and merged
to `main` on GitHub (`Jacob6908/libbro`, public). Since then, three more
features shipped on `production` and were merged via PR:

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

All three are live on `main` as of this audit (PR #4, the genre-picker
rework, merged on GitHub outside this session — **local `main` is
currently behind `origin/main` by that merge commit** and needs the sync
step in `vault/runbooks/git-workflow.md` run before working from local
`main`). A `/ship` skill was also added this session to automate the
push-and-open-PR half of that runbook (not the merge step).

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

Update this file as focus shifts — it's temporary scratch context, not a
changelog.
