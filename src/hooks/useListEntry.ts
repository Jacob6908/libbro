import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import {
  deleteListEntry,
  getListEntryForBook,
  upsertListEntry,
} from "../services/supabase/listEntries";
import type { ReadingStatus } from "../types/database.types";

export interface SaveListEntryInput {
  status: ReadingStatus;
  percentComplete: number;
  rating: number | null;
  review: string | null;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export function useListEntry(bookId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["list_entries", user?.id, bookId];

  const entryQuery = useQuery({
    queryKey,
    queryFn: () => getListEntryForBook(user!.id, bookId),
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: (input: SaveListEntryInput) => {
      const existing = entryQuery.data;
      const startedAt =
        input.status === "reading" && !existing?.started_at
          ? todayIso()
          : (existing?.started_at ?? null);
      const finishedAt =
        input.status === "completed"
          ? todayIso()
          : (existing?.finished_at ?? null);

      return upsertListEntry({
        userId: user!.id,
        bookId,
        status: input.status,
        percentComplete: input.percentComplete,
        rating: input.rating,
        review: input.review,
        startedAt,
        finishedAt,
      });
    },
    onSuccess: (entry) => {
      queryClient.setQueryData(queryKey, entry);
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => deleteListEntry(user!.id, bookId),
    onSuccess: () => {
      queryClient.setQueryData(queryKey, null);
    },
  });

  return {
    entry: entryQuery.data ?? null,
    isLoading: entryQuery.isLoading,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    remove: removeMutation.mutate,
    isRemoving: removeMutation.isPending,
  };
}
