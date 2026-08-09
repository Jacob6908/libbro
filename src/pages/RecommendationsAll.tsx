import { Link } from "react-router";
import { useRecommendationCategories } from "../hooks/useRecommendations";
import RecommendationShelfRow from "../components/RecommendationShelfRow";

const BOOKS_PER_ROW = 24;

export default function RecommendationsAll() {
  const {
    data: categories,
    isLoading,
    error,
  } = useRecommendationCategories(BOOKS_PER_ROW);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">All recommendations</h1>
        <Link to="/recommendations" className="text-sm text-primary underline">
          Back to recommended
        </Link>
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
        {categories?.map((category) => (
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
