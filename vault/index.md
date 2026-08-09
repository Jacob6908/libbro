# Vault Index

Entry point for `libbro`'s knowledge base. Documents durable project
knowledge that would be hard or risky to rediscover from the code alone —
it does not duplicate the codebase or log every action taken here.

**State as of this audit (2026-08-09):** v1 (auth, book search via Google
Books, per-book reading tracking, genre-preference-based recommendations,
home dashboard/list view) is built and merged to `main` on GitHub
(`Jacob6908/libbro`, public). Since then, a persistent nav bar, real
avatar upload with cropping, a floating word-shelf genre-preference modal,
the genre palette promoted to the app's primary visual theme, a
bookshelf-grid search redesign, search relevance ranking, and
Netflix-style categorized recommendations have all shipped to
`production` (PR #4, PR #5; #6 was closed unmerged and folded directly
into `production`, confirming it remains the one working branch — see
`runbooks/git-workflow.md`, unchanged). All of that is open as **PR #7**
into `main`, not yet merged; local `main` is still 7 commits behind
`origin/main` and needs syncing per `runbooks/git-workflow.md` once PR #7
lands. Most recently, the standalone `/my-list` page was folded into
`/profile` (now a shelf-tab-based "Your Books" view with its own edit
modal), and — the biggest single change so far — **custom, user-titled
bookshelves** were added alongside the 5 existing status-based shelves,
plus a read-only `/u/:username` view of another signed-in user's
profile. This is a real product-direction shift (profiles are now
visible to other users, narrowing the "no social features" non-goal —
see `decisions/ADR-007-custom-bookshelves-and-profile-visibility.md` and
`specs/bookshelves.md`) and required new live-schema objects (`shelves`,
`shelf_books`, `public_reading_status` — see `architecture.md`), applied
directly against the live Supabase project per `decisions/ADR-002`.
Verified end-to-end (lint/typecheck/build + a background
`/quality-check` subagent's browser-driven pass, including a disposable-
account test of the new-signup shelf-seeding trigger), committed to
`production` alongside this vault reconciliation, and not yet pushed to
`origin/production` as of this line being written — check `git log`/
`git status` before assuming it's landed. See `working/issho-study.md`
for the read-only study of the reference app `issho` that informed the
original choices, `decisions/` for the specific tradeoffs made, and
`runbooks/git-workflow.md` for how changes get from the working branch
into `main` (partially automated by the `/ship` skill).

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
- [`specs/`](specs/) — `book-metadata-import.md`, `reading-tracking.md`,
  `recommendations.md`, `avatar-upload.md`, `genre-preferences.md`,
  `bookshelves.md`. Auth and the home/nav views are covered in
  `architecture.md` rather than duplicated into specs, since they're
  straightforward CRUD/UI without much non-obvious behavior.
- [`decisions/`](decisions/) — seven ADRs: the five major choices made
  building v1 (Supabase as the whole backend, dashboard-managed schema,
  Google Books behind a provider interface, content-based-only
  recommendations, deferring series/volume support),
  `ADR-006-genre-palette-as-primary-theme.md` for the app's first
  color/visual-theme system, and
  `ADR-007-custom-bookshelves-and-profile-visibility.md` for the newest
  one — custom user-curated shelves and making profiles viewable by other
  signed-in users, which narrows (but doesn't remove) the "no social
  features" non-goal. (The nav bar, avatar upload, genre-preference
  modal, bookshelf-grid search redesign, search relevance ranking,
  categorized recommendations, and folding `/my-list` into `/profile`
  were all routine feature additions/refinements following existing
  decisions, not new architectural tradeoffs — documented in
  `architecture.md`/`specs/` instead of new ADRs. Whether to keep
  `profile_genre_preferences.weight` long-term was discussed but not
  decided — see `working/open-questions.md`, not an ADR, since nothing
  was actually settled there.)
- [`runbooks/git-workflow.md`](runbooks/git-workflow.md) — the
  `production` → `main` PR flow, verified against three real merges.
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
