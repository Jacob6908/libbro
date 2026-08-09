import { useQuery } from "@tanstack/react-query";
import { getProfileByUsername } from "../services/supabase/profiles";
import { getPublicReadingStatusForUser } from "../services/supabase/shelves";
import { useShelves } from "./useShelves";

/** Read-only composite for viewing another user's profile: their public
 * profile row, their shelves, and their status-derived (default shelf)
 * reading data via the `public_reading_status` view — never `review`,
 * which stays private to the owner. */
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

  const readingStatusQuery = useQuery({
    queryKey: ["public_reading_status", profile?.id],
    queryFn: () => getPublicReadingStatusForUser(profile!.id),
    enabled: !!profile,
  });

  return {
    profile,
    isProfileLoading: profileQuery.isLoading,
    shelves,
    isShelvesLoading,
    readingStatus: readingStatusQuery.data ?? [],
    isReadingStatusLoading: readingStatusQuery.isLoading,
  };
}
