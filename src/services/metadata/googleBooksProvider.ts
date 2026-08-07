import type {
  BookDetail,
  BookMetadataProvider,
  BookSearchResult,
} from "./types";

const GOOGLE_BOOKS_ENDPOINT = "https://www.googleapis.com/books/v1/volumes";
const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY as string | undefined;

interface GoogleBooksIndustryIdentifier {
  type: string;
  identifier: string;
}

interface GoogleBooksVolumeInfo {
  title: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  industryIdentifiers?: GoogleBooksIndustryIdentifier[];
  pageCount?: number;
  categories?: string[];
  averageRating?: number;
  ratingsCount?: number;
  imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  language?: string;
}

interface GoogleBooksVolume {
  id: string;
  volumeInfo: GoogleBooksVolumeInfo;
}

interface GoogleBooksSearchResponse {
  items?: GoogleBooksVolume[];
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

async function fetchWithRetry(
  url: string,
  { retries = 2 }: { retries?: number } = {}
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url);

    if (response.ok) {
      return response;
    }

    if (response.status === 429 || response.status >= 500) {
      lastError = new Error(`Google Books request failed: ${response.status}`);
      const backoffMs = 500 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      continue;
    }

    throw new Error(`Google Books request failed: ${response.status}`);
  }

  throw lastError ?? new Error("Google Books request failed");
}

function extractIsbn(
  identifiers: GoogleBooksIndustryIdentifier[] | undefined,
  type: "ISBN_13" | "ISBN_10"
): string | null {
  return identifiers?.find((id) => id.type === type)?.identifier ?? null;
}

function toSearchResult(volume: GoogleBooksVolume): BookSearchResult {
  const info = volume.volumeInfo;
  return {
    externalId: volume.id,
    title: info.title,
    subtitle: info.subtitle ?? null,
    authors: info.authors ?? [],
    coverImageUrl: info.imageLinks?.thumbnail ?? null,
    publishedDate: info.publishedDate ?? null,
  };
}

function toBookDetail(volume: GoogleBooksVolume): BookDetail {
  const info = volume.volumeInfo;
  return {
    ...toSearchResult(volume),
    description: info.description ?? null,
    isbn13: extractIsbn(info.industryIdentifiers, "ISBN_13"),
    isbn10: extractIsbn(info.industryIdentifiers, "ISBN_10"),
    pageCount: info.pageCount ?? null,
    categories: info.categories ?? [],
    publisher: info.publisher ?? null,
    language: info.language ?? null,
    averageRating: info.averageRating ?? null,
    ratingsCount: info.ratingsCount ?? null,
  };
}

function withApiKey(url: URL): URL {
  if (apiKey) {
    url.searchParams.set("key", apiKey);
  }
  return url;
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

function getSignificantSearchTerms(query: string): string[] {
  return normalizeSearchText(query)
    .split(" ")
    .filter((term) => term.length >= 3 && !STOP_WORDS.has(term));
}

function getSearchQueries(query: string): string[] {
  const terms = getSignificantSearchTerms(query);
  const queries = [
    query.split(/\s+/).length > 1 ? `intitle:"${query}"` : null,
    terms.length > 0 ? terms.map((term) => `intitle:${term}`).join(" ") : null,
    query,
  ].filter((value): value is string => value != null);

  return [...new Set(queries)];
}

async function search(
  query: string,
  { limit = 20 }: { limit?: number } = {}
): Promise<BookSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const queries = getSearchQueries(trimmed);

  const results = await Promise.allSettled(
    queries.map((searchQuery) => searchGoogleBooks(searchQuery, limit))
  );
  const successfulResults = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );

  if (successfulResults.length === 0) {
    const rejected = results.find((result) => result.status === "rejected");
    if (rejected?.status === "rejected") throw rejected.reason;
  }

  const byExternalId = new Map<string, BookSearchResult>();
  for (const result of successfulResults) {
    if (!byExternalId.has(result.externalId)) {
      byExternalId.set(result.externalId, result);
    }
  }

  return [...byExternalId.values()].slice(0, limit);
}

async function searchGoogleBooks(
  query: string,
  limit: number
): Promise<BookSearchResult[]> {
  const url = withApiKey(new URL(GOOGLE_BOOKS_ENDPOINT));
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(limit));

  const response = await fetchWithRetry(url.toString());
  const data = (await response.json()) as GoogleBooksSearchResponse;

  return (data.items ?? []).map(toSearchResult);
}

async function getById(externalId: string): Promise<BookDetail | null> {
  const url = withApiKey(new URL(`${GOOGLE_BOOKS_ENDPOINT}/${externalId}`));

  const response = await fetch(url.toString());

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Google Books request failed: ${response.status}`);
  }

  const volume = (await response.json()) as GoogleBooksVolume;
  return toBookDetail(volume);
}

export const googleBooksProvider: BookMetadataProvider = {
  providerName: "google_books",
  search,
  getById,
};
