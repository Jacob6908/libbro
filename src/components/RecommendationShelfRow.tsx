import { useState, type CSSProperties } from "react";
import { Link } from "react-router";
import type { Book } from "../types/database.types";
import { getTitleSpineColor } from "../lib/genreColors";
import BookShelfCover from "./BookShelfCover";
import "./BookShelfCover.css";
import "./RecommendationShelfRow.css";

export default function RecommendationShelfRow({
  title,
  books,
}: {
  title: string;
  books: Book[];
}) {
  // A book whose cover turns out unusable (confirmed client-side, after the
  // server-side has-a-cover-URL filter already ran) is dropped from the row
  // entirely rather than shown with a placeholder - see `onCoverUnavailable`
  // on `BookShelfCover`.
  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set());
  const visibleBooks = books.filter((book) => !unavailableIds.has(book.id));

  if (visibleBooks.length === 0) {
    return null;
  }

  return (
    <section className="shelf-row">
      <h2
        className="shelf-row-title"
        style={{ "--tick-color": getTitleSpineColor(title) } as CSSProperties}
      >
        {title}
      </h2>
      <div className="shelf-row-scroll">
        {visibleBooks.map((book) => (
          <Link
            key={book.id}
            to={`/books/${book.id}`}
            className="shelf-card-btn shelf-row-item"
          >
            <BookShelfCover
              title={book.title}
              authors={book.authors}
              coverImageUrl={book.cover_image_url}
              onCoverUnavailable={() =>
                setUnavailableIds((current) => {
                  if (current.has(book.id)) return current;
                  return new Set(current).add(book.id);
                })
              }
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
