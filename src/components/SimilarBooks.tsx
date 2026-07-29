import { Link } from "react-router";
import { useSimilarBooks } from "../hooks/useRecommendations";

export default function SimilarBooks({ bookId }: { bookId: string }) {
  const { data: books, isLoading } = useSimilarBooks(bookId);

  if (isLoading || !books || books.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-medium">Similar books</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {books.map((book) => (
          <Link
            key={book.id}
            to={`/books/${book.id}`}
            className="w-24 flex-none text-center"
          >
            {book.cover_image_url ? (
              <img
                src={book.cover_image_url}
                alt=""
                className="h-32 w-24 rounded object-cover"
              />
            ) : (
              <div className="h-32 w-24 rounded bg-gray-200" />
            )}
            <p className="mt-1 line-clamp-2 text-xs">{book.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
