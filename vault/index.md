# Vault Index

Entry point for `libbro`'s knowledge base. Documents durable project
knowledge that would be hard or risky to rediscover from the code alone —
it does not duplicate the codebase or log every action taken here.

**State as of this audit (2026-08-18):** v1 through the bookshelves/
flat-shelves rework is merged to `main` on GitHub (`Jacob6908/libbro`,
public) — that whole arc landed via PR #8. Since then, **five more
changes have shipped as separate feature branches merged directly into
`main`** with real merge commits (verified via `gh pr list`) — not
through the old `production` branch, which has been untouched since
PR #8. See `runbooks/git-workflow.md`.

- **PR #10 (`login_updates`)** — a client-side auth/session hardening
  pass plus a visual redesign of `/signin`/`/signup`. See `specs/auth.md`.
- **PR #11 (`small_tweaks`)** — a universal cursor-style CSS rule and a
  couple of `ListEntryModal` bug fixes.
- **PR #12 (`grainy_scroll`)** — merged 2026-08-10. Sharper book cover
  images (`zoom=2` Google Books URL variant) and lazy/async decoding to
  reduce scroll jank.
- **PR #13 (`better_covers`)** — merged 2026-08-17. Extended the
  `/signin`/`/signup` visual redesign to `/forgot-password` and
  `/reset-password` (the previously-open visual-inconsistency gap is now
  closed); added a cover-image runtime fallback
  (`hooks/useCoverImageSrc.ts` + `lib/googleBooksCoverUrl.ts`) that
  detects a broken/over-cropped cover via its rendered aspect ratio and
  retries at `zoom=1` — **but only wired up on `BookDetail.tsx`**;
  `BookShelfCover.tsx`, `BookCoverCard.tsx`, and `SimilarBooks.tsx` all
  call the same hook without enabling it, so the search grid and other
  list contexts don't get the same protection — see
  `working/open-questions.md`.
- **PR #14 (`issho-style-search`)** — merged 2026-08-18. Supersedes
  `decisions/ADR-003-google-books-behind-provider-interface.md` (see
  `decisions/ADR-009-remove-book-metadata-provider-abstraction.md`,
  **new this audit**): removes the `BookMetadataProvider` interface so
  search/import code consumes Google Books' vendor shape directly,
  matching how the reference app `issho` handles `AniListMedia`. Bundled
  with an independent fix to the cover-URL enhancement logic (only
  requests `zoom=2` when Google's own `edge=curl` marker is present on
  the original thumbnail URL — verified empirically that volumes without
  it return a degenerate cropped asset at `zoom=2`, not a bigger cover).
  This fix and PR #13's `validateAspectRatio` fallback address the same
  underlying bug through different, uncoordinated mechanisms — see
  `working/open-questions.md`.

See `working/current-focus.md` for the fuller breakdown, `decisions/` and
`specs/` for everything from PR #8 and earlier, `working/issho-study.md`
for the read-only study of the reference app `issho` that informed the
original architectural choices, and `runbooks/git-workflow.md` for the
current PR workflow (and the older `production`-branch pattern it
replaced).

## Documents

- [`product.md`](product.md) — what libbro is, primary user journeys,
  explicit non-goals for this version.
- [`architecture.md`](architecture.md) — stack, directory layout,
  database schema (live-verified — **not in git**, see ADR-002), auth
  flow, routing/layout, book-metadata integration, avatar upload,
  bookshelves, recommendation engine, security boundaries.
- [`quality.md`](quality.md) — install/dev/lint/typecheck/build commands,
  each re-verified during this audit; the new `/quality-check` skill for
  background browser-driven verification; no automated test suite exists
  (deliberate).
- [`specs/`](specs/) — `book-metadata-import.md` (rewritten this audit
  for ADR-009 — no more provider abstraction), `reading-tracking.md`,
  `recommendations.md`, `avatar-upload.md`, `genre-preferences.md`,
  `bookshelves.md`, `auth.md` (updated this audit — the `/forgot-
  password`/`/reset-password` redesign gap it documented is now closed).
- [`decisions/`](decisions/) — nine ADRs. The five major choices made
  building v1 (Supabase as the whole backend, dashboard-managed schema,
  Google Books behind a provider interface — **superseded**, see below,
  content-based-only recommendations, deferring series/volume support),
  `ADR-006-genre-palette-as-primary-theme.md` for the app's first
  color/visual-theme system, the two same-day ADRs covering bookshelves
  (`ADR-007-custom-bookshelves-and-profile-visibility.md`, **superseded**
  in part; `ADR-008-flat-shelves-no-default-status-shelves.md`, current
  — together they narrow but don't remove the "no social features"
  non-goal), and **`ADR-009-remove-book-metadata-provider-abstraction.md`
  (new this audit, current)** — supersedes `ADR-003`, removing the
  `BookMetadataProvider` interface in favor of consuming Google Books'
  vendor shape directly. (The nav bar, avatar upload, genre-preference
  modal, bookshelf-grid search redesign, search relevance ranking,
  categorized recommendations, and folding `/my-list` into `/profile`
  were all routine feature additions/refinements following existing
  decisions, not new architectural tradeoffs — documented in
  `architecture.md`/`specs/` instead of new ADRs. Whether to keep
  `profile_genre_preferences.weight` long-term was discussed but not
  decided — see `working/open-questions.md`, not an ADR, since nothing
  was actually settled there.)
- [`runbooks/git-workflow.md`](runbooks/git-workflow.md) — the current
  feature-branch → `main` PR flow, plus the older `production`-branch
  pattern it replaced (verified against `gh pr list`, not assumed).
- [`working/current-focus.md`](working/current-focus.md) — temporary,
  current project context.
- [`working/open-questions.md`](working/open-questions.md) — unresolved
  questions surfaced during vault audits.
- [`working/issho-study.md`](working/issho-study.md) — read-only research
  notes on the reference app; scratch context, not a spec.

## Authoritative vs. working

`architecture.md`, `product.md`, `quality.md`, `specs/`, and `decisions/`
are durable — they should stay accurate as the project evolves and are
the authoritative record once populated. Everything under `working/` is
temporary scratch context and should not be treated as project history.

**One durable-knowledge caveat that applies everywhere in this vault**:
the database schema and RLS policies live only in the Supabase dashboard,
not in git (ADR-002). Every schema fact in `architecture.md` was obtained
by querying the live project directly during this audit, not by reading
a file — it can drift silently. Re-verify against the live project before
trusting exact column details for non-trivial schema work.

## For future sessions

Read this file before non-trivial work, then open only the specific
documents relevant to the task. Treat the implementation (and, for
schema questions, the live Supabase project) as ground truth over any
stale vault doc, and surface — rather than silently resolve — any
conflict between what the vault says and what the code or live project
does. Re-run `/vault-audit` after notable changes.
