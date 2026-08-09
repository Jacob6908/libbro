---
status: accepted
date: 2026-08-09
---

# ADR-007: Custom bookshelves, and profiles become visible to other signed-in users

## Context

The user asked to make the profile page the center of the app, built
around customizable bookshelves: a profile should render "as it will
appear to other people," with shelves the owner can title and fill with
whatever books they choose, alongside the 5 shelves everyone already has
(want to read / reading / completed / on hold / dropped). This is a
product-direction shift, not a routine feature addition — it introduces a
concept (user-curated collections, decoupled from reading status) that
didn't exist before, and it makes `list_entries`-derived data readable by
other users for the first time, which `product.md`'s "no social features"
non-goal (see `decisions/ADR-004-content-based-recommendations-only.md`)
had implicitly ruled out.

Three forks were resolved directly with the user before any schema work
(via targeted questions, not assumed):

1. Should the 5 default shelves stay driven by `list_entries.status`
   (unchanged tracking mechanism), or become independent manual shelves
   like the custom ones? → **Stay auto-synced with status.**
2. Who can view a profile's shelves — any signed-in libbro user, or fully
   public/logged-out? → **Any signed-in user** (matches how `profiles`
   already worked).
3. Can a custom shelf hold a book that isn't tracked at all (no status,
   no rating)? → **Yes** — shelves are pure curation, independent of
   `list_entries`.

## Decision

- **Two new tables**: `shelves` (`id`, `profile_id`, `title`,
  `status_key` — non-null only for the 5 default shelves, `position`)
  and `shelf_books` (`shelf_id`, `book_id`, `position`, `added_at`) for
  custom-shelf membership only. Default-shelf membership is never stored
  in `shelf_books` — it's computed live by filtering the owner's
  `list_entries` by `status = shelves.status_key`, so the existing
  status-tracking flow (`ListEntryEditor`/`ListEntryModal`) is completely
  unchanged.
- **`status_key` is immutable** once set (enforced by a `before update`
  trigger, `prevent_shelf_status_key_change`) — the whole
  auto-sync-for-defaults design depends on it never drifting.
- **A new `public_reading_status` view** is the one deliberate cross-user
  read surface: `select user_id, book_id, status, percent_complete,
  rating, started_at, finished_at from list_entries` — `review` is
  excluded on purpose, since `product.md` documents it as "a private
  text note." Postgres views run with the owning role's privileges by
  default (no `security_invoker`), which is exactly why this works: it
  bypasses `list_entries`'s owner-only RLS for these 6 columns only, for
  any authenticated caller. Supabase's security advisor flags this as a
  "Security Definer View" — expected and accepted, not a bug; verified
  with `get_advisors` that nothing else new appeared alongside it.
- **New route `/u/:username`**, nested inside the existing
  `RequireAuth`+`AppShell` wrapper (signed-in users only, no new
  unauthenticated route pattern) — a read-only rendering of another
  user's shelves, powered by `usePublicProfile`.
- **Adding a book to a custom shelf** happens from that book's detail
  page (`ShelfPicker` on `BookDetail.tsx`), not from a picker built into
  the shelf/profile view itself — a deliberate v1 scope cut, reusing the
  page where a book is already open rather than building new search-and-
  add UI.

See `specs/bookshelves.md` for full behavior.

## Rationale

Direct, confirmed user choices at each fork (see the three questions
above) — visibility scope and the default/custom shelf relationship were
not assumed. The `public_reading_status` view (rather than a public RLS
policy directly on `list_entries`) was chosen specifically to preserve
the existing "review is private" guarantee from `product.md` while still
enabling the new visibility feature — a plain permissive SELECT policy on
`list_entries` can't restrict which *columns* are visible, only which
rows, so a view (or an equivalent RPC) was the only way to do both at
once.

## Consequences

- **`product.md`'s "no social features" non-goal is now narrower, not
  gone**: profiles/shelves are visible to other signed-in users, but
  there is still no follow graph, activity feed, comments, votes, or any
  other feature from that list. `ADR-004`'s recommendation-engine
  conclusion (no collaborative filtering — there's still no social
  *graph*, just visibility) is unaffected.
- `list_entries.review` remains fully private — never exposed through
  `public_reading_status` or any other new surface.
- This is the second time a new table shipped with correct RLS but a
  missing table-level `GRANT`, silently causing `403`s regardless of
  policy correctness (see `quality.md`'s "Database schema / RLS" —
  `book_genres` was the first instance, during v1). RLS narrows what a
  grantee can do; it does not substitute for the underlying SQL grant,
  and raw `create table` DDL doesn't add one automatically the way
  Supabase's dashboard table editor does.
- Shelf reordering (`reorderShelves` in `services/supabase/shelves.ts`
  and `useShelves`) exists at the service/hook layer but **is not wired
  to any UI control** as of this ADR — shelves display in a fixed
  `position` order (insertion order for custom shelves) with no way to
  reorder them yet. Not a bug, just unfinished — see
  `working/open-questions.md`.

## Alternatives considered

- Making the 5 default shelves fully manual too (decoupled from
  `status`) — rejected by the user in favor of keeping the existing
  tracking mechanism as the single source of truth for those 5.
- Fully public (logged-out) profiles — rejected; kept to the existing
  "any signed-in user" trust boundary `profiles` already used.
- A public RLS policy directly on `list_entries` instead of a view —
  rejected because RLS can't hide a single column (`review`) while
  exposing the rest; would have required either exposing `review`
  publicly (unacceptable) or a schema split, which the view avoids.

## Evidence

`public.shelves`, `public.shelf_books`, `public.public_reading_status`
(live Supabase project, not in git — see `decisions/ADR-002`);
`src/services/supabase/shelves.ts`, `src/hooks/useShelves.ts`,
`src/hooks/useShelfBooks.ts`, `src/hooks/usePublicProfile.ts`,
`src/pages/Profile.tsx`, `src/pages/PublicProfile.tsx`,
`src/components/ShelfPicker.tsx`, `src/App.tsx`'s `/u/:username` route.
