import supabase from "../../supabase-client";
import type { Genre } from "../../types/database.types";

export async function getAllGenres(): Promise<Genre[]> {
  const { data, error } = await supabase
    .from("genres")
    .select("*")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

/**
 * Resolves a raw Google Books category string to a genre id, using
 * `category_aliases` as a cache. Never overwrites an existing alias row
 * (manual corrections made in the SQL editor are preserved), and caches
 * unmatched categories with `genre_id: null` for later manual triage.
 */
export async function resolveGenreIdForCategory(
  rawCategory: string,
  fallbackSlug: string | null
): Promise<number | null> {
  const { data: existing, error: lookupError } = await supabase
    .from("category_aliases")
    .select("genre_id")
    .eq("raw_category", rawCategory)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing) return existing.genre_id;

  let genreId: number | null = null;

  if (fallbackSlug) {
    const { data: genre, error: genreError } = await supabase
      .from("genres")
      .select("id")
      .eq("slug", fallbackSlug)
      .maybeSingle();

    if (genreError) throw genreError;
    genreId = genre?.id ?? null;
  }

  const { error: insertError } = await supabase
    .from("category_aliases")
    .upsert(
      { raw_category: rawCategory, genre_id: genreId },
      { onConflict: "raw_category", ignoreDuplicates: true }
    );

  if (insertError) throw insertError;

  return genreId;
}
