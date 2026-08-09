# Architecture

Verified against the repo and the live Supabase project, most recently
during the 2026-08-07 audit. Schema/RLS facts were confirmed by querying
the live project directly (schema is not in git — see below) rather than
assumed from prior notes.

## Stack

Client-only SPA, no custom backend server:

- **Frontend**: Vite 7 + React 19 + TypeScript (strict) + Tailwind CSS 4 +
  react-router 8 + TanStack Query 5 + react-easy-crop (avatar cropping).
  Config mirrors the reference app `issho`'s conventions
  (`eslint.config.js`, `.prettierrc`, `tsconfig.app.json`/
  `tsconfig.node.json` project references). Visual theme is a small set
  of Tailwind `@theme` tokens (see "Design tokens" below), not `issho`'s
  convention — this is libbro's own.
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
results get imported on click, not on every keystroke. Results render as
a five-per-row bookshelf grid (`components/BookShelfCover.tsx` +
`BookShelfCover.css`): a fixed `aspect-ratio` box with an
absolutely-positioned cover image (not a percentage-height child) keeps
every cover, and the wood-ledge shelf under it, level with its row
neighbors regardless of a book's real cover art proportions or caption
line count. The search query lives in the URL's `q` param
(`useSearchParams`, `replace: true`) rather than only local state, so
returning to `/books` via back-navigation restores the prior search.

### Search result ranking

