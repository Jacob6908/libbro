import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { getAllListEntriesWithBooks } from "../services/supabase/listEntries";

export function useMyList() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["list_entries", "all", user?.id],
    queryFn: () => getAllListEntriesWithBooks(user!.id),
    enabled: !!user,
  });

  return {
    entries: query.data ?? [],
    isLoading: query.isLoading,
  };
}
