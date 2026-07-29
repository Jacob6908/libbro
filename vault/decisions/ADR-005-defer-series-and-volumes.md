---
status: accepted
date: 2026-07-26
---

# ADR-005: Series/volume modeling deferred entirely; every book is standalone in this version

## Context

`issho`'s study flagged its franchise/season modeling as flat and
denormalized (a `franchise_key` copied onto every row, resolved by
walking AniList's sequel-graph) rather than a real relational table, and
recommended a proper `series` table for books since series/volume
numbering is far more stable and known upfront than anime's sequel-graph
problem. Initial planning included a real `series` table with
`series_id`/`series_position` on `books`. When it came time to decide
whether the manual "assign this book to a series + volume number" UI
(needed because Google Books doesn't reliably expose series data) would
ship in this version, the user chose to defer it.

## Decision

No `series` table, no `series_id`/`series_position` columns, no series
detail page in this version. Every tracked book is a standalone row.

## Rationale

User's explicit choice: rather than ship a `series` table with no UI to
populate it (dead schema), cut it entirely and add it as a real, usable
feature in a later version.

## Consequences

- `issho`'s specific mistake — two parallel tracking tables
  (season-level and franchise-level) that were never reconciled — is
  structurally avoided for now, since there's only one tracking
  granularity at all.
- Adding series support later is a schema addition
  (`decisions/ADR-002` means this happens by hand in the dashboard, not
  via a migration), plus new UI for series assignment and a series detail
  page. Not yet scheduled.

## Alternatives considered

- Ship the `series` table now with UI deferred — rejected as
  "nothing to build for" dead schema.
- Ship both the table and the manual assignment UI in this version — the
  original plan, but cut to keep this version's scope smaller.

## Evidence

No `series` table exists in the live schema (see `architecture.md`); no
`/series/*` route exists in `src/App.tsx`.
