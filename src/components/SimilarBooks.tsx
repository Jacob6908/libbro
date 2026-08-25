import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useSimilarBooks } from "../hooks/useRecommendations";
import { useCoverImageSrc } from "../hooks/useCoverImageSrc";

function SimilarBookCover({
  coverImageUrl,
  onCoverUnavailable,
}: {
  coverImageUrl: string | null;
  onCoverUnavailable: () => void;
}) {
  const { src, handleLoad, handleError } = useCoverImageSrc(coverImageUrl, {
    validateAspectRatio: true,
  });

  useEffect(() => {
    if (src === null) {
      onCoverUnavailable();
    }
  }, [src, onCoverUnavailable]);

  if (!src) {
    return null;
  }

  return (
    <img
      src={src}
      alt=""
      className="h-32 w-24 rounded object-cover"
      loading="lazy"
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}

export default function SimilarBooks({ bookId }: { bookId: string }) {
  const { data: books, isLoading } = useSimilarBooks(bookId);
  // A book whose cover turns out unusable (confirmed client-side) is dropped
  // entirely rather than shown without one - see `BookShelfCover`'s
  // `onCoverUnavailable` for the same rule applied to the shelf-row cards.
  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set());

  if (isLoading || !books || books.length === 0) {
    return null;
  }

  const visibleBooks = books.filter((book) => !unavailableIds.has(book.id));
  if (visibleBooks.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-medium">Similar books</h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {visibleBooks.map((book) => (
          <Link
            key={book.id}
            to={`/books/${book.id}`}
            className="float w-24 flex-none text-center"
          >
            <SimilarBookCover
              coverImageUrl={book.cover_image_url}
              onCoverUnavailable={() =>
                setUnavailableIds((current) => {
                  if (current.has(book.id)) return current;
                  return new Set(current).add(book.id);
                })
              }
            />
            <p className="mt-1 line-clamp-2 text-xs">{book.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
