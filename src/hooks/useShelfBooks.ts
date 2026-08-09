import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addBookToShelf,
  getAllShelvedBooksForProfile,
  getShelfBooks,
  removeBookFromShelf,
} from "../services/supabase/shelves";

export function useShelfBooks(shelfId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["shelves", shelfId, "books"];

  const shelfBooksQuery = useQuery({
    queryKey,
    queryFn: () => getShelfBooks(shelfId!),
    enabled: !!shelfId,
  });

  const addMutation = useMutation({
    mutationFn: (bookId: string) => addBookToShelf(shelfId!, bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (bookId: string) => removeBookFromShelf(shelfId!, bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    shelfBooks: shelfBooksQuery.data ?? [],
    isLoading: shelfBooksQuery.isLoading,
    addBook: addMutation.mutate,
    isAdding: addMutation.isPending,
    removeBook: removeMutation.mutate,
    isRemoving: removeMutation.isPending,
  };
}

/** Every book across every one of a profile's shelves, deduplicated —
 * powers the "All Books" safety-net row. */
export function useAllShelvedBooks(profileId: string | undefined) {
  const query = useQuery({
    queryKey: ["shelf_books", "all-for-profile", profileId],
    queryFn: () => getAllShelvedBooksForProfile(profileId!),
    enabled: !!profileId,
  });

  return {
    books: query.data ?? [],
    isLoading: query.isLoading,
  };
}
