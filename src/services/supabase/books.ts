import supabase from "../../supabase-client";
import type { Book, BookGenre, BookInsert } from "../../types/database.types";

export async function getBookByExternalId(
  provider: string,
  externalId: string
): Promise<Book | null> {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("provider", provider)
    .eq("external_id", externalId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getBookById(id: string): Promise<Book | null> {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertBook(row: BookInsert): Promise<Book> {
  const { data, error } = await supabase
    .from("books")
    .upsert(
      { ...row, fetched_at: new Date().toISOString() },
      { onConflict: "provider,external_id" }
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function replaceBookGenres(
  bookId: string,
  genreIds: number[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("book_genres")
    .delete()
    .eq("book_id", bookId);

  if (deleteError) throw deleteError;

  if (genreIds.length === 0) return;

  const rows: BookGenre[] = genreIds.map((genreId) => ({
    book_id: bookId,
    genre_id: genreId,
  }));

  const { error: insertError } = await supabase
    .from("book_genres")
    .insert(rows);

  if (insertError) throw insertError;
}

export async function searchLocalBooks(
  query: string,
  limit = 20
): Promise<Book[]> {
  const tsQuery = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => `${term}:*`)
    .join(" & ");

  if (!tsQuery) return [];

  const { data, error } = await supabase
    .from("books")
    .select("*")
    .textSearch("search_vector", tsQuery, { type: "plain", config: "english" })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getGenreIdsForBook(bookId: string): Promise<number[]> {
  const { data, error } = await supabase
    .from("book_genres")
    .select("genre_id")
    .eq("book_id", bookId);

  if (error) throw error;
  return (data ?? []).map((row) => row.genre_id);
}
