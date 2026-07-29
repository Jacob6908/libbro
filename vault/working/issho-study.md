# Study: issho (reference anime-tracker) → libbro backend design

Read-only investigation of `../Issho` (confirmed path:
`/Users/jacobgallardo/Github/Issho` — capital `I`; the repo is **not a git
repository**, so no history/blame is available). Conducted per the approved
plan; nothing in that repo was modified. This is scratch investigation
context per vault convention — promote any durable conclusions into
`architecture.md` / `decisions/` once libbro's own stack is chosen, don't
treat this file itself as a spec.

Labels: **Verified** (seen directly in code/config, file path given),
**Inferred** (reasonable conclusion, reasoning given), **Unknown**.

## 1. Architecture at a glance

**Verified.** issho is a client-only SPA — there is no custom backend
server in the repo. The entire "backend" is:
- **Supabase** (hosted Postgres + Auth + Storage), accessed directly from
  the browser via `@supabase/supabase-js` with the anon key
  (`src/supabase-client.ts`). No service-role usage anywhere in `src/`.
- **AniList's public GraphQL API** (`https://graphql.anilist.co`), called
  live from the browser for search, and used to populate Postgres via an
  import-on-add flow plus two one-off Node backfill scripts.
- Hosted on **Vercel** as a static SPA (`vercel.json` is just an SPA
  rewrite rule).
- Stack: Vite + React 19 + TypeScript (strict) + React Router 7 +
  TanStack Query 5 + Tailwind 4.

There is no `supabase/` migrations directory in the repo — **the schema of
record lives only in the Supabase cloud project**, not in version control.
Everything below about the schema is *inferred from TypeScript types and
query call sites*, not read from a migration file. Treat exact column
types/constraints/defaults as Inferred even where field names are Verified.

## 2. Tooling & quality commands

**Verified** (`package.json`):
```
dev:   vite
build: tsc -b && vite build
lint:  eslint .
lint:fix: eslint . --fix
format: prettier --write "src/**/*.{ts,tsx,js,jsx,json,css}"
preview: vite preview
```
- `npm run lint` is safe to run non-destructively (pure static analysis).
- A bare typecheck (`tsc -b --noEmit`, not an actual npm script) would be
  safe; `npm run build` is not read-only (writes `dist/` and TS build-info
  cache under `node_modules/.tmp`).
- `lint:fix` and `format` write to source files — not safe for recon.
- **No test tooling exists at all.** No `test` script, no vitest/jest/
  testing-library in `package.json` or lockfile, no test config files.
  `docs/TESTING.md` and `docs/CICD.md` are both **empty (0 bytes)** —
  placeholders that were never filled in. `docs/issues/
  franchise-component-duplication.md` states outright, quoting the
  project's own `CLAUDE.md`: *"There is no test suite configured in this
  repo."*
- **No CI/CD is configured**: no `.github/workflows`, no other workflow
  files anywhere. Deployment is inferred to be Vercel's default
  git-push-to-deploy, undocumented.
- ESLint: flat config, `typescript-eslint` recommended + react-hooks +
  react-refresh + Prettier-as-lint-rule. TS: `strict: true` plus
  `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`. No
  path aliases configured.

**Doc-vs-code conflict (Verified):** `DESIGN.md` says anime metadata comes
from "the Jikan API"; `README.md` and the actual code
(`src/services/anilistApi.ts`, `scripts/backfill-anilist.ts`) use AniList's
GraphQL API instead. `DESIGN.md` reads as an early spec never updated after
the AniList migration — treat README + source as current, `DESIGN.md` as
historical/stale.

## 3. Data model (inferred schema)

Source of truth used: `src/types/database.types.ts` (single file, no
migrations exist to cross-check against) plus query call sites.

