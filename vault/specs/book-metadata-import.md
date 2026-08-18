---
status: implemented
last-reviewed: 2026-08-18
---

# Book metadata import

## Goal

Let a user search for and add real books, sourced from Google Books.
**As of `decisions/ADR-009-remove-book-metadata-provider-abstraction.md`
(2026-08-18), this is deliberately *not* behind a vendor-neutral
abstraction** — `src/services/metadata/googleBooksApi.ts` exports
Google Books' own response shape (`GoogleBooksVolume`) and the rest of
the app consumes it directly. `decisions/
ADR-003-google-books-behind-provider-interface.md`, superseded by
ADR-009, has the original abstraction and its rationale for the
historical record.

## User behavior

On `/books`, typing a query (2+ characters, debounced) shows merged
results as a five-per-row bookshelf grid (`BookShelfCover`): each cover
sits on its own walnut-wood shelf ledge, title/author caption below.
Results merge instant matches from the local Postgres cache
(`books.search_vector` full-text search) with live Google Books results
(the provider now tries up to three query variants — exact phrase,
per-significant-term, and raw — merged/deduped; see `architecture.md`).
The merged list is ranked client-side by title/author match quality
(exact > prefix > phrase > partial token match), not by which source
returned a result first — see `architecture.md`'s "Search result
ranking". Clicking any result imports it into the local cache if not
already there, then navigates to its detail page. The query itself
lives in the URL's `q` param (not just local state), so navigating to a
book and back restores the same search instead of resetting to a blank
box.

## Requirements

- `googleBooksApi.ts` exports `searchGoogleBooks()`, `getGoogleBookById()`,
  and the `GoogleBooksVolume`/`GoogleBooksVolumeInfo` types directly;
  `api/bookMapping.ts`, `api/bookImport.ts`, and `hooks/useBookSearch.ts`
  all consume `GoogleBooksVolume` by field name
  (`volume.volumeInfo.title`, etc.) rather than a translated
  provider-neutral type. There is no interface layer as of ADR-009.
- Import (`importBookFromGoogleBooks`): look up by `(provider, external_id)`;
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

- Any metadata source other than Google Books — as of ADR-009 there is
  no abstraction layer, so adding one would mean editing
  `googleBooksApi.ts`'s call sites directly (or reintroducing an
  interface at that point).
- Scheduled/background refresh — caching is refresh-on-read only, since
  there's no server to run a cron job on.

## Implementation status

Implemented. `src/services/metadata/`, `src/api/bookImport.ts`,
`src/api/bookMapping.ts`, `src/lib/genreMapping.ts`,
`src/hooks/useBookSearch.ts`, `src/pages/BookSearch.tsx`,
`src/components/BookShelfCover.tsx`, `src/components/BookShelfCover.css`
(grid/shelf presentation layer, added 2026-07-31 — the search/import
logic above is unchanged by this).

## Open questions

Whether a Google Books API key is actually provisioned and
referrer-restricted — see `working/open-questions.md`.
