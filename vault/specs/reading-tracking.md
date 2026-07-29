---
status: implemented
last-reviewed: 2026-07-29
---

# Reading tracking

## Goal

Let a signed-in user track their reading status, progress, rating, and
private notes for any book, one row per (user, book) — no separate
handling for standalone books vs. series volumes (see
`decisions/ADR-005-defer-series-and-volumes.md`).

## User behavior

From a book's detail page (`/books/:bookId`), the "Your tracking" panel
lets the user:

- Pick a status: want to read / reading / completed / on hold / dropped.
- Drag a 0-100% progress slider. If the book has a known page count, a
  derived "~page N of M" label is shown next to the percentage (pure
  display computation from `percent_complete` and `books.page_count`,
  not a stored value).
- Pick a 1-5 star rating (click the same star again to clear it).
- Write a free-text private note.
- Save (creates or updates the `list_entries` row) or remove it entirely.

The saved values repopulate the form on reload. Removing an entry resets
the form to its defaults (want_to_read / 0% / no rating / empty note)
rather than leaving stale values visible.

## Requirements

- One `list_entries` row per `(user_id, book_id)` — enforced by a unique
  constraint, upserted on save.
- `started_at` is set to the current date the first time status becomes
  `reading` (not overwritten on subsequent saves). `finished_at` is set
  every time status becomes `completed`.
- Only the owning user can read or write their own `list_entries` rows
  (RLS-enforced, verified — see `architecture.md`).

## Acceptance criteria

- Setting status/percent/rating/note and reloading the page shows the
  same values (verified via browser-driven test during the build).
- Removing an entry and reloading shows the default, empty form.
- A second user cannot see or modify another user's `list_entries` row
  (verified directly against the live project's RLS during the build).

## Permissions and security

Fully private per user via RLS; no public or shared read path exists for
this table.

## Edge cases

- Marking a book `completed` sets `finished_at` even if the user never
  set status to `reading` first (no state-machine enforcement between
  statuses — any transition is allowed).
- No numeric page/time tracking exists for audiobooks or ebooks
  specifically — the same 0-100% scale covers all formats.

## Out of scope

- Format-aware progress units (page number, audiobook timestamp).
- Series-level aggregate progress (would be computed from individual
  `list_entries` rows once series support exists — not built yet).

## Implementation status

Implemented. `src/components/ListEntryEditor.tsx`,
`src/hooks/useListEntry.ts`, `src/services/supabase/listEntries.ts`.

## Open questions

None currently — see `working/open-questions.md` for anything that
surfaces later.
