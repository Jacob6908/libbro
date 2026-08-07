import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useRecommendationCategories } from "../hooks/useRecommendations";
import RecommendationShelfRow from "../components/RecommendationShelfRow";
import type { RecommendationCategory } from "../services/recommendations";

const BOOKS_PER_PREVIEW_ROW = 10;
const MIN_SHOWN = 3;
const MAX_SHOWN = 4;

function pickRandomCategories(
  categories: RecommendationCategory[],
  min: number,
  max: number
): RecommendationCategory[] {
  const count = Math.min(
    categories.length,
    Math.floor(Math.random() * (max - min + 1)) + min
  );
  const shuffled = [...categories].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function Recommendations() {
  const {
    data: categories,
    isLoading,
    error,
  } = useRecommendationCategories(BOOKS_PER_PREVIEW_ROW);

  // Picked once per page visit (guarded by the ref, not re-rolled on a
  // background refetch of the same cached data) so the shown rows stay
  // stable while the user is on the page but change on the next visit.
  const [shown, setShown] = useState<RecommendationCategory[] | null>(null);
  const hasPickedRef = useRef(false);

  useEffect(() => {
    if (categories && !hasPickedRef.current) {
      hasPickedRef.current = true;
      setShown(pickRandomCategories(categories, MIN_SHOWN, MAX_SHOWN));
    }
  }, [categories]);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Recommended for you</h1>
        <div className="flex items-center gap-5">
          <Link to="/profile" className="text-sm text-primary underline">
            Edit genre preferences
          </Link>
          <Link
            to="/recommendations/all"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            View all recommended
          </Link>
        </div>
      </div>

      {isLoading && (
        <p className="text-sm text-gray-500">Loading recommendations...</p>
      )}
      {error && (
        <p className="text-sm text-red-600">
          Something went wrong loading recommendations.
        </p>
      )}
      {!isLoading && categories && categories.length === 0 && (
        <p className="text-sm text-gray-500">
          No recommendations yet - search for a few books and add them to your
          list to get started.
        </p>
      )}

      <div className="flex flex-col gap-8">
        {shown?.map((category) => (
          <RecommendationShelfRow
            key={category.id}
            title={category.title}
            books={category.books}
          />
        ))}
      </div>
    </main>
  );
}
