import { useCoverImageSrc } from "../hooks/useCoverImageSrc";
import { getTitleSpineColor } from "../lib/genreColors";

export default function BookCoverCard({
  title,
  authors,
  coverImageUrl,
}: {
  title: string;
  authors: string[];
  coverImageUrl?: string | null;
}) {
  const { src, handleLoad, handleError } = useCoverImageSrc(coverImageUrl, {
    validateAspectRatio: true,
  });

  return (
    <div className="flex items-center gap-4">
      {src ? (
        <img
          src={src}
          alt=""
          className="h-20 w-14 flex-none rounded-sm object-cover"
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : (
        <div
          className="h-20 w-14 flex-none rounded-sm"
          style={{ background: getTitleSpineColor(title) }}
        />
      )}
      <div className="min-w-0">
        <p className="truncate font-serif text-base font-bold">{title}</p>
        {authors.length > 0 && (
          <p className="truncate text-xs tracking-wide text-ink/60 uppercase">
            {authors.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}
