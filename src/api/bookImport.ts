import { getGoogleBookById } from "../services/metadata/googleBooksApi";
import {
  getBookByExternalId,
  replaceBookGenres,
  upsertBook,
} from "../services/supabase/books";
import type { Book } from "../types/database.types";
import {
  isValidExternalId,
  mapGoogleBooksVolumeToRow,
  resolveGenreIdsForCategories,
} from "./bookMapping";

const STALE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const PROVIDER = "google_books";

/**
 * Returns the cached `books` row for a Google Books volume id, importing or
 * refreshing it first if it's missing or older than the TTL. Google Books
 * metadata changes far less often than issho's anime-airing-status source,
 * hence the longer TTL relative to issho's 7-day window.
 */
export async function importBookFromGoogleBooks(
  externalId: string
): Promise<Book> {
  if (!isValidExternalId(externalId)) {
    throw new Error(`Invalid book external id: ${externalId}`);
  }

  const existing = await getBookByExternalId(PROVIDER, externalId);

  if (existing) {
    const age = Date.now() - new Date(existing.fetched_at).getTime();
    if (age < STALE_TTL_MS) {
      return existing;
    }
  }

  const volume = await getGoogleBookById(externalId);

  if (!volume) {
    if (existing) return existing;
    throw new Error(`Book not found for external id: ${externalId}`);
  }

  const row = mapGoogleBooksVolumeToRow(volume);
  const book = await upsertBook(row);
  const genreIds = await resolveGenreIdsForCategories(row.raw_categories ?? []);
  await replaceBookGenres(book.id, genreIds);

  return book;
}
