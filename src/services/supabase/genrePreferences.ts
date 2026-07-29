import supabase from "../../supabase-client";
import type { Genre, ProfileGenrePreference } from "../../types/database.types";

export interface GenrePreferenceWithGenre extends ProfileGenrePreference {
  genre: Genre;
}

export async function getGenrePreferences(
  profileId: string
): Promise<GenrePreferenceWithGenre[]> {
  const { data, error } = await supabase
    .from("profile_genre_preferences")
    .select("profile_id, genre_id, weight, genre:genres(*)")
    .eq("profile_id", profileId);

  if (error) throw error;
  return (data ?? []) as unknown as GenrePreferenceWithGenre[];
}

export async function setGenrePreference(
  profileId: string,
  genreId: number,
  weight: number
): Promise<void> {
  const { error } = await supabase
    .from("profile_genre_preferences")
    .upsert(
      { profile_id: profileId, genre_id: genreId, weight },
      { onConflict: "profile_id,genre_id" }
    );

  if (error) throw error;
}

export async function removeGenrePreference(
  profileId: string,
  genreId: number
): Promise<void> {
  const { error } = await supabase
    .from("profile_genre_preferences")
    .delete()
    .eq("profile_id", profileId)
    .eq("genre_id", genreId);

  if (error) throw error;
}
