const GOOGLE_BOOKS_ENDPOINT = "https://www.googleapis.com/books/v1/volumes";
const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY as string | undefined;

export interface GoogleBooksIndustryIdentifier {
  type: string;
  identifier: string;
}

export interface GoogleBooksVolumeInfo {
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

export interface GoogleBooksVolume {
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
  { retries = 2, signal }: { retries?: number; signal?: AbortSignal } = {}
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, { signal });

    if (response.ok) {
      return response;
    }

    if (response.status === 429 || response.status >= 500) {
      lastError = new Error(`Google Books request failed: ${response.status}`);
      const backoffMs = 500 * 2 ** attempt;
      await abortableDelay(backoffMs, signal);
      continue;
    }

    throw new Error(`Google Books request failed: ${response.status}`);
  }

  throw lastError ?? new Error("Google Books request failed");
}

function abortableDelay(delayMs: number, signal?: AbortSignal): Promise<void> {
  if (!signal) {
    return new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  if (signal.aborted) {
    return Promise.reject(signal.reason);
  }

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(resolve, delayMs);

    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeoutId);
        reject(signal.reason);
      },
      { once: true }
    );
  });
}

/**
 * Google Books' `thumbnail` link is a ~128px-wide image with a decorative
 * page-curl overlay baked in, then gets stretched to fill much larger grid
 * cells in the UI - that upscaling is what reads as blurry/grainy cover art.
 * The same underlying image is available larger via the `zoom` param (higher
 * = bigger) with the curl decoration removed via `edge`.
 *
 * This only holds for volumes that actually have a real front-cover scan,
 * signaled by Google including `edge=curl` in the original URL. For older/
 * library-catalog-only volumes (no `edge` param at all), asking for
 * `zoom=2` doesn't return a bigger version of the same cover - it returns a
 * different, degenerate asset (observed: a ~300x48px spine-label crop),
 * which stretches into a giant blurry text fragment in the grid. Leave
 * those untouched at their original zoom rather than "enhancing" them into
 * garbage.
 */
export function enhanceGoogleBooksCoverUrl(url: string): string {
  try {
    const enhanced = new URL(url.replace(/^http:/, "https:"));
    if (!enhanced.searchParams.has("edge")) {
      return enhanced.toString();
    }
    enhanced.searchParams.set("zoom", "2");
    enhanced.searchParams.delete("edge");
    return enhanced.toString();
  } catch {
    return url;
  }
}

/** Applies the cover-quality fix in place so every consumer gets it for free. */
function withEnhancedCover(volume: GoogleBooksVolume): GoogleBooksVolume {
  const thumbnail = volume.volumeInfo.imageLinks?.thumbnail;
  if (!thumbnail) return volume;

  return {
    ...volume,
    volumeInfo: {
      ...volume.volumeInfo,
      imageLinks: {
        ...volume.volumeInfo.imageLinks,
        thumbnail: enhanceGoogleBooksCoverUrl(thumbnail),
      },
    },
  };
}

function withApiKey(url: URL): URL {
  if (apiKey) {
    url.searchParams.set("key", apiKey);
  }
  return url;
}

const COMBINING_DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(COMBINING_DIACRITICS, "")
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

/**
 * Order matters here, not just content: `searchGoogleBooks()` dedupes by
 * first occurrence across these queries, and callers break scoring ties by
 * that same order - so whichever variant runs first effectively wins ties.
 * The raw query goes first because it's the one Google ranks by its own
 * relevance/popularity signal (matching what books.google.com shows); the
 * `intitle:` variants exist only to catch additional matches the raw query
 * missed; run after so they can add recall without out-ranking it. It's
 * also the query variant we've seen used for prefix-typed input (e.g. "don
 * qu") most reliably returns something sensible - `intitle:"don qu"` as a
 * literal quoted phrase can match unrelated titles that merely contain that
 * substring.
 */
function getSearchQueries(query: string): string[] {
  const terms = getSignificantSearchTerms(query);
  const queries = [
    query,
    query.split(/\s+/).length > 1 ? `intitle:"${query}"` : null,
    terms.length > 0 ? terms.map((term) => `intitle:${term}`).join(" ") : null,
  ].filter((value): value is string => value != null);

  return [...new Set(queries)];
}

export async function searchGoogleBooks(
  query: string,
  { limit = 20, signal }: { limit?: number; signal?: AbortSignal } = {}
): Promise<GoogleBooksVolume[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const queries = getSearchQueries(trimmed);

  const results = await Promise.allSettled(
    queries.map((searchQuery) =>
      fetchGoogleBooksPage(searchQuery, limit, signal)
    )
  );
  const successfulResults = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );

  if (successfulResults.length === 0) {
    const rejected = results.find((result) => result.status === "rejected");
    if (rejected?.status === "rejected") throw rejected.reason;
  }

  const byId = new Map<string, GoogleBooksVolume>();
  for (const volume of successfulResults) {
    if (!byId.has(volume.id)) {
      byId.set(volume.id, volume);
    }
  }

  return [...byId.values()].slice(0, limit);
}

async function fetchGoogleBooksPage(
  query: string,
  limit: number,
  signal?: AbortSignal
): Promise<GoogleBooksVolume[]> {
  const url = withApiKey(new URL(GOOGLE_BOOKS_ENDPOINT));
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", String(limit));

  const response = await fetchWithRetry(url.toString(), { signal });
  const data = (await response.json()) as GoogleBooksSearchResponse;

  return (data.items ?? []).map(withEnhancedCover);
}

export async function getGoogleBookById(
  externalId: string
): Promise<GoogleBooksVolume | null> {
  const url = withApiKey(new URL(`${GOOGLE_BOOKS_ENDPOINT}/${externalId}`));

  const response = await fetch(url.toString());

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Google Books request failed: ${response.status}`);
  }

  const volume = (await response.json()) as GoogleBooksVolume;
  return withEnhancedCover(volume);
}