| Table | Key columns | Notes |
|---|---|---|
| `anime` | `id` (uuid PK), `name`, `name_japanese`, `description`, `episode_count`, `cover_image_url`, `banner_image_url`, `year`, `genres` (comma-joined string, **not** a join table), `status` (free text), `format`, `mal_id`/`mal_url`, `anilist_id`/`anilist_url`, `franchise_key` (int, AniList id of the franchise root), `franchise_title` (denormalized) | One row per season/release, not per franchise |
| `entries` | `id`, `anime_id`, `franchise_key`, `user_id`, `entry_type` (`"review"\|"rating"\|"status_update"`), `content`, `rating_value`, `status_value` | Community feed post; doubles as the audit trail for status changes and ratings |
| `votes` | `entry_id`, `user_id`, `vote` (`1\|-1`) | Reddit-style like/dislike on entries |
| `comments` | `entry_id`, `user_id`, `parent_comment_id` (self-FK), `content`, `is_spoiler` | One level of nesting shown in UI; schema supports arbitrary depth |
| `user_anime_entries` | `user_id`, `anime_id`, `status`, `rating`, `review` | **Season-level** list entry |
| `user_franchise_entries` | `user_id`, `franchise_key`, `status`, `rating`, `review` | **Series-level** list entry, independent of season-level rows |
| `profiles` | `id` (= `auth.users.id`), `username`, `avatar_url`, `bio` | |
| `friendships` | `requester_id`, `addressee_id`, `status` (`pending\|accepted\|rejected`) | |

Enums (Postgres enums per `DESIGN.md`, Verified as a design statement):
`EntryType`, `AnimeStatus = "not_started" | "watching" | "completed" | "dropped"`,
`FriendshipStatus`.

**Notable design points worth a deliberate decision in libbro, not a blind
port:**
- **No numeric progress tracking exists.** `AnimeStatus` is a 4-value enum
  only — no `current_episode`/`episodes_watched` column anywhere.
  `episode_count` on `anime` is the show's *total*, not user progress.
  Books have an obvious analogue (current page / percent / chapter) that
  issho's schema doesn't model at all — this needs its own design, not a
  copy.
- **Series modeling is flat, not relational.** There is no `franchises`
  table; `franchise_key`/`franchise_title` are a denormalized grouping key
  copied onto every member `anime` row, resolved by walking AniList's
  prequel/sequel relation graph (`src/services/anilistFranchise.ts`,
  `collectBackbone`/`resolveFranchiseKey`). Season order is inferred from
  `year`, not an explicit `season_number`. Books have much more stable,
  upfront series/volume numbering than anime's tangled sequel graph — a
  real `series` table with a proper FK and volume number is likely a
  better fit than copying this pattern. (Inferred recommendation.)
- **Season-level and series-level tracking are two independent, never
  auto-reconciled tables** (`user_anime_entries` vs
  `user_franchise_entries`) — confirmed by `docs/issues/
  franchise-component-duplication.md` and a header comment in
  `userFranchiseList.ts`. The only bridge is a manual, user-triggered
  `markFranchiseSeasonsCompleted` bulk-update. This is flagged in issho's
  own backlog as tech debt (duplicated per-anime/per-franchise UI
  component pairs). Worth avoiding this exact split for books (e.g.
  standalone book vs. series) by designing the reconciliation in from the
  start rather than bolting it on later.
- **No favorites, no recommendations, no notifications, no admin/role
  system** exist anywhere in the app (all Verified absent via repo-wide
  grep — see §5).

## 4. Auth

**Verified**, all calls in `src/context/AuthProvider.tsx`: email/password
only — `signInWithPassword`, `signUp` (with email confirmation redirect),
`signOut`, `resetPasswordForEmail`, `updateUser` (password), `resend`
(confirmation email), plus `getSession`/`onAuthStateChange` for session
hydration. **No OAuth providers, no magic link.** State is held in a
`useState` + Context (`AuthContext`/`AuthProvider`/`useAuth`), wrapping the
app inside `QueryClientProvider` in `src/main.tsx`.

