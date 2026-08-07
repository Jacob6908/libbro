import supabase from "../supabase-client";
import { getBookById } from "./supabase/books";
import { getAllGenres } from "./supabase/genres";
import type { Book } from "../types/database.types";

const W_EXPLICIT = 2;
const W_INFERRED = 1;
const TOP_GENRE_COUNT = 6;
const LOVED_BOOK_COUNT = 3;
const LONGER_THAN_USUAL_FACTOR = 1.25;
const COVER_ART_BOOST = 0.35;
const CATEGORY_CANDIDATE_FACTOR = 4;

export interface RecommendationCategory {
  id: string;
  title: string;
  books: Book[];
}

function combineGenreScores(
  explicit: Map<number, number>,
  inferred: Map<number, number>
): Map<number, number> {
  const combined = new Map<number, number>();
  for (const genreId of new Set([...explicit.keys(), ...inferred.keys()])) {
    const score =
      (explicit.get(genreId) ?? 0) * W_EXPLICIT +
      (inferred.get(genreId) ?? 0) * W_INFERRED;
    if (score > 0) combined.set(genreId, score);
  }
  return combined;
}

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
    .limit(limit * 3 + excludeIds.size);

  if (error) throw error;
  return rankByBookQuality(
    (data ?? []).filter((book) => hasCoverArt(book) && !excludeIds.has(book.id))
  ).slice(0, limit);
}

function scoreBookQuality(book: Book): number {
  const ratingBoost = (book.average_rating ?? 0) * 0.15;
  const confidenceBoost = Math.log10((book.ratings_count ?? 0) + 1);
  const coverBoost = book.cover_image_url ? COVER_ART_BOOST : 0;
  return ratingBoost + confidenceBoost + coverBoost;
}

function rankByBookQuality(books: Book[]): Book[] {
  return [...books].sort((a, b) => {
    const scoreDelta = scoreBookQuality(b) - scoreBookQuality(a);
    if (scoreDelta !== 0) return scoreDelta;
    return a.title.localeCompare(b.title);
  });
}

function hasCoverArt(book: Book): boolean {
  return book.cover_image_url != null && book.cover_image_url.trim() !== "";
}

function takeFreshBooks(
  books: Book[],
  seenIds: Set<string>,
  limit: number
): Book[] {
  const fresh: Book[] = [];
  for (const book of books) {
    if (!hasCoverArt(book)) continue;
    if (seenIds.has(book.id)) continue;
    seenIds.add(book.id);
    fresh.push(book);
    if (fresh.length >= limit) break;
  }
  return fresh;
}

function pushCategory(
  categories: RecommendationCategory[],
  seenIds: Set<string>,
  category: RecommendationCategory,
  limit: number
): void {
  const books = takeFreshBooks(category.books, seenIds, limit);
  if (books.length > 0) {
    categories.push({ ...category, books });
  }
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

  const combined = combineGenreScores(explicit, inferred);
  return getPersonalizedBooks(combined, trackedIds, limit);
}

