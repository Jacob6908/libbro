import { Link } from "react-router";
import { useSimilarBooks } from "../hooks/useRecommendations";
import { useCoverImageSrc } from "../hooks/useCoverImageSrc";
import { getTitleSpineColor } from "../lib/genreColors";

function SimilarBookCover({
  title,
  coverImageUrl,
}: {
  title: string;
  coverImageUrl: string | null;
}) {
  const { src, handleError } = useCoverImageSrc(coverImageUrl);

  return src ? (
    <img
      src={src}
      alt=""
      className="h-32 w-24 rounded object-cover"
      loading="lazy"
      decoding="async"
      onError={handleError}
    />
  ) : (
    <div
      className="h-32 w-24 rounded"
      style={{ background: getTitleSpineColor(title) }}
    />
  );
}

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
            <SimilarBookCover
              title={book.title}
              coverImageUrl={book.cover_image_url}
            />
            <p className="mt-1 line-clamp-2 text-xs">{book.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
