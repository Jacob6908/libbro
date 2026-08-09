---
status: implemented
last-reviewed: 2026-08-09
---

# Bookshelves (flat, user-curated), and viewable profiles

## Goal

Make the profile page the app's central, customizable surface: every
shelf is a plain, user-titled collection of books — no built-in
status-based categories — and any signed-in user can view another's
shelves, not just their own. See
`decisions/ADR-008-flat-shelves-no-default-status-shelves.md` for why
this replaced the brief default-shelf design in
`decisions/ADR-007-custom-bookshelves-and-profile-visibility.md`.

## User behavior

**Own profile (`/profile`)**: a sidebar lists every shelf the user has
(in `position` order — newest last, no reordering UI yet), next to a
grid of the selected shelf's books.

- Every new signup gets exactly one shelf, "My shelf," seeded
  automatically and pre-populated with whatever they already had
  tracked at signup time (relevant to accounts that predate this
  feature's migration; a brand-new signup just gets an empty "My
  shelf"). It is not special once created — same as any shelf the user
  makes themselves.
- "+ Add shelf" creates a new shelf (title only, starts empty).
- Selecting any shelf reveals "Rename selected shelf" and "Delete
  selected shelf" — both work identically regardless of which shelf is
  selected, including "My shelf." There is no protected/undeletable
  shelf; a user can delete every shelf they have.
- Each book card on a shelf has its own "Remove from shelf" control.
- If a shelved book also happens to have a tracked reading status (see
  below), its card shows that status as a badge — a client-side lookup
  by `book_id` against the user's own tracked list, not a data
  relationship between the two systems.
- "View public profile" links to `/u/{own username}`.

**Adding a book to a shelf**: from that book's detail page
(`BookDetail.tsx`), below the independent reading-status control, a
`ShelfPicker` shows all of the user's shelves as toggleable pills —
click to add/remove that book from that shelf. Works regardless of
whether the book has any tracked status at all.

**Reading-status tracking is a separate, unrelated feature** (unchanged
from before either bookshelves ADR): status (want to read / reading /
completed / on hold / dropped), 0–100% progress, a 1–5 star rating, and
a private note, set per book via `ListEntryEditor`/`ListEntryModal` on
`BookDetail.tsx`. See `specs/reading-tracking.md`. A book's shelf
membership and its tracked status are entirely independent — a book can
be tracked with no shelf, shelved with no tracked status, both, or
neither.

**Another user's profile (`/u/:username`)**: the same
sidebar-plus-grid presentation, read-only — no rename/delete/add/remove
controls, no "Edit profile" button, no genre-preference editor, and no
reading-status badges (status is never exposed to other users — there
is no cross-user read path for `list_entries` at all as of this spec).

## Requirements

- Every shelf has the same shape: `id`, `profile_id`, `title`,
  `position`. There is no discriminator between "default" and "custom"
  shelves — that concept was removed (`ADR-008`).
- A shelf can hold any book that exists in the shared `books` cache,
  whether or not the viewer has a `list_entries` row for it.
- Any signed-in user can read any other user's `shelves` and
  `shelf_books` (open SELECT RLS, same posture as `profiles`) — but
  never their `list_entries` (fully private, unchanged, no public read
  path exists for it).
- A profile can have zero shelves. This is a normal, reachable state
  (not an error) if a user deletes everything.

## Acceptance criteria

Verified in-browser against the live dev server + Supabase project
during the build (disposable test accounts, cleaned up afterward via
SQL):

- A brand-new signup gets exactly one shelf, "My shelf," via the
  `handle_new_user()` trigger.
- Creating, renaming, and deleting a shelf all round-trip correctly on
  `/profile`; deleting the currently-selected shelf falls back cleanly
  (no crash) to another shelf or the empty state.
- Deleting every shelf, including "My shelf," leaves the app in a
  working empty state, not an error.
- Adding a book to a shelf from `BookDetail.tsx` and viewing it back on
  `/profile` round-trips correctly; if that book also has a tracked
  status, the shelf card shows the matching status badge.
- Visiting `/u/:username` for another account shows their shelves and
  books correctly, read-only, with no reference to reading status
  anywhere in the page or its network requests.

## Permissions and security

- `shelves`/`shelf_books`: open SELECT to any authenticated user;
  INSERT/UPDATE/DELETE scoped to the owner (`shelves.profile_id =
  auth.uid()` directly, or via a subquery to the parent shelf for
  `shelf_books`) — uniform across every shelf now that there's no
  default/custom split to carve out exceptions for.
- `list_entries` (reading-status tracking) remains fully private,
  exactly as before either bookshelves ADR — no view or policy exposes
  it to other users. The `public_reading_status` view that briefly
  existed for this purpose (`ADR-007`) was deleted along with the
  default-shelf concept it served (`ADR-008`).

## Edge cases

- A shelf with no books renders an empty-state message, not a broken
  grid.
- A book removed from every shelf and every `list_entries` row simply
  stops appearing anywhere on the profile — it isn't deleted from the
  shared `books` cache (other users/shelves may still reference it).
- Renaming or deleting "My shelf" has no special confirmation or
  restriction beyond what any other shelf gets.

## Out of scope

- **Shelf reordering UI** — `reorderShelves` exists at the
  service/hook layer (`services/supabase/shelves.ts`, `useShelves`) but
  nothing in `Profile.tsx` calls it; shelves display in a fixed
  `position` order. See `working/open-questions.md`.
- **Adding a book to a shelf from the shelf/profile view itself** (e.g.
  a search-and-add picker) — still only supported from that book's own
  detail page.
- **Fully public (logged-out) profiles** — visibility is "any
  signed-in libbro user," unchanged from `ADR-007`.
- **Discovering other users to view** — no user search/directory/follow
  feature exists (per the "no social features" non-goal in
  `product.md`); reaching `/u/:username` means already knowing the
  username or following the "View public profile" link from your own
  page.
- **Any relationship between shelf membership and reading status** —
  deliberately independent; see `decisions/ADR-008-flat-shelves-no-default-status-shelves.md`.

## Implementation status

Implemented. `src/pages/Profile.tsx`, `src/pages/PublicProfile.tsx`,
`src/components/ShelfPicker.tsx`, `src/hooks/useShelves.ts`,
`src/hooks/useShelfBooks.ts`, `src/hooks/usePublicProfile.ts`,
`src/services/supabase/shelves.ts`,
`getProfileByUsername` in `src/services/supabase/profiles.ts`,
`Shelf`/`ShelfBook` in `src/types/database.types.ts`, `/u/:username` in
`src/App.tsx`. Live schema: `shelves` (no `status_key`), `shelf_books`.

## Open questions

Whether/how to add shelf reordering UI — see
`working/open-questions.md`. Whether custom-shelf book addition should
eventually move onto the shelf/profile view itself — same file.