Neither the local full-text query nor the Google Books API call returns
results in relevance order on its own — merging them used to just
concatenate local results before remote ones. `mergeResults`
(`src/hooks/useBookSearch.ts`) now scores every merged result
client-side (`scoreSearchResult`): tiered exact/prefix/whole-phrase
matching against the title (and title+subtitle) first, then a
token-coverage score (stop-word-aware, with an in-order bonus and a
small cover-art tiebreak boost) against title and author text, and sorts
the whole merged list by that score descending. A result that scores 0
(no shared token with the query at all) is still kept, just sorted to
the end — it deliberately does not filter results out, only reorders
them, so a book Google Books or Postgres considered a match (e.g. via
stemming, or a field this scorer doesn't look at) never silently
disappears.

On the remote side, `googleBooksProvider.ts`'s `search()` now issues up
to three query variants in parallel (`Promise.allSettled`) — an
`intitle:"exact phrase"` query when the input has multiple words, an
`intitle:` query per significant (non-stop-word, 3+ char) term, and the
raw query as typed — and merges/dedupes the results by external id. This
improves recall (a query that's too specific for a single `intitle:`
phrase match can still hit via the per-term variant) at the cost of
issuing more requests per search than before; see the Google Books quota
note in `decisions/ADR-003-google-books-behind-provider-interface.md`'s
consequences and `working/open-questions.md`.

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

## Design tokens

`src/index.css` defines the app's only design-token layer, via Tailwind
v4's `@theme` block (`decisions/ADR-006-genre-palette-as-primary-theme.md`):

| Token | Value | Used for |
|---|---|---|
| `--color-page` | `#f6f1e8` (warm, neutral off-white) | `body` background — the tinted page behind every screen |
| `--color-ink` | `#2b271f` | `body` text color (the app's base text color) |
| `--color-primary` | `#4c6a83` (slate) | The one repeated accent: primary buttons, links, active nav/tab state, hover states |

Tailwind auto-generates `bg-page`/`text-page`, `bg-primary`/
`text-primary`/`border-primary`, etc. from these. Bordered "card"
containers, list rows, and form inputs across every page/component get
an explicit `bg-white` so they read as white surfaces on the tinted
page rather than blending into it. Semantic colors already in use
elsewhere — yellow star ratings (`ListEntryEditor`), red error text
throughout — are deliberately outside this token system; they're
functional/conventional colors, not brand accents, and weren't
recolored. No hover or `focus-visible` styling exists on any button
anywhere in the app (true before this token system existed too).

## Genre preference editing

Selecting genres (`Profile.tsx` -> `GenrePreferencePicker.tsx`) opens
`GenrePreferenceModal.tsx`: all 24 genres float as a gently swaying,
tap-to-highlight paragraph (per-genre accent color cycling through 8
soft-pastel hues via `lib/genreColors.ts` — the same tokens described
above, at pastel depth rather than `--color-primary`'s full strength —
so every 8th genre alphabetically repeats a color — a known, accepted
limit of the palette, not a bug). Selected genres render with dark ink
text rather than white, since the pastel fills don't support white text
legibly. Selection
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
Postgres (queries are simple selects, ordered/filtered client-side).
Content-based only — no collaborative filtering, since there's no social
graph in this version (`decisions/ADR-004`).

The explicit/inferred genre-scoring core is unchanged: explicit
`profile_genre_preferences` weights (×2 — in practice now almost always
a flat 2, per the genre-preference modal above) combined with inferred
per-genre affinity from the user's own ratings, centered on the 1-5
scale's midpoint (×1). What's built on top of that core changed
(2026-08-07): recommendations are now a **Netflix-style category feed**
rather than one flat ranked list.

`getRecommendationCategories(userId, booksPerCategory)` builds up to
several named `RecommendationCategory` rows (`{ id, title, books }`),
generated in this order and de-duplicated against each other via one
shared `seenIds` set (so the same book never appears twice across rows
in a single call, and never repeats a book already in the user's
tracked list):

1. **"Top picks for you"** — the same blended top-6-genre score
   `getRecommendationsForUser` used to expose directly (still exists,
   see below), now just one row among several.
2. **One row per top-scoring genre** (up to 6), titled `"{genre} for
   you"`.
3. **Up to 3 "Because you loved {title}"** rows, one per the user's
   highest-rated tracked books (rating ≥ 4), each built from the
   existing `getSimilarBooks`.
4. **"Longer than you'd usually read"** — candidates with `page_count`
   above 1.25× the average `page_count` across the user's own tracked
   books; skipped entirely (not shown empty) if the user has no
   page-count history yet.
5. **"Highly rated overall"** — the same popularity fallback as before
   (`average_rating`/`ratings_count`), always included last if
   non-empty.

Every category (and `getRecommendationsForUser`'s own list) also now
filters to books that have `cover_image_url` set — a deliberate
design choice from this rework, not a pre-existing constraint, so a
book without cover art can never appear in a recommendation row. Each
category over-fetches (`booksPerCategory × 4` candidates) before the
shared dedup and cover-art filtering trim it down, so earlier categories
consuming the strongest candidates doesn't starve later ones.

A cold-start user (no preferences, no ratings, nothing tracked) still
gets just the single "Highly rated overall" row, same fallback
philosophy as before — categories are never padded to a fixed count.

**Pages**: `/recommendations` (`useRecommendationCategories`) picks a
random 3-4 of the generated categories once per page visit (re-rolled
on every mount, not on every re-render) and links to
`/recommendations/all`, which shows every generated category stacked,
Netflix-browse style. Both reuse `components/RecommendationShelfRow.tsx`
(a horizontally-scrolling shelf row using the same `BookShelfCover`
visual language as search). The home dashboard preview
(`Home.tsx`) now also calls `useRecommendationCategories` and flattens
the first 5 books across categories, rather than calling the flat list
hook directly.

`getSimilarBooks` (per-book "similar to this", no user context, ranked
by shared-genre count + author overlap) is unchanged in behavior beyond
also picking up the cover-art filter and the shared `scoreBookQuality`
tiebreak helper.

**`getRecommendationsForUser`/`useRecommendations` (the original flat
list) still exist and still work, but as of this audit nothing in
`src/pages/` calls them anymore** — `Home.tsx` and `Recommendations.tsx`
both moved to the category API. Whether to keep this as dead code,
delete it, or find another use for it hasn't been decided; see
`working/open-questions.md`.

## Security boundaries

RLS (see above) is the only access-control layer — there is no
application-level authorization beyond it, since there's no custom
server. The anon/publishable key is safe to expose client-side by design;
correctness depends entirely on the RLS policies matching intent, which
is why the missing-grant bug above was a genuine risk, not cosmetic.
