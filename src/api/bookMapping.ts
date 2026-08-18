import type {
  GoogleBooksIndustryIdentifier,
  GoogleBooksVolume,
} from "../services/metadata/googleBooksApi";
import type { BookInsert } from "../types/database.types";
import { matchGenreSlugWithFallback } from "../lib/genreMapping";
import { resolveGenreIdForCategory } from "../services/supabase/genres";

/** Valid Google Books volume id shape - defensive check before it touches the DB or a fetch URL. */
export function isValidExternalId(externalId: string): boolean {
  return /^[A-Za-z0-9_-]{1,64}$/.test(externalId);
}

function parsePublishedYear(
  publishedDate: string | null | undefined
): number | null {
  if (!publishedDate) return null;
  const match = /^(\d{4})/.exec(publishedDate);
  return match ? Number(match[1]) : null;
}

/** Google Books descriptions often embed raw HTML (<b>, <br>, ...) - strip it to plain text. */
function stripHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .trim();
  return text || null;
}

function extractIsbn(
  identifiers: GoogleBooksIndustryIdentifier[] | undefined,
  type: "ISBN_13" | "ISBN_10"
): string | null {
  return identifiers?.find((id) => id.type === type)?.identifier ?? null;
}

export function mapGoogleBooksVolumeToRow(
  volume: GoogleBooksVolume
): BookInsert {
  const info = volume.volumeInfo;
  return {
    provider: "google_books",
    external_id: volume.id,
    title: info.title,
    subtitle: info.subtitle ?? null,
    authors: info.authors ?? [],
    description: stripHtml(info.description),
    isbn_13: extractIsbn(info.industryIdentifiers, "ISBN_13"),
    isbn_10: extractIsbn(info.industryIdentifiers, "ISBN_10"),
    page_count: info.pageCount ?? null,
    published_date: info.publishedDate ?? null,
    published_year: parsePublishedYear(info.publishedDate),
    publisher: info.publisher ?? null,
    language: info.language ?? null,
    cover_image_url: info.imageLinks?.thumbnail ?? null,
    average_rating: info.averageRating ?? null,
    ratings_count: info.ratingsCount ?? null,
    raw_categories: info.categories ?? [],
  };
}

/** Resolves each raw category to a genre id (deduped, nulls dropped). */
export async function resolveGenreIdsForCategories(
  categories: string[]
): Promise<number[]> {
  const ids = await Promise.all(
    categories.map((category) =>
      resolveGenreIdForCategory(category, matchGenreSlugWithFallback(category))
    )
  );

  return [...new Set(ids.filter((id): id is number => id !== null))];
}
