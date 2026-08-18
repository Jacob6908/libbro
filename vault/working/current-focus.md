# Current Focus

v1 of libbro (auth, book tracking, recommendations) and the
nav bar/avatar-upload/genre-modal/bookshelves work that followed are all
merged to `main` (through PR #8; see `decisions/` and `specs/` for each
feature, `runbooks/git-workflow.md`'s "History" section for the
`production`-branch pattern that flow used).

**Since then, five more changes have shipped as separate feature
branches, each merged directly into `main`** (see `runbooks/
git-workflow.md`'s "Current pattern"):

- **PR #10 (`login_updates`)** — client-side auth/session hardening plus
  a visual redesign of `/signin`/`/signup`. See `specs/auth.md`.
- **PR #11 (`small_tweaks`)** — a universal `cursor: pointer`/
  `not-allowed` CSS rule, a couple of `ListEntryModal.tsx` bug fixes, and
  the nav label "Your Books" → "Your Library".
- **PR #12 (`grainy_scroll`)** — merged 2026-08-10. Book cover images
  upgraded to Google Books' `zoom=2` URL variant plus
  `loading="lazy"`/`decoding="async"` on cover `<img>`s.
- **PR #13 (`better_covers`)** — merged 2026-08-17. Extended the
  `/signin`/`/signup` visual redesign to `/forgot-password` and
  `/reset-password` (closes the previously-open visual-inconsistency
  gap); added a cover-image runtime fallback (`useCoverImageSrc.ts` +
  `lib/googleBooksCoverUrl.ts`) that retries a broken/over-cropped cover
  at `zoom=1`, but only wired into `BookDetail.tsx`.
- **PR #14 (`issho-style-search`)** — merged 2026-08-18. Supersedes
  `decisions/ADR-003-google-books-behind-provider-interface.md` (see
  `decisions/ADR-009-remove-book-metadata-provider-abstraction.md`):
  removes the `BookMetadataProvider` interface so search/import code
  consumes Google Books' vendor shape directly, matching how the
  reference app `issho` handles `AniListMedia`. Kept unchanged: the
  multi-variant query merge, client-side relevance ranking, local-cache
  + live-search hybrid, 14-day TTL, HTML-stripping, and genre
  resolution. Bundled with an independent fix to the cover-URL
  enhancement logic (`enhanceGoogleBooksCoverUrl` now only requests
  `zoom=2` when the original URL has Google's `edge=curl` marker —
  verified empirically that volumes without it return a degenerate
  cropped asset at `zoom=2`, not a bigger cover).

**Known gap, real and current, not yet resolved:** PR #13's
`validateAspectRatio` cover-fallback and PR #14's `edge=curl` check both
address the same underlying broken-cover bug through different,
uncoordinated mechanisms, and PR #13's fallback is only wired into
`BookDetail.tsx` — `BookCoverCard.tsx`, `BookShelfCover.tsx`, and
`SimilarBooks.tsx` don't get it. See `architecture.md`'s "Cover-image
runtime fallback" and `working/open-questions.md`.

**Known gaps carried forward, not yet resolved:**

- The Chrome-specific credential-manager workarounds in `specs/auth.md`
  haven't been checked in Safari/Firefox.
- Whether the PR #10-14 feature-branch-per-change pattern is a
  permanent, deliberate replacement for `production` is still
  unconfirmed as explicit policy, though five-for-five is strong
  evidence.
- Six branches are confirmed fully merged into `main` and are cleanup
  candidates: `production`, `book_style`, `login_updates`,
  `small_tweaks` still exist as remote branches; `grainy_scroll`,
  `better_covers`, and `issho-style-search` were already deleted after
  merging (branch deletion appears to be becoming the norm, but wasn't
  applied retroactively to the earlier ones).

Older, still-unresolved items carried forward (see
`working/open-questions.md` for the reasoning behind each):

- No CI/CD or deployment target has been chosen.
- No automated test suite (deliberately deferred).
- Series/volume tracking (deliberately deferred, see
  `decisions/ADR-005-defer-series-and-volumes.md`).
- No "remove avatar" action — only replace (see
  `specs/avatar-upload.md`).
- Whether `profile_genre_preferences.weight` stays fixed at 2, is
  retired, or eventually gets driven by a real signal (see
  `specs/genre-preferences.md`).
- Shelf reordering UI (`reorderShelves` exists at the service/hook layer,
  unwired to any UI control — see `specs/bookshelves.md`).
- Whether the now-unused `getRecommendationsForUser`/`useRecommendations`
  flat-list code path should be kept, removed, or repurposed.
- Whether the multi-query Google Books search strategy's higher request
  volume is a real quota concern in practice.
- Whether a metadata-source abstraction should be reintroduced now that
  ADR-009 removed it — no plan to add a second source exists today, so
  this is speculative, not a live question.

Update this file as focus shifts — it's temporary scratch context, not a
changelog.
