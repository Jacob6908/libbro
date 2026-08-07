import { Link } from "react-router";
import type { Book } from "../types/database.types";
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
  return (
    <section className="shelf-row">
      <h2 className="shelf-row-title">{title}</h2>
      <div className="shelf-row-scroll">
        {books.map((book) => (
          <Link
            key={book.id}
            to={`/books/${book.id}`}
            className="shelf-card-btn shelf-row-item"
          >
            <BookShelfCover
              title={book.title}
              authors={book.authors}
              coverImageUrl={book.cover_image_url}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
