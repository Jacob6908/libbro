import { useEffect, type CSSProperties, type ReactNode } from "react";
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
  onCoverUnavailable,
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
  /** When provided, the card renders nothing (instead of the color/title
   * placeholder) once the cover image is confirmed unusable, and this fires
   * so the caller can drop the book from its list entirely - used by
   * recommendation contexts, where a book with no working cover shouldn't
   * appear at all. Library/search contexts omit this and keep the
   * placeholder, since a user's own book shouldn't disappear from view. */
  onCoverUnavailable?: () => void;
}) {
  const { src, handleLoad, handleError } = useCoverImageSrc(coverImageUrl, {
    validateAspectRatio: true,
  });

  useEffect(() => {
    if (onCoverUnavailable && src === null) {
      onCoverUnavailable();
    }
  }, [onCoverUnavailable, src]);

  if (!src && onCoverUnavailable) {
    return null;
  }

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
            onLoad={handleLoad}
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
