---
status: accepted
date: 2026-08-18
---

# ADR-009: Remove the `BookMetadataProvider` abstraction

## Context

`ADR-003-google-books-behind-provider-interface.md` put a
`BookMetadataProvider` interface (`search()`, `getById()`) between
Google Books and the rest of the app, specifically to close a gap
identified in the `issho` reference-app study: `issho`'s AniList
integration had no abstraction boundary at all, so a future metadata-
source swap there would require touching every consumer.

After the rest of the app was built out, the user wanted to try moving
libbro's own search/import code closer to `issho`'s actual pattern —
consuming the vendor's response shape directly rather than through a
translated domain type — on the stated premise that this would make
search behavior "smoother and more predictable," and explicitly wanted
to evaluate it as a real branch before deciding whether to keep it.

## Decision

Remove the `BookMetadataProvider` interface and the provider-neutral
`BookSearchResult`/`BookDetail` types. `src/services/metadata/
googleBooksApi.ts` (renamed from `googleBooksProvider.ts`) now exports
Google Books' actual response shape (`GoogleBooksVolume`,
`GoogleBooksVolumeInfo`) directly; `api/bookMapping.ts`,
`api/bookImport.ts`, and `hooks/useBookSearch.ts` all consume that
vendor type by field name (`volume.volumeInfo.title`, etc.) instead of
a translated domain type — the same pattern `issho`'s
`api/animeMapping.ts` uses with `AniListMedia`.

Deliberately **not** touched: the local-cache + live-search hybrid
shape, the multi-variant query merge/dedupe, the client-side relevance
ranking (`scoreSearchResult`/`mergeResults`), the 14-day cache TTL,
HTML-stripping, and genre resolution. None of that logic depended on
the provider interface, and none of it changed.

## Rationale

Direct reversal of `ADR-003`'s stated rationale — evaluated as a real
branch (`issho-style-search`) rather than decided in the abstract, per
the user's request. Shipped as its own PR (#14) after review.

## Consequences

- A future metadata-source swap (e.g. adding Open Library) now means
  editing `googleBooksApi.ts`'s call sites directly (or reintroducing an
  interface at that point) rather than writing one new provider
  implementation behind an existing seam — `ADR-003`'s stated benefit no
  longer applies.
- `books.provider`/`books.external_id` remain provider-generic columns
  in the schema regardless (unaffected by this change — the interface
  removal is an application-code decision, not a schema one).
- Incidentally bundled with this change: a fix to
  `enhanceGoogleBooksCoverUrl` (only requests Google's `zoom=2` cover
  variant when the original URL already has an `edge=curl` marker,
  since volumes without one return a degenerate cropped asset at
  `zoom=2` — verified empirically). This fix is independent of the
  provider-abstraction decision and would apply regardless of which way
  ADR-003 vs. ADR-009 had gone; see `architecture.md`'s "Cover-image
  runtime fallback" for how it relates to the separate
  `validateAspectRatio` fallback shipped in PR #13, which still isn't
  wired into every cover-rendering call site — see
  `working/open-questions.md`.

## Alternatives considered

Keep `ADR-003`'s abstraction and only change search *behavior* (drop the
client-side relevance re-ranking, or the multi-variant query merge) —
offered to the user as narrower options; the user chose the full
abstraction removal instead.

## Evidence

`src/services/metadata/googleBooksApi.ts`, `src/services/metadata/
index.ts`, `src/api/bookMapping.ts`, `src/api/bookImport.ts`, `src/hooks/
useBookSearch.ts`. Shipped via branch `issho-style-search`, PR #14,
merged to `main` 2026-08-18. Verified before merge: `npm run lint`,
`npx tsc -b --noEmit`, and `npm run build` all passing; browser-driven
search/import smoke test against the local dev server (searched, opened
an unimported result, confirmed it wrote a correct `books` row with
clean HTML-stripped description and populated genres).
