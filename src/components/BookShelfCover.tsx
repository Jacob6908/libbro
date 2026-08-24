import type { CSSProperties, ReactNode } from "react";
import { useCoverImageSrc } from "../hooks/useCoverImageSrc";
import { getTitleSpineColor } from "../lib/genreColors";
import "./BookShelfCover.css";

/** Small resting rotation for the "browse" variant, deterministic per title
 * (same hash approach as `getTitleSpineColor`) so a given book doesn't jitter
 * between renders. */
function getTitleTilt(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) | 0;
  }
  return ((Math.abs(hash) % 1000) / 1000 - 0.5) * 5; // -2.5..2.5deg
}

export default function BookShelfCover({
  title,
  authors,
  coverImageUrl,
  badge,
  variant = "default",
  showCaption = true,
}: {
  title: string;
  authors: string[];
  coverImageUrl?: string | null;
  /** Optional status/progress badge rendered under the caption (e.g. on the profile grid). */
  badge?: ReactNode;
  /** "browse" adds a resting tilt and reveals the shelf ledge only on hover,
   * instead of the default's always-visible ledge. Used on the search page. */
  variant?: "default" | "browse";
  showCaption?: boolean;
}) {
  const { src, handleError } = useCoverImageSrc(coverImageUrl);

  return (
    <div
      className={
        variant === "browse" ? "shelf-card shelf-card--browse" : "shelf-card"
      }
    >
      <div
        className="shelf-card-cover"
        style={
          variant === "browse"
            ? ({
                "--tilt": `${getTitleTilt(title).toFixed(2)}deg`,
              } as CSSProperties)
            : undefined
        }
      >
        {src ? (
          <img
            src={src}
            alt=""
            className="shelf-card-image"
            loading="lazy"
            decoding="async"
            onError={handleError}
          />
        ) : (
          <div
            className="shelf-card-placeholder"
            style={{ background: getTitleSpineColor(title) }}
          >
            <span className="shelf-card-placeholder-title">{title}</span>
          </div>
        )}
      </div>
      {showCaption && (
        <div className="shelf-card-caption">
          <p className="shelf-card-title">{title}</p>
          {authors.length > 0 && (
            <p className="shelf-card-author">{authors.join(", ")}</p>
          )}
          {badge}
        </div>
      )}
    </div>
  );
}
