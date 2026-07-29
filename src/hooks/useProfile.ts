import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
} from "../services/supabase/profiles";
import type { ProfilePatch } from "../services/supabase/profiles";

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["profiles", user?.id];

  const profileQuery = useQuery({
    queryKey,
    queryFn: () => getProfile(user!.id),
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: (patch: ProfilePatch) => updateProfile(user!.id, patch),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKey, profile);
    },
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => uploadAvatar(user!.id, file),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKey, profile);
    },
  });

  return {
    profile: profileQuery.data ?? null,
    isLoading: profileQuery.isLoading,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    error: saveMutation.error,
    uploadAvatar: avatarMutation.mutate,
    isUploadingAvatar: avatarMutation.isPending,
    avatarError: avatarMutation.error,
  };
}
