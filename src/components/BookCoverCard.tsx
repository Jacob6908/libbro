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
  const { src, handleError } = useCoverImageSrc(coverImageUrl);

  return (
    <div className="flex items-center gap-3">
      {src ? (
        <img
          src={src}
          alt=""
          className="h-16 w-11 flex-none rounded object-cover"
          loading="lazy"
          decoding="async"
          onError={handleError}
        />
      ) : (
        <div
          className="h-16 w-11 flex-none rounded"
          style={{ background: getTitleSpineColor(title) }}
        />
      )}
      <div>
        <p className="font-medium">{title}</p>
        {authors.length > 0 && (
          <p className="text-sm text-gray-600">{authors.join(", ")}</p>
        )}
      </div>
    </div>
  );
}
