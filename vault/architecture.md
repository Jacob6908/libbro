# Architecture

Verified against the repo and the live Supabase project, most recently
during the 2026-07-28 audit. Schema/RLS facts were confirmed by querying
the live project directly (schema is not in git — see below) rather than
assumed from prior notes.

## Stack

Client-only SPA, no custom backend server:

- **Frontend**: Vite 7 + React 19 + TypeScript (strict) + Tailwind CSS 4 +
  react-router 8 + TanStack Query 5 + react-easy-crop (avatar cropping).
  Config mirrors the reference app `issho`'s conventions
  (`eslint.config.js`, `.prettierrc`, `tsconfig.app.json`/
  `tsconfig.node.json` project references).
- **Backend**: Supabase (Postgres + Auth), accessed directly from the
  browser via `@supabase/supabase-js` with the anon/publishable key
  (`src/supabase-client.ts`). No service-role usage anywhere in `src/`.
  See `decisions/ADR-001-supabase-as-backend.md`.
- **External data**: Google Books Volumes API, behind a
  `BookMetadataProvider` interface (see below) rather than called
  directly throughout the app. See
  `decisions/ADR-003-google-books-behind-provider-interface.md`.
- **Deployment**: unknown — no CI/CD config, no `vercel.json` or
  equivalent, no deployment docs exist in this repo. See
  `working/open-questions.md`.

## Directory structure

```
src/
  api/          bookImport.ts, bookMapping.ts — provider-agnostic import/mapping
  components/   shared UI (NavBar, AppShell, BookCoverCard, ListEntryEditor,
                 GenrePreferencePicker, GenrePreferenceModal, AvatarImage,
                 AvatarCropModal, ...)
  context/      AuthContext / AuthProvider
  hooks/        one hook per data concern (useAuth, useMyList, useRecommendations, ...)
  lib/          pure helpers (genreMapping.ts — category string -> genre slug;
                 genreColors.ts — genre id -> cycling accent color;
                 cropImage.ts — canvas crop-to-fixed-size utility)
  pages/        one component per route
  services/
    metadata/   BookMetadataProvider interface + googleBooksProvider implementation
    supabase/   thin per-table query functions (books.ts, listEntries.ts, ...)
    recommendations.ts   scoring logic, no DB-side logic
  types/database.types.ts   hand-written types mirroring the live schema
```

### Routing / layout

