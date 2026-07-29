import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { getAllGenres } from "../services/supabase/genres";
import {
  getGenrePreferences,
  removeGenrePreference,
  setGenrePreference,
} from "../services/supabase/genrePreferences";

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

  const setMutation = useMutation({
    mutationFn: (vars: { genreId: number; weight: number }) =>
      setGenrePreference(user!.id, vars.genreId, vars.weight),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: preferencesKey });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (genreId: number) => removeGenrePreference(user!.id, genreId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: preferencesKey });
    },
  });

  return {
    genres: genresQuery.data ?? [],
    preferences: preferencesQuery.data ?? [],
    isLoading: genresQuery.isLoading || preferencesQuery.isLoading,
    setWeight: setMutation.mutate,
    remove: removeMutation.mutate,
    isMutating: setMutation.isPending || removeMutation.isPending,
  };
}
