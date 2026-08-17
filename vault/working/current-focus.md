# Current Focus

v1 of libbro (auth, book tracking, recommendations) and the
nav bar/avatar-upload/genre-modal/bookshelves work that followed are all
merged to `main` (through PR #8; see `decisions/` and `specs/` for each
feature, `runbooks/git-workflow.md`'s "History" section for the
`production`-branch pattern that flow used).

**Since then, three more changes shipped as separate feature branches,
each merged directly into `main`** (see `runbooks/git-workflow.md`'s
"Current pattern"):

- **PR #10 (`login_updates`)** — a client-side auth/session hardening
  pass: env-var validation at Supabase client creation, explicit auth
  client options, hardened session hydration, sign-in/sign-up redirect-
  when-already-authenticated, a session guard on `/reset-password`,
  stronger password rules (8+ chars/digit/special char), and a set of
  Chrome-credential-manager workarounds. Also redesigned `/signin` and
  `/signup`'s visual layout (no card, big wordmark, horizontal
  email/password row). See `specs/auth.md` (new this audit) for full
  behavior and `working/2026-08-09-security-updates.md` for the original
  session notes.
- **PR #11 (`small_tweaks`)** — a universal `cursor: pointer`/
  `not-allowed` CSS rule, a couple of `ListEntryModal.tsx` bugs fixed
  (page/percent inputs couldn't be cleared while typing; a shared
  TanStack Query cache key wasn't being invalidated after a status
  change), and the nav label "Your Books" → "Your Library".
- **PR #12 (`grainy_scroll`, open, not yet merged as of this audit)** —
  book cover images upgraded to Google Books' `zoom=2` URL variant
  (removes a decorative page-curl overlay, roughly doubles resolution)
  plus `loading="lazy"`/`decoding="async"` on cover `<img>`s, to reduce
  scroll jank in grids of 20+ covers.

**Known gaps surfaced by this audit, not yet resolved:**

- `/forgot-password` and `/reset-password` still use the pre-redesign
  boxed-card layout — visually inconsistent with `/signin`/`/signup`.
- Whether the PR #10-12 feature-branch-per-change pattern is the new
  permanent convention, replacing `production`, is unconfirmed.
- The Chrome-specific credential-manager workarounds in `specs/auth.md`
  haven't been checked in Safari/Firefox.

Older, still-unresolved items carried forward (unchanged since the last
audit — see `working/open-questions.md` for the reasoning behind each):

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

Update this file as focus shifts — it's temporary scratch context, not a
changelog.
