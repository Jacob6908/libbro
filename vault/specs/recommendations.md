---
status: implemented
last-reviewed: 2026-08-07
---

# Recommendations

## Goal

Surface books a user is likely to want to read, without any social graph
to draw on (see `decisions/ADR-004-content-based-recommendations-only.md`),
as a browsable set of named categories rather than one flat ranked list.

## User behavior

- `/recommendations` shows a random 3-4 category rows (e.g. "Horror for
  you", "Because you loved Blood Meridian", "Longer than you'd usually
  read"), re-rolled on every page visit — reloading or re-navigating to
  the page can show a different mix, count, and order each time.
- `/recommendations/all` shows every generated category, stacked, as a
  Netflix-style browse view.
- The home dashboard shows a short preview (first 5 books across
  categories, flattened).
- Each book's detail page shows a "similar to this" row, independent of
  any specific user's preferences.
- A link from the recommendations page goes to genre-preference editing
  on the profile page (see `specs/genre-preferences.md`).

## Requirements

**Category generation** (`getRecommendationCategories`): builds up to
several `{ id, title, books }` rows, in this order, de-duplicated against
each other via one shared "already used" set so no book (or already-
tracked book) repeats across rows in the same call:

1. **"Top picks for you"** — explicit `profile_genre_preferences.weight`
   (×2) combined with inferred per-genre affinity from the user's own
   ratings (`rating - 3`, ×1), blended across the top 6 scoring genres —
   the same scoring `getRecommendationsForUser` (the original flat feed)
   still exposes on its own; see "Implementation status" below.
2. **One row per top-scoring genre** (up to 6), titled `"{genre} for
   you"`, using that single genre's score rather than the blend.
3. **Up to 3 "Because you loved {title}"** rows, one per the user's
   highest-rated tracked books (rating ≥ 4, most recent first as
   tiebreak), each built from `getSimilarBooks`.
4. **"Longer than you'd usually read"** — books with `page_count` above
   1.25× the average `page_count` across the user's own tracked books
   with known page counts. Skipped entirely (not shown as an empty row)
   if the user has no page-count history.
5. **"Highly rated overall"** — `average_rating`/`ratings_count`
   popularity ordering, always included last if non-empty; this is also
   the sole fallback for a cold-start user (see below).

Every category, and books without a `cover_image_url`, are filtered out
everywhere in this feature — a book with no cover art can never appear
in any recommendation row. Each category over-fetches candidates
(4× the target row size) before the shared dedup/cover-art filtering
trims it down, so an earlier category consuming the best candidates
doesn't starve a later one of content.

**Cold start**: a user with no genre preferences, no ratings, and
nothing tracked gets just the single "Highly rated overall" category —
never an empty feed, never padded with fabricated categories.

**Display**: `/recommendations` picks a random 3-4 of the generated
categories once per page mount (not re-rolled on every re-render within
a visit) and shows them via `RecommendationShelfRow`; `/recommendations
/all` shows every category, unfiltered, in generation order.

## Acceptance criteria

- A cold-start user sees a non-empty "Highly rated overall" row once any
  books exist in the shared cache.
- Reloading `/recommendations` repeatedly shows a different set/order of
  category rows (verified in-browser: two consecutive loads produced
  different category counts (3 vs. 4) and orders).
- `/recommendations/all` shows every category the same account would see
  across several `/recommendations` visits, combined.
- No book appears twice across categories in the same page load.
- Setting a genre preference changes which categories/books rank highest
  (verified historically against the underlying scoring, which is
  unchanged by this rework — see `getRecommendationsForUser`'s own
  acceptance history).

## Permissions and security

Unchanged: personal categories are scoped to the requesting user's own
preferences/ratings/tracked list (RLS-private tables); `books`/
`book_genres` are shared, authenticated-readable cache data.

## Edge cases

- A user who rates books but sets no explicit preferences still gets
  genre-shaped categories, purely from inferred affinity.
- A book tagged with zero genres, or with no cover art, contributes
  nothing to any category.
- "Because you loved X" and the per-genre rows can be sparse if the
  user's tracked list is small, since the shared dedup set means an
  earlier category (especially "Top picks for you", generated first)
  can claim the strongest candidates before a later, topically-similar
  category gets a turn at them.

## Out of scope

- Collaborative filtering ("users who liked X also liked Y") — no social
  graph exists to build this from.
- Any ML/embedding-based similarity — still a small, explicit linear
  scoring function per category.
- Persisting which categories were shown (the random selection is
  client-side, per-mount, not stored anywhere).

## Implementation status

Implemented. `src/services/recommendations.ts`
(`getRecommendationCategories`, `RecommendationCategory`),
`src/hooks/useRecommendations.ts` (`useRecommendationCategories`),
`src/pages/Recommendations.tsx`, `src/pages/RecommendationsAll.tsx`,
`src/components/RecommendationShelfRow.tsx`, `src/pages/Home.tsx`,
`src/components/SimilarBooks.tsx`.

**`getRecommendationsForUser`/`useRecommendations` (the original flat
list this was built on top of) are still present and functionally
correct, but as of this audit nothing in `src/pages/` calls them
anymore** — every consumer moved to the category API. Whether to keep,
remove, or repurpose this code path is undecided — see
`working/open-questions.md`.

## Open questions

Whether `getRecommendationsForUser`/`useRecommendations` should be kept
as-is, removed, or repurposed now that no page calls them directly — see
`working/open-questions.md`. The `profile_genre_preferences.weight`
question from the previous version of this spec is unchanged — still
open, see `working/open-questions.md`.