async function getPersonalizedBooks(
  combined: Map<number, number>,
  trackedIds: Set<string>,
  limit: number
): Promise<Book[]> {
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

  const scored = (books ?? []).filter(hasCoverArt).map((book) => {
    const genreScore = genreScoreByBook.get(book.id) ?? 0;
    return { book, score: genreScore + scoreBookQuality(book) };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.book.title.localeCompare(b.book.title);
  });
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

  const scored = (candidateBooks ?? []).filter(hasCoverArt).map((candidate) => {
    const genreMatches = genreMatchCount.get(candidate.id) ?? 0;
    const authorBoost = authorMatchIds.has(candidate.id) ? 2 : 0;
    return {
      book: candidate,
      score: genreMatches + authorBoost + scoreBookQuality(candidate),
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.book.title.localeCompare(b.book.title);
  });
  return scored.slice(0, limit).map((entry) => entry.book);
}

async function getBooksForGenre(
  genreId: number,
  trackedIds: Set<string>,
  limit: number
): Promise<Book[]> {
  const { data: genreRows, error } = await supabase
    .from("book_genres")
    .select("book_id")
    .eq("genre_id", genreId);

  if (error) throw error;

  const candidateIds = (genreRows ?? [])
    .map((row) => row.book_id)
    .filter((id) => !trackedIds.has(id));
  if (candidateIds.length === 0) return [];

  const { data: books, error: booksError } = await supabase
    .from("books")
    .select("*")
    .in("id", candidateIds)
    .order("average_rating", { ascending: false, nullsFirst: false })
    .order("ratings_count", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (booksError) throw booksError;
  return rankByBookQuality((books ?? []).filter(hasCoverArt));
}

async function getTopRatedBooks(
  userId: string,
  count: number
): Promise<Book[]> {
  const { data, error } = await supabase
    .from("list_entries")
    .select("book_id, rating, finished_at, created_at")
    .eq("user_id", userId)
    .gte("rating", 4)
    .order("rating", { ascending: false })
    .order("finished_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(count);

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const books = await Promise.all(
    data.map((entry) => getBookById(entry.book_id))
  );
  return books.filter((book): book is Book => book != null);
}

async function getLongerThanUsualBooks(
  trackedIds: Set<string>,
  limit: number
): Promise<Book[] | null> {
  if (trackedIds.size === 0) return null;

  const { data: trackedBooks, error } = await supabase
    .from("books")
    .select("page_count")
    .in("id", [...trackedIds])
    .not("page_count", "is", null);

  if (error) throw error;

  const pageCounts = (trackedBooks ?? [])
    .map((book) => book.page_count)
    .filter((count): count is number => count != null);
  if (pageCounts.length === 0) return null;

  const averagePageCount =
    pageCounts.reduce((sum, count) => sum + count, 0) / pageCounts.length;
  // page_count is an integer column - a fractional threshold makes
  // PostgREST reject the `gt` filter outright (400).
  const threshold = Math.round(averagePageCount * LONGER_THAN_USUAL_FACTOR);

  const { data: candidates, error: candidatesError } = await supabase
    .from("books")
    .select("*")
    .gt("page_count", threshold)
    .order("average_rating", { ascending: false, nullsFirst: false })
    .limit(limit + trackedIds.size);

  if (candidatesError) throw candidatesError;

  return (candidates ?? [])
    .filter((book) => hasCoverArt(book) && !trackedIds.has(book.id))
    .slice(0, limit);
}

/**
 * Netflix-style category feed: several named rows instead of one blended
 * list. Category count varies with how much signal the user has (genre
 * prefs, ratings, tracked books) rather than being padded to a fixed
 * count - a cold-start user still falls back to a single popularity row.
 */
export async function getRecommendationCategories(
  userId: string,
  booksPerCategory = 12
): Promise<RecommendationCategory[]> {
  const candidateLimit = booksPerCategory * CATEGORY_CANDIDATE_FACTOR;
  const [explicit, inferred, trackedIds, genres] = await Promise.all([
    getExplicitGenreWeights(userId),
    getInferredGenreAffinity(userId),
    getTrackedBookIds(userId),
    getAllGenres(),
  ]);

  const combined = combineGenreScores(explicit, inferred);
  const genreNameById = new Map(genres.map((genre) => [genre.id, genre.name]));
  const topGenreIds = [...combined.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_GENRE_COUNT)
    .map(([genreId]) => genreId);

  const [personalized, genreBooksLists, popular, lovedBooks, longerBooks] =
    await Promise.all([
      combined.size > 0
        ? getPersonalizedBooks(combined, trackedIds, candidateLimit)
        : Promise.resolve([]),
      Promise.all(
        topGenreIds.map((genreId) =>
          getBooksForGenre(genreId, trackedIds, candidateLimit)
        )
      ),
      getPopularBooks(trackedIds, candidateLimit),
      getTopRatedBooks(userId, LOVED_BOOK_COUNT),
      getLongerThanUsualBooks(trackedIds, candidateLimit),
    ]);

  const similarLists = await Promise.all(
    lovedBooks.map((book) => getSimilarBooks(book.id, candidateLimit))
  );

  const categories: RecommendationCategory[] = [];
  const seenIds = new Set(trackedIds);

  if (combined.size > 0) {
    pushCategory(
      categories,
      seenIds,
      {
        id: "top-picks",
        title: "Top picks for you",
        books: personalized,
      },
      booksPerCategory
    );
  }

  topGenreIds.forEach((genreId, index) => {
    const books = genreBooksLists[index];
    const genreName = genreNameById.get(genreId);
    if (books.length > 0 && genreName) {
      pushCategory(
        categories,
        seenIds,
        {
          id: `genre-${genreId}`,
          title: `${genreName} for you`,
          books,
        },
        booksPerCategory
      );
    }
  });

  lovedBooks.forEach((book, index) => {
    const books = similarLists[index];
    if (books.length > 0) {
      pushCategory(
        categories,
        seenIds,
        {
          id: `similar-${book.id}`,
          title: `Because you loved ${book.title}`,
          books,
        },
        booksPerCategory
      );
    }
  });

  if (longerBooks && longerBooks.length > 0) {
    pushCategory(
      categories,
      seenIds,
      {
        id: "longer",
        title: "Longer than you'd usually read",
        books: longerBooks,
      },
      booksPerCategory
    );
  }

  pushCategory(
    categories,
    seenIds,
    {
      id: "popular",
      title: "Highly rated overall",
      books: popular,
    },
    booksPerCategory
  );

  return categories;
}
