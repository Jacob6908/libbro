---
status: accepted
date: 2026-07-26
---

# ADR-002: Schema and RLS policies managed in the Supabase dashboard, not checked into git

## Context

The `issho` study flagged that its schema exists only in the Supabase
cloud project, never in version control — no migrations directory, no
reviewable diff for schema or RLS changes. When planning libbro, this was
explicitly named as a gap worth fixing, and the user was asked directly
whether to check in migrations (e.g. `supabase/migrations/` applied via
the Supabase CLI) or repeat `issho`'s dashboard-only pattern.

## Decision

Repeat `issho`'s pattern: schema and RLS policies are applied by hand via
the Supabase SQL editor and exist only in the live project. No migrations
directory in this repo.

## Rationale

User's explicit choice, made knowingly after the tradeoff was named
directly (not a default or an oversight).

## Consequences

- Schema changes are not diffable, not code-reviewable, and not
  reproducible from git alone. A fresh clone of this repo cannot recreate
  the database.
- The one concrete cost this already had: a missing `DELETE` grant on
  `book_genres` silently broke genre-linking on every book import for
  the entire build until a browser-driven test happened to catch it —
  exactly the kind of bug a checked-in, reviewable migration might have
  surfaced sooner (a second engineer or a diff review could have asked
  "why does this table have no delete grant").
- Mitigation in place: periodically export a schema snapshot into
  `vault/working/` as an informal, inspectable-but-not-authoritative
  reference (not yet done as of this ADR — see
  `working/open-questions.md`).

## Alternatives considered

- Checked-in SQL migrations via the Supabase CLI, applied to the project
  — the recommended option, not chosen.

## Evidence

No `supabase/` directory exists in this repo. `architecture.md`'s schema
section is reconstructed from live queries against the project, not from
any file in git.
