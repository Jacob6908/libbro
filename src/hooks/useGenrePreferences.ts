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

/** Genre preferences for a given profile — defaults to the signed-in
 * user's own. `profile_genre_preferences` has an open SELECT policy (any
 * signed-in user can read any profile's preferences), so this also
 * powers the read-only display on another user's profile; `isOwnProfile`
 * tells the caller whether editing is allowed. */
export function useGenrePreferences(profileId?: string) {
  const { user } = useAuth();
  const targetId = profileId ?? user?.id;
  const isOwnProfile = !!user && targetId === user.id;
  const queryClient = useQueryClient();
  const preferencesKey = ["genre_preferences", targetId];

  const genresQuery = useQuery({
    queryKey: ["genres"],
    queryFn: getAllGenres,
    staleTime: Infinity,
  });

  const preferencesQuery = useQuery({
    queryKey: preferencesKey,
    queryFn: () => getGenrePreferences(targetId!),
    enabled: !!targetId,
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
    isOwnProfile,
  };
}