All authenticated routes are nested under one `RequireAuth` + `AppShell`
layout route in `src/App.tsx` (react-router's `<Outlet/>` pattern), rather
than each route wrapping its own `RequireAuth`. `AppShell` renders a
persistent `NavBar` ("libbro" home link + links to every authenticated
page + sign out, with active-link highlighting) above the routed page
content. The four auth pages (`/signin`, `/signup`, `/forgot-password`,
`/reset-password`) sit outside this layout and never show the nav bar.

## Database schema (live-verified, not in git)

**The schema and all RLS policies exist only in the Supabase dashboard —
there are no migration files in this repo.** This was a deliberate,
explicit choice (`decisions/ADR-002-dashboard-managed-schema.md`), not an
oversight. Treat the tables below as a snapshot as of this audit; verify
against the live project before relying on exact column details for
non-trivial schema work, since drift here is undetectable from git.

| Table | Purpose | Key columns |
|---|---|---|
| `profiles` | 1:1 with `auth.users`, auto-created via a `handle_new_user()` trigger on signup | `id`, `username`, `avatar_url`, `bio` |
| `genres` | Curated flat taxonomy, 24 seeded rows, app-read-only | `id`, `name`, `slug` |
| `category_aliases` | Caches Google Books' raw category strings -> `genre_id`; app can insert new unmapped entries, only a human can correct a mapping (no UPDATE grant) | `raw_category` (PK), `genre_id` |
| `profile_genre_preferences` | Explicit genre preferences | `profile_id`, `genre_id`, `weight` (1-3 check constraint, default 2) |
| `books` | Durable cache of imported Google Books volumes, keyed by `(provider, external_id)` so a future metadata source swap doesn't require a schema change | `id`, `provider`, `external_id`, `title`, `authors[]`, `raw_categories[]`, `fetched_at` (TTL clock), `search_vector` (generated tsvector) |
| `book_genres` | Normalized many-to-many replacing Google's freeform categories | `book_id`, `genre_id` |
| `list_entries` | Per-user book tracking, one row per (user, book) — no series/season split | `user_id`, `book_id`, `status` (enum), `percent_complete`, `rating` (1-5), `review`, `started_at`, `finished_at` |

`reading_status` enum: `want_to_read | reading | completed | dropped |
on_hold`.

### RLS posture (verified live, not just intended)

- `list_entries`, `profile_genre_preferences`: fully private, every
  operation scoped to `auth.uid()`. No public-read path.
- `profiles`: open SELECT to any authenticated user; owner-only
  INSERT/UPDATE.
- `books`, `book_genres`, `category_aliases`, `genres`: shared cache data,
  open SELECT to any authenticated user. `books`/`book_genres` also allow
  authenticated INSERT/UPDATE (no service-role backend exists to gate
  writes through — same trust model the reference app `issho` uses for
  its equivalent table). `genres` has no app-write path at all (seeded
  once, corrected only via direct SQL). `category_aliases` allows INSERT
  only, not UPDATE, so a user can add a newly-seen unmapped category but
  can't silently overwrite an existing mapping.
- A real bug was found and fixed during the build: `book_genres` was
  missing its `DELETE` grant, which silently broke genre-linking on every
  import until caught by browser-driven testing (not by typecheck/lint).
  Worth remembering if a future schema change on a table reintroduces a
  missing grant — Postgres/PostgREST fails these as "permission denied"
  with no client-side type error to catch it.

### Storage (avatars)

A Supabase Storage bucket `avatars` (public-read, 5MB file size limit,
JPEG/PNG/WebP/GIF only — enforced both client-side before crop and by the
bucket's own limits) holds one object per user at `{userId}/avatar.{ext}`,
uploaded with `upsert: true` so re-uploading replaces the same object
rather than accumulating old files. RLS on `storage.objects` (not
`storage.buckets` — the client SDK's `getBucket()`/bucket-listing calls
aren't usable from the app and aren't needed, since the app always
addresses the bucket by its known name) scopes INSERT/UPDATE to a path
whose first folder segment matches `auth.uid()` via
`storage.foldername(name)`; SELECT is open to anyone (avatar images need
to be publicly viewable). Verified live: upload, public read, and
per-user path scoping all confirmed working directly against the project
during this audit.

## Auth flow

Single Supabase client (`src/supabase-client.ts`) using
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. `AuthContext` +
`AuthProvider` (`src/context/`) hold `user` and an `isLoading` flag,
hydrated via `supabase.auth.getSession()` + `onAuthStateChange`, consumed
via `useAuth()`. `RequireAuth` (`src/components/RequireAuth.tsx`) gates
every route except the four auth pages, and explicitly waits for
`isLoading` to resolve before redirecting — an early version redirected
prematurely on every full page load because it treated "session not yet
checked" the same as "logged out." Methods used: `signUp`,
`signInWithPassword`, `signOut`, `resetPasswordForEmail`, `updateUser`
(password), `resend` (confirmation email). No OAuth providers.

Email confirmation is currently **disabled** on the Supabase project (a
dashboard setting, not code) — signup returns a live session immediately.

## Book metadata integration

`src/services/metadata/types.ts` defines `BookMetadataProvider`
(`search()`, `getById()`); `googleBooksProvider.ts` is the only file that
knows Google Books' actual response shape. `api/bookMapping.ts` maps a
provider `BookDetail` to a `books` row, stripping embedded HTML from
descriptions and resolving categories to genre ids (static regex table in
`lib/genreMapping.ts` first, `category_aliases` cache second).
`api/bookImport.ts::importBookFromProvider` is the write-through cache:
return the cached row if `fetched_at` is within a 14-day TTL, otherwise
fetch/map/upsert. Search (`BookSearch.tsx`) merges a local Postgres
full-text query against `books.search_vector` with a live, debounced
query against the provider — local results are instant, remote-only
results get imported on click, not on every keystroke.

## Avatar upload

Selecting a photo (`Profile.tsx`) opens `AvatarCropModal`
(react-easy-crop) before anything is uploaded — drag to reposition, zoom
slider, circular crop mask matching the display shape. On confirm,
`lib/cropImage.ts` renders the selected region onto a canvas and exports
a fixed 512×512 JPEG (quality 0.92) regardless of the source photo's size
or aspect ratio, so every stored avatar is uniform. That file is what
gets uploaded to the `avatars` bucket (see Storage above), not the
original. Source-file validation (type + a generous 20MB size cap, since
raw phone photos can exceed the old 5MB limit) happens before the crop
step; the crop output itself is always small regardless.

## Genre preference editing

Selecting genres (`Profile.tsx` -> `GenrePreferencePicker.tsx`) opens
`GenrePreferenceModal.tsx`: all 24 genres float as a gently swaying,
tap-to-highlight paragraph (per-genre accent color cycling through 8
hues via `lib/genreColors.ts`, so every 8th genre alphabetically repeats
a color — a known, accepted limit of the palette, not a bug). Selection
is a local draft (a `Set<number>` of genre ids) until "Save preferences"
diffs it against the fetched preferences and issues the minimum set of
upsert/delete calls; "Skip for now" discards the draft. See
`specs/genre-preferences.md` for full behavior and
`working/open-questions.md` for the weight question below.

**`weight` is no longer user-adjustable.** The picker only expresses
selected/not-selected; every new explicit preference is written with a
fixed `weight = 2` (`EXPLICIT_WEIGHT` in `useGenrePreferences.ts`, which
matches the column's own DB default — no schema change was needed for
this). As of this audit the live table still has 2 rows with `weight = 3`, left
over from before this change. The save diff only acts on genres whose
selected/not-selected state actually changed: an already-selected genre
left untouched in the modal keeps its stored weight (3, in those 2 rows)
indefinitely, but deselecting it and later reselecting it rewrites it as
`weight = 2` via upsert — so historical variance decays away over time
as users touch their preferences again, rather than being migrated all
at once.

## Recommendation engine

`src/services/recommendations.ts` — plain TypeScript, no scoring logic in
Postgres (queries are simple selects only). `getRecommendationsForUser`
combines explicit `profile_genre_preferences` weights (×2 — in practice
now almost always a flat 2, per above, since the picker no longer
exposes a range) with inferred per-genre affinity from the user's own
ratings, centered on the 1-5 scale's midpoint (×1); falls back to
popularity ordering (`average_rating`/`ratings_count`) for a cold-start
user with no signal. `getSimilarBooks` ranks by shared-genre count and
author overlap, no user context. Content-based only — no collaborative
filtering, since there's no social graph in this version
(`decisions/ADR-004`).

## Security boundaries

RLS (see above) is the only access-control layer — there is no
application-level authorization beyond it, since there's no custom
server. The anon/publishable key is safe to expose client-side by design;
correctness depends entirely on the RLS policies matching intent, which
is why the missing-grant bug above was a genuine risk, not cosmetic.
