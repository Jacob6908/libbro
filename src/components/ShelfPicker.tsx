import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { useShelves } from "../hooks/useShelves";
import {
  addBookToShelf,
  getShelfIdsForBook,
  removeBookFromShelf,
} from "../services/supabase/shelves";

/** Lets the signed-in user file the current book onto any of their custom
 * shelves. Default (status-linked) shelves aren't listed here — those are
 * still driven by the status-tracking control above this component. */
export default function ShelfPicker({ bookId }: { bookId: string }) {
  const { user } = useAuth();
  const { shelves, isLoading: isShelvesLoading } = useShelves(user?.id);
  const customShelves = shelves.filter((s) => s.status_key == null);
  const shelfIds = customShelves.map((s) => s.id);

  const queryClient = useQueryClient();
  const queryKey = ["shelf-membership", bookId, shelfIds];

  const membershipQuery = useQuery({
    queryKey,
    queryFn: () => getShelfIdsForBook(shelfIds, bookId),
    enabled: shelfIds.length > 0,
  });

  const memberIds = new Set(membershipQuery.data ?? []);

  const toggleMutation = useMutation({
    mutationFn: (shelfId: string) =>
      memberIds.has(shelfId)
        ? removeBookFromShelf(shelfId, bookId)
        : addBookToShelf(shelfId, bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  if (isShelvesLoading) return null;

  if (customShelves.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        You don't have any custom shelves yet — create one from your profile to
        start organizing books this way.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
        Shelves
      </p>
      <div className="flex flex-wrap gap-2">
        {customShelves.map((shelf) => {
          const isMember = memberIds.has(shelf.id);
          return (
            <button
              key={shelf.id}
              type="button"
              onClick={() => toggleMutation.mutate(shelf.id)}
              className="rounded-full border-2 px-3 py-1.5 text-sm font-bold"
              style={{
                background: isMember
                  ? "color-mix(in srgb, #c4b2c6 30%, white)"
                  : "white",
                borderColor: isMember ? "#c4b2c6" : "#e5e7eb",
                opacity: isMember ? 1 : 0.7,
              }}
            >
              {isMember ? "✓ " : "+ "}
              {shelf.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
