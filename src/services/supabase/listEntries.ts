import supabase from "../../supabase-client";
import type {
  Book,
  ListEntry,
  ReadingStatus,
} from "../../types/database.types";

export interface ListEntryWithBook extends ListEntry {
  book: Book;
}

export async function getAllListEntriesWithBooks(
  userId: string
): Promise<ListEntryWithBook[]> {
  const { data, error } = await supabase
    .from("list_entries")
    .select("*, book:books(*)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as ListEntryWithBook[];
}

export async function getListEntryForBook(
  userId: string,
  bookId: string
): Promise<ListEntry | null> {
  const { data, error } = await supabase
    .from("list_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("book_id", bookId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export interface ListEntryInput {
  userId: string;
  bookId: string;
  status: ReadingStatus;
  percentComplete: number;
  rating: number | null;
  review: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export async function upsertListEntry(
  input: ListEntryInput
): Promise<ListEntry> {
  const { data, error } = await supabase
    .from("list_entries")
    .upsert(
      {
        user_id: input.userId,
        book_id: input.bookId,
        status: input.status,
        percent_complete: input.percentComplete,
        rating: input.rating,
        review: input.review,
        started_at: input.startedAt,
        finished_at: input.finishedAt,
      },
      { onConflict: "user_id,book_id" }
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteListEntry(
  userId: string,
  bookId: string
): Promise<void> {
  const { error } = await supabase
    .from("list_entries")
    .delete()
    .eq("user_id", userId)
    .eq("book_id", bookId);

  if (error) throw error;
}
