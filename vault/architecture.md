# Architecture

Verified against the repo most recently during the 2026-08-18 audit
(source-level re-check of the auth pages, book-metadata integration, and
cover-image handling below). Schema/RLS facts are carried forward from
the 2026-08-07 live-project query, not re-queried this pass — see below
for how to re-verify those before relying on exact column details.

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
- **External data**: Google Books Volumes API, called directly — no
  provider-abstraction interface. `decisions/
  ADR-003-google-books-behind-provider-interface.md` originally put one
  in; `decisions/ADR-009-remove-book-metadata-provider-abstraction.md`
  (2026-08-18) removed it. See "Book metadata integration" below.
- **Deployment**: unknown — no CI/CD config, no `vercel.json` or
  equivalent, no deployment docs exist in this repo. See
  `working/open-questions.md`.

## Directory structure

```
src/
  api/          bookImport.ts, bookMapping.ts — Google Books-specific
                 import/mapping (no provider abstraction, see ADR-009)
  components/   shared UI (NavBar, AppShell, BookCoverCard, ListEntryEditor,
                 ListEntryModal, ShelfPicker, ProfileEditModal,
                 GenrePreferencePicker, GenrePreferenceModal, AvatarImage,
                 AvatarCropModal, ...)
  context/      AuthContext / AuthProvider
  hooks/        one hook per data concern (useAuth, useMyList, useShelves,
                 useShelfBooks, usePublicProfile, useRecommendations, ...);
                 useCoverImageSrc.ts (added PR #13) is presentational, not
                 data-fetching — see "Cover-image runtime fallback" below
  lib/          pure helpers (genreMapping.ts — category string -> genre slug;
                 genreColors.ts — genre id -> cycling accent color;
                 statusColors.ts — reading-status id -> color/label, shared by
                 the tracking modal and the shelf grid;
                 cropImage.ts — canvas crop-to-fixed-size utility;
                 googleBooksCoverUrl.ts — zoom=1 fallback URL for a broken
                 cover, added PR #13)
  pages/        one component per route (Profile.tsx = own, editable;
                 PublicProfile.tsx = another user's, read-only)
  services/
    metadata/   googleBooksApi.ts — search/fetch functions returning
                 Google Books' own response shape directly (no interface,
                 see ADR-009; renamed from googleBooksProvider.ts)
    supabase/   thin per-table query functions (books.ts, listEntries.ts,
                 shelves.ts, ...)
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
`/u/:username` (another user's read-only profile, see "Bookshelves"
below) is nested in the same authenticated layout as everything else —
viewing another profile still requires being signed in, matching the
"any signed-in user" visibility decision in
`decisions/ADR-007-custom-bookshelves-and-profile-visibility.md`, not a
new unauthenticated route pattern.

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
| `shelves` | One row per shelf — flat, no default/custom distinction, see "Bookshelves" below | `id`, `profile_id`, `title`, `position` |
| `shelf_books` | Shelf membership | `shelf_id`, `book_id`, `position`, `added_at` |

`reading_status` enum: `want_to_read | reading | completed | dropped |
on_hold`. Used only by `list_entries` (personal reading-status tracking,
see `specs/reading-tracking.md`) — `shelves` has no relationship to it.

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
- `shelves`, `shelf_books`: open SELECT to any authenticated user (same
  posture as `profiles` — shelves are meant to be seen by other users).
  `shelves` INSERT/UPDATE/DELETE all just require `profile_id =
  auth.uid()` — uniform across every shelf, since there's no default/
  custom distinction to carve exceptions for (see "Bookshelves" below).
  `shelf_books` INSERT/UPDATE/DELETE require the caller to own the
  parent shelf (checked via a subquery to `shelves`). See
  `decisions/ADR-008-flat-shelves-no-default-status-shelves.md`.
- A real bug was found and fixed during the build: `book_genres` was
  missing its `DELETE` grant, which silently broke genre-linking on every
  import until caught by browser-driven testing (not by typecheck/lint).
  **This happened again** when `shelves`/`shelf_books` were added — both
  tables had fully correct RLS policies but no table-level `GRANT` to
  `authenticated` at all (raw `create table` DDL doesn't add one the way
  Supabase's dashboard table editor does), so every request 403'd
  regardless of policy correctness until caught by browser testing again.
  See `quality.md`'s "Database schema / RLS" section — worth checking for
  on every new table from now on, not just assuming RLS is the whole
  story.

### Bookshelves (flat, user-curated)

Added 2026-08-09, then reworked same-day to its current flat form —
see `decisions/ADR-007-custom-bookshelves-and-profile-visibility.md`
(superseded in part) and
`decisions/ADR-008-flat-shelves-no-default-status-shelves.md` (current),
plus `specs/bookshelves.md` for full behavior.

- **Every shelf is the same shape** — `id`, `profile_id`, `title`,
  `position`. There is no default/custom distinction; `shelves` has no
  relationship to `reading_status` at all.
- **Every profile gets exactly one shelf, "My shelf," seeded
  automatically** — via `handle_new_user()` on signup (and, for the 35
  profiles that predated this feature, a one-time backfill that also
  populated it with whatever they already had tracked in
  `list_entries`). It is not special after creation: it can be renamed
  or deleted exactly like any shelf a user creates themselves, and a
  profile can end up with zero shelves if a user deletes all of them.
- Shelves hold books via `shelf_books`, independent of whether that book
  is tracked in `list_entries` at all — pure curation. Added from a
  book's own detail page (`components/ShelfPicker.tsx` on
  `BookDetail.tsx`), not from a picker built into the shelf view itself.
- **Reading-status tracking (`list_entries` — status/progress/rating/
  private notes) is completely independent of shelving**, and has no
  cross-user read path at all — the `public_reading_status` view that
  briefly existed for this (ADR-007) was dropped along with the
  default-shelf concept it served (ADR-008), since public profiles now
  only ever show shelf contents. `Profile.tsx` does a client-side lookup
  by `book_id` against the signed-in user's own tracked list purely to
  show a status badge on their own shelved books that happen to also be
  tracked — not a data relationship between the two systems.
- `/u/:username` (`src/pages/PublicProfile.tsx`, `usePublicProfile`) is
  the read-only rendering of another signed-in user's shelves — no edit
  controls, no genre-preference editor, and no reading-status data of
  any kind (there's no surface left that would expose it).
- **Known gap, not yet built**: shelf reordering exists at the
  service/hook layer (`reorderShelves` in `services/supabase/shelves.ts`
  and `useShelves`) but isn't wired to any UI control yet — shelves
  display in a fixed `position` order with no way to reorder them from
  the app itself. See `working/open-questions.md`.

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

Single Supabase client (`src/supabase-client.ts`), constructed with
explicit `auth: { persistSession: true, autoRefreshToken: true,
detectSessionInUrl: true }` options, and fails fast (throws) if
`VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing rather than
producing an ambiguous later failure. `AuthContext` + `AuthProvider`
(`src/context/`) hold `user` and an `isLoading` flag, hydrated via
`supabase.auth.getSession()` (now handles a resolved `error` or a
rejected promise by clearing `user` rather than assuming success, and
guards state updates with an `isMounted` flag) + `onAuthStateChange`,
consumed via `useAuth()`. `RequireAuth`
(`src/components/RequireAuth.tsx`) gates every authenticated route and
explicitly waits for `isLoading` to resolve before redirecting — an
early version redirected prematurely on every full page load because it
treated "session not yet checked" the same as "logged out."
`RedirectIfAuthenticated` (`src/components/RedirectIfAuthenticated.tsx`)
is the inverse guard, wrapping only `/signin` and `/signup` in
`src/App.tsx` — a session already present redirects to `/` instead of
showing the form. `/forgot-password` and `/reset-password` are **not**
wrapped in it. `/reset-password` has its own guard instead: no active
session (i.e. the user didn't arrive via a valid recovery link) redirects
to `/forgot-password`. Sign-out (`NavBar.tsx`) awaits `signOut()` then
explicitly navigates to `/signin` (`replace: true`) rather than relying
on `onAuthStateChange` + `RequireAuth` to redirect eventually. Methods
used: `signUp`, `signInWithPassword`, `signOut`, `resetPasswordForEmail`,
`updateUser` (password), `resend` (confirmation email). No OAuth
providers.

Password strength (`src/lib/authValidation.ts`): 8+ characters, a digit,
and a special character, enforced client-side on sign-up and
password-reset (not sign-in, which only requires non-empty). Sign-up and
reset-password also carry a set of Chrome-credential-manager-specific
workarounds (masked `type="text"` fields instead of `type="password"`,
fully manual form submission, tuned `autocomplete`/`data-*ignore`
attributes) — non-obvious from the code alone without knowing *why*, see
`specs/auth.md` for the full rationale and what's still unverified
(Chrome only, not Safari/Firefox). All four auth pages now share the
redesigned card-less layout (`src/pages/Auth.css`, `auth-page`/
`auth-wordmark`/`auth-row`/`auth-field` classes) — `/forgot-password`
and `/reset-password` were extended to match `/signin`/`/signup` in
PR #13 (`better_covers`, merged 2026-08-17), closing what was previously
a documented visual inconsistency (`specs/auth.md`).

Email confirmation is currently **disabled** on the Supabase project (a
dashboard setting, not code) — signup returns a live session immediately.

## Book metadata integration

**As of `decisions/ADR-009-remove-book-metadata-provider-abstraction.md`
(2026-08-18, PR #14), there is no provider-abstraction interface.**
`src/services/metadata/googleBooksApi.ts` (renamed from
`googleBooksProvider.ts`) exports `searchGoogleBooks()`,
`getGoogleBookById()`, and Google Books' own response types
(`GoogleBooksVolume`, `GoogleBooksVolumeInfo`) directly.
`api/bookMapping.ts::mapGoogleBooksVolumeToRow` maps a `GoogleBooksVolume`
straight to a `books` row (reading `volume.volumeInfo.title` etc. by
field name), stripping embedded HTML from descriptions and resolving
categories to genre ids (static regex table in `lib/genreMapping.ts`
first, `category_aliases` cache second) — the same pattern the reference
app `issho` uses in `api/animeMapping.ts` with `AniListMedia`.
`api/bookImport.ts::importBookFromGoogleBooks` is the write-through
cache: return the cached row if `fetched_at` is within a 14-day TTL,
otherwise fetch/map/upsert. Search (`BookSearch.tsx`,
`hooks/useBookSearch.ts`) merges a local Postgres full-text query against
`books.search_vector` with a live, debounced query against
`searchGoogleBooks()` — local results are instant, remote-only results
get imported on click, not on every keystroke. Results render as
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

On the remote side, `googleBooksApi.ts`'s `searchGoogleBooks()` issues up
to three query variants in parallel (`Promise.allSettled`) — an
`intitle:"exact phrase"` query when the input has multiple words, an
`intitle:` query per significant (non-stop-word, 3+ char) term, and the
raw query as typed — and merges/dedupes the results by volume id. This
improves recall (a query that's too specific for a single `intitle:`
phrase match can still hit via the per-term variant) at the cost of
issuing more requests per search than before; see the Google Books quota
note in `working/open-questions.md`. The remote query is separately
debounced (`REMOTE_SEARCH_DEBOUNCE_MS = 400` in `useBookSearch.ts`,
via a small `useDebouncedValue` hook) and cancellable (an `AbortSignal`
from TanStack Query is threaded through `fetchWithRetry`), while the
local Postgres query fires on every keystroke unthrottled — only the
remote side needed debouncing since it's the one with real request cost
and latency. `mergeResults`' sort also gives any result with a cover
image a hard priority over one without, ahead of the relevance score
comparison — not just the small `coverBoost` addend described below.

Cover images (added 2026-08-09,
`googleBooksApi.ts`'s `enhanceGoogleBooksCoverUrl`): Google Books' raw
`thumbnail` link is a small (~128px) image with a decorative page-curl
overlay, then gets stretched to fill much larger grid cells — that
upscaling is what read as blurry cover art. `enhanceGoogleBooksCoverUrl`
forces `https:` and, **only when the original URL already has Google's
own `edge=curl` marker**, sets `zoom=2` (roughly doubles resolution) and
strips the `edge` param (removes the curl decoration). That condition
was added 2026-08-18 (PR #14) after verifying empirically that a volume
*without* `edge=curl` in its original URL (observed for older/
library-catalog-only volumes with no real front-cover scan) returns a
different, degenerate asset at `zoom=2` — e.g. a ~300×48px spine-label
crop instead of a larger cover — which then stretches into a giant
blurry text fragment in the grid; those volumes are now left untouched
at their original zoom instead. Cover `<img>` elements across
`BookCoverCard.tsx`, `BookShelfCover.tsx`, `SimilarBooks.tsx`, and
`BookDetail.tsx` also got `loading="lazy"`/`decoding="async"`, so a grid
of 20+ covers doesn't all decode on the main thread at once (was
contributing to choppy scroll).

### Cover-image runtime fallback

**A second, independently-built mechanism addresses an overlapping
version of the same problem.** PR #13 (`better_covers`, merged
2026-08-17 — before the `edge=curl` fix above existed) added
`hooks/useCoverImageSrc.ts` + `lib/googleBooksCoverUrl.ts
::getCoverImageFallbackUrl`: on `<img onLoad>`, if the loaded image's
`naturalHeight/naturalWidth` ratio is under `MIN_COVER_ASPECT_RATIO`
(1.4 — real covers run ~1.5–1.7), it retries the same cover at `zoom=1`
once, then falls back to a text placeholder if that also fails
(`onError` separately covers an actual HTTP failure).

**This fallback is opt-in via `{ validateAspectRatio: true }` and is
only passed by `BookDetail.tsx`.** `BookCoverCard.tsx`,
`BookShelfCover.tsx`, and `SimilarBooks.tsx` all call
`useCoverImageSrc(coverImageUrl)` without that option (verified by
reading each call site), so `handleLoad` is never wired to their `<img>`
elements — the single book-detail page is protected by both mechanisms,
but the search grid, similar-books row, and any list using
`BookCoverCard` only get the `edge=curl`-based prevention above, not
this runtime fallback. The two mechanisms were never reconciled into one
approach — see `working/open-questions.md`.

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
anywhere in the app (true before this token system existed too). A
universal cursor rule (`src/index.css`, added 2026-08-09) sets
`cursor: pointer` on every interactive element (`button:not(:disabled)`,
`a[href]`, `[role="button"/"link"]`, `summary`, `label[for]`, enabled
checkboxes/radios/selects) and `cursor: not-allowed` on disabled
buttons/inputs/selects/textareas — a global rule, not per-component
styling, since Tailwind/browser defaults don't apply pointer cursors to
most of these by default.

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
