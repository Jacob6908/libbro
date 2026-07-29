import supabase from "../supabase-client";
import type { Book } from "../types/database.types";

const W_EXPLICIT = 2;
const W_INFERRED = 1;
const TOP_GENRE_COUNT = 6;

async function getExplicitGenreWeights(
  userId: string
): Promise<Map<number, number>> {
  const { data, error } = await supabase
    .from("profile_genre_preferences")
    .select("genre_id, weight")
    .eq("profile_id", userId);

  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.genre_id, row.weight]));
}

async function getInferredGenreAffinity(
  userId: string
): Promise<Map<number, number>> {
  const { data: ratedEntries, error } = await supabase
    .from("list_entries")
    .select("book_id, rating")
    .eq("user_id", userId)
    .not("rating", "is", null);

  if (error) throw error;
  if (!ratedEntries || ratedEntries.length === 0) return new Map();

  const ratingByBookId = new Map(
    ratedEntries.map((entry) => [entry.book_id, entry.rating!])
  );

  const { data: genreRows, error: genreError } = await supabase
    .from("book_genres")
    .select("book_id, genre_id")
    .in("book_id", [...ratingByBookId.keys()]);

  if (genreError) throw genreError;

  const affinity = new Map<number, number>();
  for (const row of genreRows ?? []) {
    const rating = ratingByBookId.get(row.book_id);
    if (rating == null) continue;
    const delta = rating - 3; // center a 1-5 rating on its midpoint
    affinity.set(row.genre_id, (affinity.get(row.genre_id) ?? 0) + delta);
  }
  return affinity;
}

async function getTrackedBookIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("list_entries")
    .select("book_id")
    .eq("user_id", userId);

  if (error) throw error;
  return new Set((data ?? []).map((row) => row.book_id));
}

async function getPopularBooks(
  excludeIds: Set<string>,
  limit: number
): Promise<Book[]> {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("average_rating", { ascending: false, nullsFirst: false })
    .order("ratings_count", { ascending: false, nullsFirst: false })
    .limit(limit + excludeIds.size);

  if (error) throw error;
  return (data ?? [])
    .filter((book) => !excludeIds.has(book.id))
    .slice(0, limit);
}

/**
 * Content-based recommendations: explicit genre preferences + inferred
 * per-genre affinity from the user's own ratings. No collaborative
 * filtering (there's no social graph in v1 to build one from). Falls back
 * to popularity ordering for a cold-start user with no signal at all.
 */
export async function getRecommendationsForUser(
  userId: string,
  limit = 20
): Promise<Book[]> {
  const [explicit, inferred, trackedIds] = await Promise.all([
    getExplicitGenreWeights(userId),
    getInferredGenreAffinity(userId),
    getTrackedBookIds(userId),
  ]);

  const combined = new Map<number, number>();
  for (const genreId of new Set([...explicit.keys(), ...inferred.keys()])) {
    const score =
      (explicit.get(genreId) ?? 0) * W_EXPLICIT +
      (inferred.get(genreId) ?? 0) * W_INFERRED;
    if (score > 0) combined.set(genreId, score);
  }

  if (combined.size === 0) {
    return getPopularBooks(trackedIds, limit);
  }

  const topGenreIds = [...combined.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_GENRE_COUNT)
    .map(([genreId]) => genreId);

  const { data: candidateGenreRows, error } = await supabase
    .from("book_genres")
    .select("book_id, genre_id")
    .in("genre_id", topGenreIds);

  if (error) throw error;

  const genreScoreByBook = new Map<string, number>();
  for (const row of candidateGenreRows ?? []) {
    if (trackedIds.has(row.book_id)) continue;
    const genreScore = combined.get(row.genre_id) ?? 0;
    genreScoreByBook.set(
      row.book_id,
      (genreScoreByBook.get(row.book_id) ?? 0) + genreScore
    );
  }

  const candidateIds = [...genreScoreByBook.keys()];
  if (candidateIds.length === 0) {
    return getPopularBooks(trackedIds, limit);
  }

  const { data: books, error: booksError } = await supabase
    .from("books")
    .select("*")
    .in("id", candidateIds);

  if (booksError) throw booksError;

  const scored = (books ?? []).map((book) => {
    const genreScore = genreScoreByBook.get(book.id) ?? 0;
    const popularityBoost =
      (book.average_rating ?? 0) * 0.1 +
      Math.log10((book.ratings_count ?? 0) + 1);
    return { book, score: genreScore + popularityBoost };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((entry) => entry.book);
}

/** Per-book "similar to this" - no user context, ranked by shared genres and author overlap. */
export async function getSimilarBooks(
  bookId: string,
  limit = 10
): Promise<Book[]> {
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .single();

  if (bookError) throw bookError;

  const { data: genreRows, error: genreError } = await supabase
    .from("book_genres")
    .select("genre_id")
    .eq("book_id", bookId);

  if (genreError) throw genreError;
  const genreIds = (genreRows ?? []).map((row) => row.genre_id);

  const genreMatchCount = new Map<string, number>();
  if (genreIds.length > 0) {
    const { data: candidateGenreRows, error } = await supabase
      .from("book_genres")
      .select("book_id, genre_id")
      .in("genre_id", genreIds)
      .neq("book_id", bookId);

    if (error) throw error;
    for (const row of candidateGenreRows ?? []) {
      genreMatchCount.set(
        row.book_id,
        (genreMatchCount.get(row.book_id) ?? 0) + 1
      );
    }
  }

  let authorCandidateIds: string[] = [];
  if (book.authors.length > 0) {
    const { data, error } = await supabase
      .from("books")
      .select("id")
      .overlaps("authors", book.authors)
      .neq("id", bookId)
      .limit(20);

    if (error) throw error;
    authorCandidateIds = (data ?? []).map((row) => row.id);
  }

  const authorMatchIds = new Set(authorCandidateIds);
  const candidateIds = new Set([...genreMatchCount.keys(), ...authorMatchIds]);
  if (candidateIds.size === 0) return [];

  const { data: candidateBooks, error: fetchError } = await supabase
    .from("books")
    .select("*")
    .in("id", [...candidateIds]);

  if (fetchError) throw fetchError;

  const scored = (candidateBooks ?? []).map((candidate) => {
    const genreMatches = genreMatchCount.get(candidate.id) ?? 0;
    const authorBoost = authorMatchIds.has(candidate.id) ? 2 : 0;
    return { book: candidate, score: genreMatches + authorBoost };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((entry) => entry.book);
}
