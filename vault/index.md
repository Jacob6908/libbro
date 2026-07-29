# Vault Index

Entry point for `libbro`'s knowledge base. Documents durable project
knowledge that would be hard or risky to rediscover from the code alone —
it does not duplicate the codebase or log every action taken here.

**State as of this audit (2026-07-29):** v1 is built — auth, book search
via Google Books, per-book reading tracking, genre-preference-based
recommendations, and a home dashboard/list view. See `working/issho-study.md`
for the read-only study of the reference app `issho` that informed these
choices, and `decisions/` for the specific tradeoffs made.

## Documents

- [`product.md`](product.md) — what libbro is, primary user journeys,
  explicit non-goals for this version.
- [`architecture.md`](architecture.md) — stack, directory layout,
  database schema (live-verified — **not in git**, see ADR-002), auth
  flow, book-metadata integration, recommendation engine, security
  boundaries.
- [`quality.md`](quality.md) — install/dev/lint/typecheck/build commands,
  each verified during this audit; no test suite exists (deliberate).
- [`specs/`](specs/) — `book-metadata-import.md`, `reading-tracking.md`,
  `recommendations.md`. Auth, profile editing, and the home/list views
  are covered in `architecture.md` rather than duplicated into specs,
  since they're straightforward CRUD without much non-obvious behavior.
- [`decisions/`](decisions/) — five ADRs covering the major choices made
  building v1: Supabase as the whole backend, dashboard-managed schema,
  Google Books behind a provider interface, content-based-only
  recommendations, and deferring series/volume support.
- `runbooks/` — not yet created. No deployment, migration, or incident
  process exists in this repo to document.
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
