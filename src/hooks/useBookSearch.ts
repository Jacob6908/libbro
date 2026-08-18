import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchGoogleBooks } from "../services/metadata/googleBooksApi";
import { searchLocalBooks } from "../services/supabase/books";
import type { Book } from "../types/database.types";
import type { GoogleBooksVolume } from "../services/metadata/googleBooksApi";

export interface MergedSearchResult {
  key: string;
  externalId: string;
  title: string;
  subtitle?: string | null;
  authors: string[];
  coverImageUrl?: string | null;
  /** Present when this result already exists in the local cache. */
  localBook: Book | null;
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "by",
  "for",
  "i",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
]);

const REMOTE_SEARCH_DEBOUNCE_MS = 400;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * Scores how well a title matches a search query, so results can be
 * ranked by relevance instead of by which source (local cache vs. Google
 * Books) returned them first. Neither the local full-text search nor the
 * merge step otherwise orders by relevance at all.
 */
function scoreSearchResult(result: MergedSearchResult, query: string): number {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 0;

  const title = normalizeSearchText(result.title);
  const titleWithSubtitle = normalizeSearchText(
    [result.title, result.subtitle].filter(Boolean).join(" ")
  );
  const authors = normalizeSearchText(result.authors.join(" "));
  const queryTokens = getSearchTokens(query);
  const coverBoost = result.coverImageUrl ? 35 : 0;

  if (title === normalizedQuery || titleWithSubtitle === normalizedQuery) {
    return 1000 + coverBoost;
  }

  if (title.startsWith(normalizedQuery)) return 900 + coverBoost;
  if (titleWithSubtitle.startsWith(normalizedQuery)) return 850 + coverBoost;
  if (containsWholePhrase(title, normalizedQuery)) return 800 + coverBoost;
  if (containsWholePhrase(titleWithSubtitle, normalizedQuery)) {
    return 760 + coverBoost;
  }

  const titleTokenScore = scoreTokenMatch(titleWithSubtitle, queryTokens);
  const authorTokenScore = scoreTokenMatch(authors, queryTokens);

  if (titleTokenScore > 0) return 400 + titleTokenScore + coverBoost;
  if (authorTokenScore > 0) return 150 + authorTokenScore + coverBoost;
  return 0;
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function getSearchTokens(query: string): string[] {
  const tokens = normalizeSearchText(query).split(" ").filter(Boolean);
  const meaningful = tokens.filter((token) => !STOP_WORDS.has(token));
  return meaningful.length > 0 ? meaningful : tokens;
}

function containsWholePhrase(value: string, phrase: string): boolean {
  return new RegExp(`(^|\\s)${escapeRegExp(phrase)}($|\\s)`).test(value);
}

function scoreTokenMatch(value: string, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 0;

  const valueTokens = value.split(" ").filter(Boolean);
  const matchedCount = queryTokens.filter((queryToken) =>
    valueTokens.some((valueToken) => valueToken.startsWith(queryToken))
  ).length;
  if (matchedCount === 0) return 0;

  const coverage = matchedCount / queryTokens.length;
  const inOrderBonus = areTokensInOrder(valueTokens, queryTokens) ? 75 : 0;
  const allTermsBonus = matchedCount === queryTokens.length ? 125 : 0;

  return Math.round(coverage * 250) + inOrderBonus + allTermsBonus;
}

function areTokensInOrder(
  valueTokens: string[],
  queryTokens: string[]
): boolean {
  let valueIndex = 0;

  for (const queryToken of queryTokens) {
    const nextIndex = valueTokens.findIndex(
      (valueToken, index) =>
        index >= valueIndex && valueToken.startsWith(queryToken)
    );
    if (nextIndex === -1) return false;
    valueIndex = nextIndex + 1;
  }

  return true;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mergeResults(
  localBooks: Book[],
  remoteVolumes: GoogleBooksVolume[],
  query: string
): MergedSearchResult[] {
  const localByExternalId = new Map(
    localBooks.map((book) => [book.external_id, book])
  );

  const merged: MergedSearchResult[] = localBooks.map((book) => ({
    key: book.external_id,
    externalId: book.external_id,
    title: book.title,
    subtitle: book.subtitle,
    authors: book.authors,
    coverImageUrl: book.cover_image_url,
    localBook: book,
  }));

  for (const volume of remoteVolumes) {
    if (localByExternalId.has(volume.id)) continue;
    const info = volume.volumeInfo;
    merged.push({
      key: volume.id,
      externalId: volume.id,
      title: info.title,
      subtitle: info.subtitle ?? null,
      authors: info.authors ?? [],
      coverImageUrl: info.imageLinks?.thumbnail ?? null,
      localBook: null,
    });
  }

  return merged
    .map((result, index) => ({
      result,
      index,
      score: scoreSearchResult(result, query),
    }))
    .sort((a, b) => {
      const aHasCover = Boolean(a.result.coverImageUrl);
      const bHasCover = Boolean(b.result.coverImageUrl);

      if (aHasCover !== bHasCover) return bHasCover ? 1 : -1;
      if (b.score !== a.score) return b.score - a.score;
      return a.index - b.index;
    })
    .map(({ result }) => result);
}

export function useBookSearch(query: string) {
  const trimmed = query.trim();
  const localEnabled = trimmed.length >= 2;
  const debouncedRemoteQuery = useDebouncedValue(
    trimmed,
    REMOTE_SEARCH_DEBOUNCE_MS
  );
  const remoteEnabled = debouncedRemoteQuery.length >= 2;

  const localQuery = useQuery({
    queryKey: ["books", "local-search", trimmed],
    queryFn: () => searchLocalBooks(trimmed),
    enabled: localEnabled,
  });

  const remoteQuery = useQuery({
    queryKey: ["books", "remote-search", debouncedRemoteQuery],
    queryFn: ({ signal }) =>
      searchGoogleBooks(debouncedRemoteQuery, { signal }),
    enabled: remoteEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const remoteResults =
    debouncedRemoteQuery === trimmed ? (remoteQuery.data ?? []) : [];

  const results = mergeResults(localQuery.data ?? [], remoteResults, trimmed);

  return {
    results,
    isLoading:
      localQuery.isLoading ||
      remoteQuery.isLoading ||
      (localEnabled && debouncedRemoteQuery !== trimmed),
    error: localQuery.error ?? remoteQuery.error,
  };
}
