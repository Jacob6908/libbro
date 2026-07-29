---
status: implemented
last-reviewed: 2026-07-29
---

# Book metadata import

## Goal

Let a user search for and add real books, sourced from Google Books, via
an abstraction that doesn't hardcode the vendor throughout the app (see
`decisions/ADR-003-google-books-behind-provider-interface.md`).

## User behavior

On `/books`, typing a query (2+ characters, debounced) shows merged
results: instant matches from the local Postgres cache
(`books.search_vector` full-text search) plus live Google Books results.
Clicking any result imports it into the local cache if not already there,
then navigates to its detail page.

## Requirements

- `BookMetadataProvider` interface (`search`, `getById`) is the only
  thing the rest of the app depends on — no consumer imports Google
  Books types directly except `googleBooksProvider.ts` itself.
- Import (`importBookFromProvider`): look up by `(provider, external_id)`;
  if found and `fetched_at` is within 14 days, return the cached row
  as-is; otherwise fetch fresh, map, and upsert.
- Mapping strips embedded HTML from descriptions (Google Books
  descriptions commonly contain `<b>`, `<br>`, etc. — this rendered as
  literal text before the fix) and resolves each raw category string to
  a genre id via a static keyword table first, then a `category_aliases`
  cache table for anything unmatched.
- `external_id` is validated against `^[A-Za-z0-9_-]{1,64}$` before it
  touches a fetch URL or the database, since it's an attacker-choosable
  string from the client.

## Acceptance criteria

- Searching, importing, and reopening a book shows clean plain-text
  descriptions with paragraph breaks preserved (verified — see the
  HTML-stripping fix during the build).
- Re-opening an already-cached, fresh (<14 days) book does not trigger a
  new Google Books request.
- A newly imported book gets correctly populated `book_genres` rows
  (verified after fixing the missing `DELETE` grant — see
  `architecture.md`).

## Permissions and security

`books`/`book_genres`/`category_aliases` are shared cache tables, open to
any authenticated user for read and (for `books`/`book_genres`/insert-only
`category_aliases`) write — there's no service-role backend to gate
imports through. This mirrors the trust model `issho` already uses for
its own metadata cache table.

## Edge cases

- Google Books' unauthenticated quota is ~1000/day; a restricted API key
  is expected to be configured (see `quality.md`) but its absence isn't
  currently handled with a specific user-facing error message.
- Categories that match nothing in the static keyword table are cached in
  `category_aliases` with `genre_id: null` — there's no in-app UI to
  triage these; a human corrects them via direct SQL.

## Out of scope

- Any provider other than Google Books (the interface supports adding
  one; none exists yet).
- Scheduled/background refresh — caching is refresh-on-read only, since
  there's no server to run a cron job on.

## Implementation status

Implemented. `src/services/metadata/`, `src/api/bookImport.ts`,
`src/api/bookMapping.ts`, `src/lib/genreMapping.ts`,
`src/hooks/useBookSearch.ts`, `src/pages/BookSearch.tsx`.

## Open questions

Whether a Google Books API key is actually provisioned and
referrer-restricted — see `working/open-questions.md`.
