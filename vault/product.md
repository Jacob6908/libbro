# Product

## What libbro is

A personal book-tracking web app — search for books, track reading
progress, rate/review, and get recommendations. Built as a sibling
application to `issho` (an anime tracker), reusing its architectural shape
(Supabase-backed SPA) where it fit and deliberately diverging where books
differ from anime (see `working/issho-study.md` for the comparison that
shaped these decisions, and `decisions/` for the specific choices made).

**Unknown / not established anywhere in the repo:** target audience beyond
"the user building this," pricing/monetization, whether this is meant to
be single-user or multi-user at scale, and whether a public launch is
planned. No README, marketing copy, or product brief exists to answer
these — treat as open until stated.

## Primary user journeys (verified against `src/pages/`)

1. **Sign up / sign in** — email + password only, no OAuth
   (`SignUp.tsx`, `SignIn.tsx`, `ForgotPassword.tsx`,
   `ResetPassword.tsx`; see `specs/auth.md` for validation rules,
   redirect behavior, and the reset-password session guard).
2. **Search and add a book** — search merges a local Postgres cache with
   live Google Books results, ranked by relevance (title/author match
   quality, not just which source returned it first) and shown as a
   five-per-row bookshelf grid of covers; selecting a result imports it
   into the local cache on demand (`BookSearch.tsx`,
   `components/BookShelfCover.tsx`, `api/bookImport.ts` — see
   `architecture.md`'s "Search result ranking").
3. **Track a book** — set status (want to read / reading / completed / on
   hold / dropped), a 0–100% progress slider, a 1–5 star rating, and a
   private text note, from the book's detail page (`BookDetail.tsx`,
   `components/ListEntryEditor.tsx`).
4. **Browse and organize your books** — `/profile` shows the signed-in
   user's own books as a bookshelf grid, filterable by shelf: the 5
   default shelves (want to read / reading / completed / on hold /
   dropped, auto-derived from `list_entries.status` — same tracking data
   as before, just presented as shelves) plus any number of user-created
   custom shelves with editable titles, which can hold any book
   (tracked or not) added from that book's detail page. See
   `specs/bookshelves.md`.
5. **View another user's profile** — `/u/:username` shows the same
   shelf-grid presentation for any other signed-in user, read-only (no
   edit controls, and never their private review notes). See
   `specs/bookshelves.md`.
6. **Edit profile** — username, bio, and an avatar photo (upload + crop
   to a fixed circular size, Instagram-style — `components/
   AvatarCropModal.tsx`), plus genre preferences across a curated
   24-genre taxonomy, picked in a floating tap-to-highlight modal
   (`components/GenrePreferencePicker.tsx`,
   `components/GenrePreferenceModal.tsx`) — reached via an "Edit
   profile" button on `/profile` (`components/ProfileEditModal.tsx`),
   separate from the shelf-browsing view itself.
7. **Get recommendations** — a Netflix-style feed of named category rows
   (e.g. "Horror for you", "Because you loved X", "Longer than you'd
   usually read") built from genre preferences and inferred taste from
   ratings. `/recommendations` shows a random 3-4 rows that change on
   every visit; `/recommendations/all` browses every category. Plus a
   per-book "similar to this" widget (`components/SimilarBooks.tsx`).
   See `specs/recommendations.md`.
7. **Home dashboard** — currently-reading shelf + a short recommendations
   preview drawn from the same category feed (`Home.tsx`).

## Explicit non-goals for this version

Established from `decisions/` and direct build decisions, not guessed:

- **No social features** — no friends/follows, activity feed, comments,
  or votes, even though the reference app (`issho`) had these built out.
  See `decisions/ADR-004-content-based-recommendations-only.md`.
- **No notifications, no admin/moderation.**
- **No series/volume grouping** — every tracked book is a standalone row;
  deferred to a future version. See
  `decisions/ADR-005-defer-series-and-volumes.md`.
- **No format-aware progress** — a single 0–100% value covers physical,
  ebook, and audiobook alike; no separate page/time units yet.
- **No automated test suite** — deferred deliberately for this version,
  same as the reference app.

## Constraints established during the build

- Schema and RLS policies live only in the Supabase dashboard, not in git
  — a deliberate, accepted tradeoff (see
  `decisions/ADR-002-dashboard-managed-schema.md`). Anyone changing the
  schema must do so directly against the live project; there is no
  migration file to review or replay.
- Google Books' unauthenticated search quota (~1000/day) applies unless a
  restricted API key is provisioned; a key is expected to be configured
  via `VITE_GOOGLE_BOOKS_API_KEY` (see `vault/quality.md` for how env vars
  are supplied — values are never stored in the vault).
