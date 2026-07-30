---
status: implemented
last-reviewed: 2026-07-29
---

# Recommendations

## Goal

Surface books a user is likely to want to read, without any social graph
to draw on (see `decisions/ADR-004-content-based-recommendations-only.md`).

## User behavior

- `/recommendations` shows a personal feed; a short preview also appears
  on the home dashboard.
- Each book's detail page shows a "similar to this" row, independent of
  any specific user's preferences.
- A link from the recommendations page goes to genre-preference editing
  on the profile page (see `specs/genre-preferences.md` for that UI,
  reworked since this spec's original acceptance criteria were written).

## Requirements

**Personal feed** (`getRecommendationsForUser`):

1. Explicit signal: `profile_genre_preferences.weight`, weighted ×2. The
   column still allows 1-3 and the scoring code makes no assumption
   otherwise, but as of this audit the genre-preference UI only ever
   writes `weight = 2` for new selections (see
   `specs/genre-preferences.md`) — a handful of pre-existing rows still
   hold 1 or 3 from before that rework. In practice, explicit signal is
   now close to a flat per-genre bonus rather than a user-tunable
   strength dial, until/unless that changes.
2. Inferred signal: for each of the user's rated `list_entries`, `rating
   - 3` (centering the 1-5 scale) attributed to every genre that book is
   tagged with, weighted ×1.
3. Combine per genre; genres with a non-positive combined score are
   dropped. Take the top 6 genres by score.
4. Candidate books: anything tagged with a top genre, excluding books
   already in the user's list. Score = sum of matching genre scores +
   `average_rating * 0.1` + `log10(ratings_count + 1)`.
5. **Cold start**: if the user has no preferences and no ratings at all,
   skip straight to popularity ordering (`average_rating`, then
   `ratings_count`, descending) over books not already in their list.

**Similar books** (`getSimilarBooks`): no user context. Score = count of
genres shared with the target book, +2 if the candidate shares an author
with the target book (Postgres array `overlaps`). No genre or author
overlap means no similar books are shown (the section is hidden entirely
rather than shown empty).

## Acceptance criteria

- A cold-start user (no prefs, no ratings) sees a non-empty feed once any
  books exist in the shared cache (verified during the build).
- Setting a genre preference changes which books rank highest (verified
  at the time against the old Meh/Like/Love UI: setting Science Fiction
  to "Love" — `weight = 3` — surfaced sci-fi books first). The scoring
  mechanics this exercised are unchanged; only the UI's ability to reach
  `weight = 3` for a new selection is gone — see
  `specs/genre-preferences.md`.
- A book's "similar to this" row only appears once genre data actually
  exists for it — this depends on `book_genres` being populated
  correctly at import time. A real bug (missing `DELETE` grant on
  `book_genres`) silently broke this for every import in the codebase's
  early history; see `architecture.md` and
  `decisions/ADR-002-dashboard-managed-schema.md` for why this class of
  bug was hard to catch.

## Permissions and security

The personal feed is scoped to the requesting user's own preferences and
ratings (both RLS-private tables). `books`/`book_genres` are shared,
authenticated-readable cache data — no per-user filtering needed for
"similar books."

## Edge cases

- A user who rates books but sets no explicit preferences still gets a
  genre-shaped feed, purely from inferred affinity.
- A book tagged with zero genres (e.g. import happened before the
  `book_genres` grant bug was fixed) contributes nothing to genre-based
  matching and won't appear in anyone's "similar to this" results until
  re-imported past its 14-day cache TTL or manually corrected.

## Out of scope

- Collaborative filtering ("users who liked X also liked Y") — no social
  graph exists to build this from.
- Any ML/embedding-based similarity — the current approach is a small,
  explicit linear scoring function, intentionally.

## Implementation status

Implemented. `src/services/recommendations.ts`,
`src/hooks/useRecommendations.ts`, `src/pages/Recommendations.tsx`,
`src/components/SimilarBooks.tsx`.

## Open questions

None currently — see `working/open-questions.md`.