**RLS: no policy definitions exist in this repo** (grep for
RLS/policy/row-level across `src/` and `docs/` — zero hits; policies, if
any, live only in the Supabase cloud project, not inspected per the
read-only/no-external-service restriction). Every service function
manually re-filters by `user_id` client-side
(`.eq("user_id", userId)` throughout), which is the standard Supabase
pattern *only if* mirrored by server-side RLS — **Unknown** whether such
policies actually exist, since the anon key trusts client-supplied
`user_id` on inserts (e.g. `friendships.ts` sets `requester_id: user.id`
from the client). This is a real risk pattern to actively verify (not
assume) in libbro's own Supabase project, if Supabase is chosen: RLS
policies must be present and are not something you can infer from a
frontend-only codebase.

## 5. Feature surface (router table + status)

Router (`src/App.tsx`, Verified, verbatim paths): `/signin`, `/signup`,
`/forgot-password`, `/reset-password`, `/`, `/entry/create`, `/entry/:id`,
`/anime`, `/anime/create`, `/anime/:id`, `/series/:franchiseKey`,
`/profile/:username`, `/profile/:username/friends`, `/profile/edit`.

| Feature | Status | Where |
|---|---|---|
| Home/dashboard | Verified — public activity feed (All/Friends/Me), featured entry, following panel | `pages/Home.tsx`, RPC `get_entries_with_counts` |
| Search | Verified — local Postgres catalog + **live** AniList GraphQL merged in one results grid | `pages/AnimeListPage.tsx`, `components/AnimeList.tsx` |
| Detail pages | Verified — season-level (`/anime/:id`) and series-level (`/series/:franchiseKey`), separate pages | `pages/AnimePage.tsx`, `pages/FranchisePage.tsx` |
| Tracking lists | Verified — per-user list page grouped into season/franchise cards, status-tab filters, 20/page pagination | `pages/UserProfilePage.tsx` |
| Progress tracking | Verified, status-only (no episode counter — see §3) | `hooks/useListStatusEntry.ts`, `services/supabase/userAnimeList.ts` |
| Ratings | Verified, 1–10 integer, no half-points | `CreateEntry.tsx`, `EntryEditModal.tsx` |
| Reviews | Verified, folded into the `entries` feed-post concept (public) plus a separate private `review` notes field on list entries | `CreateEntry.tsx`, `EntryDetail.tsx` |
| Favorites | **Not found** | — |
| Profiles | Verified, own + others', username-keyed route | `pages/UserProfilePage.tsx`, `pages/EditProfilePage.tsx` |
| Social (friends/comments/votes) | Verified, extensive: friend requests, threaded comments, Reddit-style up/down votes | `services/supabase/friendships.ts`, `CommentSection.tsx`, `services/supabase/votes.ts` |
| Recommendations | **Not found** | — |
| Notifications | **Not found** (zero hits for "notification" anywhere) | — |
| Admin/moderation | **Not found** — no role column, no guarded routes; `/anime/create` is unlinked/unguarded manual entry, not a real admin feature | — |
| Settings | Verified, profile-only (username/bio/avatar); no notification/privacy/theme prefs | `pages/EditProfilePage.tsx` |

Since social + recommendations were called in-scope: recommendations are
simply **absent** from issho, so there's nothing to model off of there —
if libbro wants recommendations, that's a from-scratch design, not
something to adapt. Social (friends/feed/comments/votes) is real and
fairly complete; if libbro carries social forward, the friendship-graph
and comment-threading patterns here are usable references (see `services/
supabase/friendships.ts`, `comments` table shape in §3).

## 6. External metadata integration — the seam that matters most

**Verified, key finding:** issho does **not** use a single clean pattern —
it's a hybrid, and notably **unabstracted**:
- **Live proxy**: typing in the search box calls AniList's GraphQL API
  directly from the browser per debounced keystroke
  (`components/AnimeList.tsx`, `useQuery(["anilistSearch", ...])`,
  5-min `staleTime`), merged into the same results grid as local Postgres
  matches.
