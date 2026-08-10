# Vault Index

Entry point for `libbro`'s knowledge base. Documents durable project
knowledge that would be hard or risky to rediscover from the code alone —
it does not duplicate the codebase or log every action taken here.

**State as of this audit (2026-08-09, later pass):** v1 through the
bookshelves/flat-shelves rework (see this section's prior text, preserved
in git history) is merged to `main` on GitHub (`Jacob6908/libbro`,
public) — that whole arc landed via PR #8. Since then, three more
changes shipped as **separate feature branches merged directly into
`main`**, not through the old `production` branch — a workflow change
worth knowing about, see `runbooks/git-workflow.md`:

- **PR #10 (`login_updates`)** — a client-side auth/session hardening
  pass (env validation, explicit client options, hardened session
  hydration, redirect-when-authenticated on `/signin`/`/signup`, a
  `/reset-password` session guard, stronger password rules, Chrome-
  credential-manager workarounds) plus a visual redesign of `/signin`
  and `/signup`. New this audit: `specs/auth.md` documents the result in
  full — auth had grown enough non-obvious behavior that folding it into
  `architecture.md` alone was no longer enough (see that document's
  history for why it used to be handled that way).
- **PR #11 (`small_tweaks`)** — a universal cursor-style CSS rule and a
  couple of `ListEntryModal` bug fixes.
- **PR #12 (`grainy_scroll`, open, not yet merged)** — sharper book cover
  images and lazy/async decoding to reduce scroll jank.

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
- [`specs/`](specs/) — `book-metadata-import.md`, `reading-tracking.md`,
  `recommendations.md`, `avatar-upload.md`, `genre-preferences.md`,
  `bookshelves.md`, `auth.md` (new this audit). The home/nav views are
  still covered in `architecture.md` only, since they remain
  straightforward CRUD/UI — auth used to be handled the same way, but
  grew enough non-obvious behavior (browser-credential-manager
  workarounds, redirect guards, a visual-consistency gap between auth
  pages) to warrant its own spec.
- [`decisions/`](decisions/) — eight ADRs: the five major choices made
  building v1 (Supabase as the whole backend, dashboard-managed schema,
  Google Books behind a provider interface, content-based-only
  recommendations, deferring series/volume support),
  `ADR-006-genre-palette-as-primary-theme.md` for the app's first
  color/visual-theme system, and the two newest, same-day ADRs covering
  bookshelves: `ADR-007-custom-bookshelves-and-profile-visibility.md`
  (**superseded** in part — kept for the historical record, see its own
  header) introduced shelves and made profiles viewable by other
  signed-in users; `ADR-008-flat-shelves-no-default-status-shelves.md`
  (current) replaced its default/custom shelf model with a flat one.
  Together they narrow (but don't remove) the "no social features"
  non-goal. (The nav bar, avatar upload, genre-preference modal,
  bookshelf-grid search redesign, search relevance ranking, categorized
  recommendations, and folding `/my-list` into `/profile` were all
  routine feature additions/refinements following existing decisions,
  not new architectural tradeoffs — documented in `architecture.md`/
  `specs/` instead of new ADRs. Whether to keep
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
