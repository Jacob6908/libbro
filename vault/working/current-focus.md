# Current Focus

v1 of libbro was built in this session (2026-07-26 through 2026-07-29):
auth, book search/import via Google Books, per-book reading tracking,
profile + genre preferences, content-based recommendations, and a home
dashboard / `/my-list` view. All eight build tasks are complete and each
was verified with browser-driven testing against the real Supabase
project, not just typecheck/lint.

Not yet done, in rough priority order (see `working/open-questions.md`
for the reasoning behind each):

- Nothing has been committed to git yet as of this audit — the whole
  build exists only in the working tree.
- No CI/CD or deployment target has been chosen.
- No automated test suite (deliberately deferred).
- Real avatar image upload (currently a URL text field, not a Storage
  bucket upload).
- Series/volume tracking (deliberately deferred, see
  `decisions/ADR-005-defer-series-and-volumes.md`).

Update this file as focus shifts — it's temporary scratch context, not a
changelog.
