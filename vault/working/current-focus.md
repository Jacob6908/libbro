# Current Focus

v1 of libbro (auth, book tracking, recommendations) was built and merged
to `main` on GitHub (`Jacob6908/libbro`, public). Since then, two more
features shipped on `production` and were merged via PR:

- A persistent top nav bar (`libbro` home link + links to every
  authenticated page + sign out) via a shared `AppShell` layout.
- Real avatar upload: file picker → Instagram-style crop
  (react-easy-crop) → fixed 512×512 JPEG → Supabase Storage, replacing
  the earlier URL-text-field placeholder. Default person-outline
  placeholder when no avatar is set.

Both are live on `main` as of this audit. See
`vault/runbooks/git-workflow.md` for how the `production` → `main` PR
flow works.

Not yet done, in rough priority order (see `working/open-questions.md`
for the reasoning behind each):

- No CI/CD or deployment target has been chosen.
- No automated test suite (deliberately deferred).
- Series/volume tracking (deliberately deferred, see
  `decisions/ADR-005-defer-series-and-volumes.md`).
- No "remove avatar" action — only replace (see
  `specs/avatar-upload.md`).

Update this file as focus shifts — it's temporary scratch context, not a
changelog.
