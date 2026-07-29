import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { getAllGenres } from "../services/supabase/genres";
import {
  getGenrePreferences,
  removeGenrePreference,
  setGenrePreference,
} from "../services/supabase/genrePreferences";

/** Every explicit selection writes this weight; recommendations scoring still multiplies it by 2. */
const EXPLICIT_WEIGHT = 2;

export function useGenrePreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const preferencesKey = ["genre_preferences", user?.id];

  const genresQuery = useQuery({
    queryKey: ["genres"],
    queryFn: getAllGenres,
    staleTime: Infinity,
  });

  const preferencesQuery = useQuery({
    queryKey: preferencesKey,
    queryFn: () => getGenrePreferences(user!.id),
    enabled: !!user,
  });

  const selectedGenreIds = new Set(
    (preferencesQuery.data ?? []).map((preference) => preference.genre_id)
  );

  const saveSelectionMutation = useMutation({
    mutationFn: async (nextSelectedIds: Set<number>) => {
      const userId = user!.id;
      const toAdd = [...nextSelectedIds].filter(
        (id) => !selectedGenreIds.has(id)
      );
      const toRemove = [...selectedGenreIds].filter(
        (id) => !nextSelectedIds.has(id)
      );
      await Promise.all([
        ...toAdd.map((genreId) =>
          setGenrePreference(userId, genreId, EXPLICIT_WEIGHT)
        ),
        ...toRemove.map((genreId) => removeGenrePreference(userId, genreId)),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: preferencesKey });
    },
  });

  return {
    genres: genresQuery.data ?? [],
    selectedGenreIds,
    isLoading: genresQuery.isLoading || preferencesQuery.isLoading,
    saveSelection: saveSelectionMutation.mutateAsync,
    isSaving: saveSelectionMutation.isPending,
  };
}
