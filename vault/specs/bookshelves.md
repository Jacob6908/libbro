---
status: implemented
last-reviewed: 2026-08-09
---

# Bookshelves (default + custom), and viewable profiles

## Goal

Make the profile page the app's central, customizable surface: every
user gets 5 default shelves (carried over from the existing reading-
status tracking) plus unlimited custom shelves they title and fill
themselves, and any signed-in user can view another's shelves — not just
their own. See `decisions/ADR-007-custom-bookshelves-and-profile-visibility.md`
for the product/architecture tradeoffs behind this.

## User behavior

**Own profile (`/profile`)**: a shelf-tab bar (an "All" tab, the 5
default shelves, then any custom shelves, in `position` order) above a
`BookShelfCover` grid of that shelf's books.

- Default shelves show `list_entries` filtered by `status` — identical
  data/behavior to the tabs that existed before this feature, just
  reframed as shelves. Moving a book in/out still happens via the
  existing status-tracking control on `BookDetail.tsx`
  (`ListEntryEditor`/`ListEntryModal`), not from the profile page.
- "+ New shelf" creates a custom shelf (title only, starts empty).
- Selecting any shelf reveals "✎ Rename shelf" (works on both kinds) and,
  for custom shelves only, "✕ Delete shelf".
- Each book card on a custom shelf has its own "✕ Remove from shelf"
  control.
- "Preview how others see your profile →" links to `/u/{own username}`.

**Adding a book to a custom shelf**: from that book's detail page
(`BookDetail.tsx`), below the existing status-tracking control, a
`ShelfPicker` shows the user's custom shelves as toggleable pills — click
to add/remove that book from that shelf. Works regardless of whether the
book is tracked in `list_entries` at all.

**Another user's profile (`/u/:username`)**: the same shelf-tab-bar +
grid presentation, but read-only — no rename/delete/add/remove controls,
no "Edit profile" button, no genre-preference editor. Shows the same
default-shelf and custom-shelf contents the owner sees, via
`public_reading_status` (never `review`).

## Requirements

- Every profile has exactly 5 default shelves, one per `reading_status`
  value, seeded once (signup trigger for new profiles; a one-time
  backfill for the 35 that existed before this feature) and permanent —
  not user-deletable, though their `title` can be renamed.
- `shelves.status_key` is immutable once set (`before update` trigger)
  — the default/custom distinction can never drift after creation.
- A custom shelf can hold any book that exists in the shared `books`
  cache, whether or not the viewer has a `list_entries` row for it.
- Any signed-in user can read any other user's `shelves`, `shelf_books`,
  and (via the `public_reading_status` view) their status/progress/
  rating/dates — but never their `review` text, which stays scoped to
  the owner only, matching its existing "private note" status from
  before this feature.

## Acceptance criteria

Verified in-browser against the live dev server + Supabase project
during the build:

- The 5 default shelf tabs show correct per-status counts and contents
  on an existing (pre-feature) account, after the backfill.
- A brand-new signup gets the same 5 default shelves automatically (the
  `handle_new_user()` trigger path, not just the backfill) — verified
  with a disposable test account, cleaned up afterward via SQL.
- Creating a custom shelf, adding a book to it from `BookDetail.tsx`,
  and viewing it back on `/profile` round-trips correctly; deleting the
  shelf removes it (and its `shelf_books` rows, via `ON DELETE CASCADE`)
  without affecting the book's own `list_entries` row.
- Visiting `/u/:username` for another account shows their shelves and
  books correctly, with no edit affordances and no `review` text
  anywhere in the response (confirmed via the actual network request to
  `public_reading_status`, which doesn't return that column at all).

## Permissions and security

- `shelves`/`shelf_books`: open SELECT to any authenticated user;
  mutations scoped to the owner (and, for `shelves`, further scoped so
  only custom shelves can be inserted/deleted by a user at all — see
  `architecture.md`'s RLS posture section).
- `public_reading_status`: a view, not a table, deliberately excluding
  `review` — see `architecture.md`'s "Bookshelves" section for exactly
  why/how this differs from a normal RLS policy.
- Both new tables initially shipped with correct RLS but a missing
  table-level `GRANT`, which 403'd every request regardless — fixed
  during the same build session. See `quality.md`.

## Edge cases

- A shelf with `status_key` set always exists for every profile; there's
  no state where a user has fewer than 5 default shelves (short of
  direct database tampering, which RLS's delete policy already blocks
  for status-linked shelves).
- Deleting the custom shelf currently selected on `/profile` falls back
  to showing "All" cleanly, since the selected-shelf lookup simply
  returns nothing for an id that no longer exists rather than erroring.
- A book removed from every shelf and every `list_entries` row simply
  stops appearing anywhere on the profile — it isn't deleted from the
  shared `books` cache (other users/shelves may still reference it).

## Out of scope

- **Shelf reordering UI** — `reorderShelves` exists at the service/hook
  layer but nothing in `Profile.tsx` calls it yet; shelves display in a
  fixed `position` order with no drag/up-down control. See
  `working/open-questions.md`.
- **Adding a book to a shelf from the shelf/profile view itself** (e.g.
  a search-and-add picker) — v1 only supports adding from that book's
  own detail page. A deliberate scope cut, not a limitation of the data
  model.
- **Fully public (logged-out) profiles** — visibility is "any signed-in
  libbro user," not the open internet. See `decisions/ADR-007-custom-bookshelves-and-profile-visibility.md`.
- **Discovering other users to view** — there's still no user
  search/directory/follow feature (per the "no social features"
  non-goal in `product.md`); reaching `/u/:username` today means
  already knowing the username or following the "preview" link from
  your own profile.

## Implementation status

Implemented. `src/pages/Profile.tsx`, `src/pages/PublicProfile.tsx`,
`src/components/ShelfPicker.tsx`, `src/hooks/useShelves.ts`,
`src/hooks/useShelfBooks.ts`, `src/hooks/usePublicProfile.ts`,
`src/services/supabase/shelves.ts`,
`getProfileByUsername` in `src/services/supabase/profiles.ts`,
`Shelf`/`ShelfBook`/`PublicReadingStatus` in
`src/types/database.types.ts`, `/u/:username` in `src/App.tsx`. Live
schema: `shelves`, `shelf_books`, `public_reading_status` (see
`architecture.md`).

## Open questions

Whether/how to add shelf reordering UI, and whether custom-shelf book
addition should eventually move onto the shelf/profile view itself — see
`working/open-questions.md`.
