import { useQuery } from "@tanstack/react-query";
import { getProfileByUsername } from "../services/supabase/profiles";
import { useShelves } from "./useShelves";

/** Read-only composite for viewing another user's profile: their public
 * profile row and their shelves. */
export function usePublicProfile(username: string | undefined) {
  const profileQuery = useQuery({
    queryKey: ["profiles", "by-username", username],
    queryFn: () => getProfileByUsername(username!),
    enabled: !!username,
  });

  const profile = profileQuery.data ?? null;

  const { shelves, isLoading: isShelvesLoading } = useShelves(
    profile?.id ?? undefined
  );

  return {
    profile,
    isProfileLoading: profileQuery.isLoading,
    shelves,
    isShelvesLoading,
  };
}
