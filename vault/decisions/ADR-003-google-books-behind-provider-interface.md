---
status: superseded
date: 2026-07-26
---

> **Superseded 2026-08-18** by
> `ADR-009-remove-book-metadata-provider-abstraction.md`. The
> `BookMetadataProvider` interface described below was removed — kept
> here unedited for the historical record of why it was introduced, per
> this vault's rule against rewriting accepted ADRs. Google Books is
> still the metadata source; only the abstraction-boundary decision
> changed.

# ADR-003: Google Books as the metadata source, behind a provider interface

## Context

The `issho` study's most-flagged finding was that its AniList integration
had no abstraction boundary at all — AniList's GraphQL types and query
shapes were threaded directly through search, import, mapping, and
franchise-resolution code. The user wanted libbro's book-metadata
integration to be "as plug and play as possible" so a future provider
swap wouldn't require touching every consumer.

## Decision

Use the Google Books Volumes API as the v1 metadata source, but put a
`BookMetadataProvider` interface (`search()`, `getById()`) between it and
the rest of the app. Only `src/services/metadata/googleBooksProvider.ts`
knows Google Books' actual response shape; everything else depends on the
provider-neutral `BookSearchResult`/`BookDetail` types.

## Rationale

Directly closes the specific gap identified in `issho`. The durable-cache
+ live-search hybrid shape (`books` table keyed by `(provider,
external_id)`, TTL-refreshed) was worth keeping from `issho`'s pattern —
only the vendor-coupling was the problem, not the overall architecture.

## Consequences

- Swapping providers later means writing a new `BookMetadataProvider`
  implementation and changing one export
  (`src/services/metadata/index.ts`), not touching search/import/mapping
  call sites.
- `books.provider` and `books.external_id` are already provider-generic
  columns, so a schema change isn't needed for a future swap either.
- Google Books' unauthenticated quota (~1000/day) is a real constraint;
  a restricted API key is expected via `VITE_GOOGLE_BOOKS_API_KEY`.

## Alternatives considered

- Open Library API — free, no key required, but coverage can be spottier
  for newer titles. Not chosen for v1.
- Both providers behind one interface with fallback — more resilient,
  more integration work; deferred, though the interface already in place
  makes this a plausible future addition rather than a rewrite.

## Evidence

`src/services/metadata/types.ts`, `src/services/metadata/googleBooksProvider.ts`,
`src/api/bookMapping.ts`, `src/api/bookImport.ts`.
