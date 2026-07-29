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
   (`SignUp.tsx`, `SignIn.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`).
2. **Search and add a book** — search merges a local Postgres cache with
   live Google Books results; selecting a result imports it into the
   local cache on demand (`BookSearch.tsx`, `api/bookImport.ts`).
3. **Track a book** — set status (want to read / reading / completed / on
   hold / dropped), a 0–100% progress slider, a 1–5 star rating, and a
   private text note, from the book's detail page (`BookDetail.tsx`,
   `components/ListEntryEditor.tsx`).
4. **Browse your list** — `/my-list`, filterable by status tab
   (`MyList.tsx`).
5. **Set genre preferences** — weighted (Meh/Like/Love) picks across a
   curated 24-genre taxonomy, on the profile page
   (`components/GenrePreferencePicker.tsx`).
6. **Get recommendations** — a personal "recommended for you" feed
   (`Recommendations.tsx`) combining genre preferences and inferred taste
   from ratings, plus a per-book "similar to this" widget
   (`components/SimilarBooks.tsx`).
7. **Home dashboard** — currently-reading shelf + a short recommendations
   preview (`Home.tsx`).

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
