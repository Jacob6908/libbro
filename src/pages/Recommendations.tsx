import { Link } from "react-router";
import { useRecommendations } from "../hooks/useRecommendations";
import BookCoverCard from "../components/BookCoverCard";

export default function Recommendations() {
  const { data: books, isLoading, error } = useRecommendations(30);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Recommended for you</h1>
        <Link to="/profile" className="text-sm underline">
          Edit genre preferences
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
      {!isLoading && books && books.length === 0 && (
        <p className="text-sm text-gray-500">
          No recommendations yet - search for a few books and add them to your
          list to get started.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {books?.map((book) => (
          <li key={book.id}>
            <Link
              to={`/books/${book.id}`}
              className="flex items-center gap-3 rounded border px-3 py-2"
            >
              <BookCoverCard
                title={book.title}
                authors={book.authors}
                coverImageUrl={book.cover_image_url}
              />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
