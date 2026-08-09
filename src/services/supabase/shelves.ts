import supabase from "../../supabase-client";
import type {
  Book,
  PublicReadingStatus,
  Shelf,
  ShelfBook,
} from "../../types/database.types";

export async function getShelvesForProfile(
  profileId: string
): Promise<Shelf[]> {
  const { data, error } = await supabase
    .from("shelves")
    .select("*")
    .eq("profile_id", profileId)
    .order("position");

  if (error) throw error;
  return data ?? [];
}

export async function createShelf(
  profileId: string,
  title: string,
  position: number
): Promise<Shelf> {
  const { data, error } = await supabase
    .from("shelves")
    .insert({ profile_id: profileId, title, position })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function renameShelf(
  shelfId: string,
  title: string
): Promise<Shelf> {
  const { data, error } = await supabase
    .from("shelves")
    .update({ title })
    .eq("id", shelfId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteShelf(shelfId: string): Promise<void> {
  const { error } = await supabase.from("shelves").delete().eq("id", shelfId);
  if (error) throw error;
}

export async function reorderShelves(
  updates: { id: string; position: number }[]
): Promise<void> {
  for (const { id, position } of updates) {
    const { error } = await supabase
      .from("shelves")
      .update({ position })
      .eq("id", id);
    if (error) throw error;
  }
}

export interface ShelfBookWithBook extends ShelfBook {
  book: Book;
}

export async function getShelfBooks(
  shelfId: string
): Promise<ShelfBookWithBook[]> {
  const { data, error } = await supabase
    .from("shelf_books")
    .select("*, book:books(*)")
    .eq("shelf_id", shelfId)
    .order("position");

  if (error) throw error;
  return (data ?? []) as unknown as ShelfBookWithBook[];
}

export async function addBookToShelf(
  shelfId: string,
  bookId: string
): Promise<void> {
  const { error } = await supabase
    .from("shelf_books")
    .upsert(
      { shelf_id: shelfId, book_id: bookId },
      { onConflict: "shelf_id,book_id", ignoreDuplicates: true }
    );
  if (error) throw error;
}

export async function removeBookFromShelf(
  shelfId: string,
  bookId: string
): Promise<void> {
  const { error } = await supabase
    .from("shelf_books")
    .delete()
    .eq("shelf_id", shelfId)
    .eq("book_id", bookId);
  if (error) throw error;
}

/** Which of the given shelves (expected: the caller's own custom shelves)
 * already contain this book. */
export async function getShelfIdsForBook(
  shelfIds: string[],
  bookId: string
): Promise<string[]> {
  if (shelfIds.length === 0) return [];

  const { data, error } = await supabase
    .from("shelf_books")
    .select("shelf_id")
    .eq("book_id", bookId)
    .in("shelf_id", shelfIds);

  if (error) throw error;
  return (data ?? []).map((row) => row.shelf_id);
}

export interface PublicReadingStatusWithBook extends PublicReadingStatus {
  book: Book;
}

/** Reads the `public_reading_status` view (a deliberately narrow subset of
 * `list_entries` that excludes `review`, exposed to any signed-in user)
 * and attaches book data with a separate query — resource embedding isn't
 * reliable through a plain view since it carries no real FK constraint. */
export async function getPublicReadingStatusForUser(
  userId: string
): Promise<PublicReadingStatusWithBook[]> {
  const { data: statuses, error: statusError } = await supabase
    .from("public_reading_status")
    .select("*")
    .eq("user_id", userId);

  if (statusError) throw statusError;
  if (!statuses || statuses.length === 0) return [];

  const bookIds = statuses.map((s) => s.book_id);
  const { data: books, error: booksError } = await supabase
    .from("books")
    .select("*")
    .in("id", bookIds);

  if (booksError) throw booksError;

  const booksById = new Map((books ?? []).map((b) => [b.id, b]));
  return statuses
    .filter((s) => booksById.has(s.book_id))
    .map((s) => ({ ...s, book: booksById.get(s.book_id)! }));
}
