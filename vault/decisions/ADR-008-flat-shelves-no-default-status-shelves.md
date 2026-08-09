---
status: accepted
date: 2026-08-09
---

# ADR-008: Shelves become fully flat — no default/status-linked shelves, one seeded "My shelf" per profile

## Context

`ADR-007-custom-bookshelves-and-profile-visibility.md` shipped
custom bookshelves alongside 5 "default" shelves auto-synced with
`list_entries.status` (want to read / reading / completed / on hold /
dropped), plus a `public_reading_status` view so other users could see
those status-derived shelves. Within hours of that shipping, the user
reviewed it in the running app and asked to go further: drop the
default/status-linked shelf concept entirely. The explicit goal was
customizability — "the only choices to add to should be shelves the
user has created" — with a single auto-created "My shelf" as a
starting-point template, not a special or permanent category.

Two forks were resolved directly with the user before touching schema:

1. What happens to reading-status tracking (status/progress/rating/
   notes)? → **Keep it, fully decoupled from shelves** — it remains
   exactly as it worked before ADR-007, via `list_entries` and
   `ListEntryEditor`/`ListEntryModal`, now purely personal per-book
   metadata with no relationship to shelving at all.
2. Should "My shelf" be a real, ordinary shelf (backed by actual
   `shelf_books` rows), replacing the synthetic "show everything
   tracked" pseudo-tab that existed briefly in between ADR-007 and this
   ADR? → **Yes** — a real shelf, seeded once at signup, renamable and
   deletable like any shelf a user creates themselves.

## Decision

- **`shelves.status_key` is dropped** (column, its partial unique index,
  and its `before update` immutability trigger all removed) — every
  shelf is now the same shape, with no default/custom distinction at the
  schema level.
- **`handle_new_user()`** now seeds exactly one shelf, titled "My
  shelf," instead of 5 status-linked ones. Existing profiles were
  migrated the same way: one "My shelf" per profile, backfilled with
  `shelf_books` rows for every book that profile already had in
  `list_entries` at migration time (so nothing appeared to vanish for
  existing users), then the 5 old status-linked shelf rows were deleted.
- **RLS simplified accordingly** — `shelves` insert/delete policies no
  longer carry a `status_key IS NULL` condition; every shelf follows the
  same `profile_id = auth.uid()` ownership check for every operation.
  There is no floor on shelf count anymore — a user can delete every
  shelf they have, including "My shelf," down to zero.
- **`public_reading_status` view and `getPublicReadingStatusForUser`
  deleted** — they existed solely to let other users see status-derived
  default-shelf contents, which no longer exist. `/u/:username` now only
  ever shows shelf contents (via the same open `shelves`/`shelf_books`
  RLS as before), never anyone's reading status. `review` was already
  excluded from that view and is unaffected either way — it was never
  reachable outside `list_entries`'s owner-only RLS to begin with, and
  still isn't.
- **Reading-status tracking is unchanged and untouched** —
  `list_entries`, `ListEntryEditor`, `ListEntryModal`, `useListEntry`,
  `useMyList` all work exactly as before this ADR and before ADR-007.
  It's simply no longer connected to shelf membership in any way; a book
  shown on a shelf now shows a status badge only as a client-side lookup
  (`Profile.tsx` cross-references a shelf's books against the user's own
  `list_entries` by `book_id`) purely for visual continuity, not because
  the two systems are linked at the data level.

## Rationale

Direct, confirmed user choices (see the two forks above), made within
the same session that shipped ADR-007 after seeing it running — a fast
iteration correcting scope, not a change nobody asked for. Keeping
tracking decoupled avoids conflating two genuinely different concepts
(personal reading progress vs. curated public-facing collections) that
ADR-007's default-shelf design had started to blur together.

## Consequences

- The `shelves` schema is now much simpler — one shape, no nullable
  discriminator column, no immutability trigger to reason about.
- `specs/bookshelves.md` was rewritten (not just amended) to describe
  the current, flat model — see that file for full behavior.
- Shelf reordering is still unwired to any UI control (unchanged gap
  from ADR-007 — see `working/open-questions.md`), now simpler to
  eventually add since there's no default/custom split to account for.
- A profile can now have zero shelves (if a user deletes all of them,
  including "My shelf"). The UI handles this as an empty state, not an
  error — see `specs/bookshelves.md`.
- This is the app's second live-schema iteration on the same table in
  one day. `decisions/ADR-002-dashboard-managed-schema.md`'s accepted
  risk (schema changes aren't diffable/reviewable from git) applies here
  too — there is no migration file recording this evolution, only this
  ADR and the live project itself.

## Alternatives considered

- Keeping the synthetic "show everything tracked" pseudo-tab as "My
  shelf" instead of a real shelf — rejected; the user wanted it to
  behave like an ordinary, addressable shelf (rename/delete/manual
  membership), not a computed view over `list_entries`.
- Protecting "My shelf" from deletion (always keep at least one shelf)
  — rejected; the user explicitly wanted it to be unprotected, matching
  "the only shelf that should come default," not "the only shelf that
  must always exist."
- Folding status/progress/rating into shelf membership itself (e.g. a
  per-`shelf_books` status column) — rejected in favor of keeping
  tracking fully independent and unchanged from how it worked before
  ADR-007.

## Evidence

Live Supabase project migrations applied 2026-08-09 (same day as
ADR-007): `seed_my_shelf_and_backfill`, `drop_status_linked_shelves`,
`drop_shelves_status_key_column`, `seed_single_myshelf_on_signup`,
`drop_public_reading_status_view`. `src/pages/Profile.tsx`,
`src/pages/PublicProfile.tsx`, `src/components/ShelfPicker.tsx`,
`src/types/database.types.ts` (`Shelf` no longer has `status_key`;
`PublicReadingStatus` removed), `src/services/supabase/shelves.ts`
(`getPublicReadingStatusForUser` removed).
