import { useQuery } from "@tanstack/react-query";
import { bookMetadataProvider } from "../services/metadata";
import { searchLocalBooks } from "../services/supabase/books";
import type { Book } from "../types/database.types";
import type { BookSearchResult } from "../services/metadata/types";

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

function mergeResults(
  localBooks: Book[],
  remoteResults: BookSearchResult[]
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

  for (const remote of remoteResults) {
    if (localByExternalId.has(remote.externalId)) continue;
    merged.push({
      key: remote.externalId,
      externalId: remote.externalId,
      title: remote.title,
      subtitle: remote.subtitle,
      authors: remote.authors,
      coverImageUrl: remote.coverImageUrl,
      localBook: null,
    });
  }

  return merged;
}

export function useBookSearch(query: string) {
  const trimmed = query.trim();
  const enabled = trimmed.length >= 2;

  const localQuery = useQuery({
    queryKey: ["books", "local-search", trimmed],
    queryFn: () => searchLocalBooks(trimmed),
    enabled,
  });

  const remoteQuery = useQuery({
    queryKey: ["books", "remote-search", trimmed],
    queryFn: () => bookMetadataProvider.search(trimmed),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const results = mergeResults(localQuery.data ?? [], remoteQuery.data ?? []);

  return {
    results,
    isLoading: localQuery.isLoading || remoteQuery.isLoading,
    error: localQuery.error ?? remoteQuery.error,
  };
}
