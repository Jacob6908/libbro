import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createShelf,
  deleteShelf,
  getShelvesForProfile,
  renameShelf,
  reorderShelves,
} from "../services/supabase/shelves";
import type { Shelf } from "../types/database.types";

/** Shelf list + management for a given profile. Mutations rely on RLS to
 * reject anything but the owner — the UI is expected to only offer them
 * on the signed-in user's own profile. */
export function useShelves(profileId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["shelves", "all", profileId];

  const shelvesQuery = useQuery({
    queryKey,
    queryFn: () => getShelvesForProfile(profileId!),
    enabled: !!profileId,
  });

  const shelves = shelvesQuery.data ?? [];

  const createMutation = useMutation({
    mutationFn: (title: string) =>
      createShelf(profileId!, title, shelves.length),
    onSuccess: (shelf) => {
      queryClient.setQueryData(queryKey, [...shelves, shelf]);
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ shelfId, title }: { shelfId: string; title: string }) =>
      renameShelf(shelfId, title),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        queryKey,
        shelves.map((s: Shelf) => (s.id === updated.id ? updated : s))
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (shelfId: string) => deleteShelf(shelfId),
    onSuccess: (_data, shelfId) => {
      queryClient.setQueryData(
        queryKey,
        shelves.filter((s: Shelf) => s.id !== shelfId)
      );
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) =>
      reorderShelves(orderedIds.map((id, position) => ({ id, position }))),
    onSuccess: (_data, orderedIds) => {
      const byId = new Map(shelves.map((s: Shelf) => [s.id, s]));
      queryClient.setQueryData(
        queryKey,
        orderedIds
          .map((id, position) => {
            const shelf = byId.get(id);
            return shelf ? { ...shelf, position } : undefined;
          })
          .filter((s): s is Shelf => !!s)
      );
    },
  });

  return {
    shelves,
    isLoading: shelvesQuery.isLoading,
    createShelf: createMutation.mutate,
    isCreating: createMutation.isPending,
    renameShelf: renameMutation.mutate,
    isRenaming: renameMutation.isPending,
    deleteShelf: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    reorderShelves: reorderMutation.mutate,
  };
}
