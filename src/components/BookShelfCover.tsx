import type { ReactNode } from "react";
import "./BookShelfCover.css";

export default function BookShelfCover({
  title,
  authors,
  coverImageUrl,
  badge,
}: {
  title: string;
  authors: string[];
  coverImageUrl?: string | null;
  /** Optional status/progress badge rendered under the caption (e.g. on the profile grid). */
  badge?: ReactNode;
}) {
  return (
    <div className="shelf-card">
      <div className="shelf-card-cover">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt=""
            className="shelf-card-image"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="shelf-card-placeholder">
            <span className="shelf-card-placeholder-title">{title}</span>
          </div>
        )}
      </div>
      <div className="shelf-card-caption">
        <p className="shelf-card-title">{title}</p>
        {authors.length > 0 && (
          <p className="shelf-card-author">{authors.join(", ")}</p>
        )}
        {badge}
      </div>
    </div>
  );
}
