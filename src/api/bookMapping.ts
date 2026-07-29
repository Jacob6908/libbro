import type { BookDetail } from "../services/metadata/types";
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

export function mapBookDetailToRow(detail: BookDetail): BookInsert {
  return {
    provider: "google_books",
    external_id: detail.externalId,
    title: detail.title,
    subtitle: detail.subtitle ?? null,
    authors: detail.authors,
    description: stripHtml(detail.description),
    isbn_13: detail.isbn13 ?? null,
    isbn_10: detail.isbn10 ?? null,
    page_count: detail.pageCount ?? null,
    published_date: detail.publishedDate ?? null,
    published_year: parsePublishedYear(detail.publishedDate),
    publisher: detail.publisher ?? null,
    language: detail.language ?? null,
    cover_image_url: detail.coverImageUrl ?? null,
    average_rating: detail.averageRating ?? null,
    ratings_count: detail.ratingsCount ?? null,
    raw_categories: detail.categories,
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