- **Write-through cache**: adding an AniList-only result to a list imports
  it into Postgres on the fly (`api/animeImport.ts`), upserted on
  `anilist_id`, with the whole prequel/sequel "franchise backbone" pulled
  in at the same time. A local row older than 7 days (`updated_at`) is
  treated as stale and silently re-fetched — a hardcoded TTL, not a DB
  column.
- **Two one-off Node backfill scripts** (`scripts/backfill-anilist.ts`,
  `scripts/backfill-banners.ts`) exist only to catch up rows created
  before the live-import path existed. Neither is wired into
  `package.json`, cron, or CI — manual CLI use only, gated by
  `SUPABASE_SERVICE_ROLE_KEY`.
- **Rate limiting** (1200ms throttle, retry-after backoff in
  `services/anilistApi.ts`) protects against AniList's own limits — not a
  cache.
- **No API key needed for AniList** (public, unauthenticated GraphQL
  endpoint) — the only relevant env var anywhere is
  `VITE_SUPABASE_ANON_KEY`, unrelated to the metadata source.

**The important negative finding**: there is **no abstraction boundary**
anywhere — no `MetadataProvider` interface, no adapter type. AniList's
GraphQL shape (`AniListMedia`, `title.romaji`, `idMal`, etc.) is imported
and consumed by name directly in search, import, mapping, and
franchise-resolution code alike. The only decoupling that exists
(`api/animeMapping.ts` being framework-free) was done so a Node script
could reuse it outside the browser — not to make the metadata source
swappable.

**Recommendation for libbro (Inferred, not merely descriptive):** if a
"plug-and-play" book-metadata API is a goal, this is exactly the gap to
close relative to issho — introduce a small `BookMetadataProvider`-style
interface at the layer equivalent to `anilistApi.ts`, so search/import/
mapping code depends on that interface rather than a concrete vendor
client. The two-tier shape itself (durable Postgres cache + live-search
proxy, keyed on the external id, TTL-refreshed) is worth keeping — it's
just the vendor-coupling that should be avoided.

## 7. Deployment / CI (medium priority, noted not deep-dived)

**Verified:** no CI/CD pipeline exists (empty `docs/CICD.md`, no
`.github/workflows`). Deployment is Vercel, inferred to be default
git-push auto-deploy — undocumented, unconfirmed beyond `vercel.json`'s
bare SPA rewrite rule.

## 8. What this means for libbro, summarized

- Backend framework decision is wide open — issho has *no* custom backend
  at all (Supabase-only). Worth an explicit decision for libbro rather
  than defaulting to "whatever issho did," especially since this repo's
  own restrictions note book metadata likely needs a proper sync/import
  pipeline (Google Books / Open Library / ISBNdb) — the plug-in-point gap
  identified in §6 is the main actionable lesson.
  See `[[open-questions]]` — "what will the tech stack be" is still
  unanswered and this study doesn't answer it either; it only surveys one
  possible reference point.
- Progress-tracking model needs original design (pages/percent/audiobook
  position) — issho has no equivalent to crib from.
  See `[[open-questions]]` — flag as a new open question if a decision
  isn't made before schema work starts.
- Series/volume modeling: prefer a real relational `series` table over
  issho's flat denormalized-key pattern, since book series numbering is
  more stable/known upfront than anime's sequel-graph problem.
  - Also: check whether Series should reconcile with individual volume tracking status automatically, unlike issho's known-broken split (§3).
- RLS posture is an **open, unverified risk pattern** in issho, not a
  reference to copy uncritically — if libbro uses Supabase or another
  RLS-capable Postgres host, policies need to be explicitly designed and
  tested, not assumed from client-side filtering.
- No test suite, no CI exist in issho — nothing to adopt from there; see
  `[[open-questions]]`'s testing/quality item, still open for libbro.
