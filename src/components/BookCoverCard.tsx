export default function BookCoverCard({
  title,
  authors,
  coverImageUrl,
}: {
  title: string;
  authors: string[];
  coverImageUrl?: string | null;
}) {
  return (
    <div className="flex items-center gap-3">
      {coverImageUrl ? (
        <img
          src={coverImageUrl}
          alt=""
          className="h-16 w-11 flex-none rounded object-cover"
        />
      ) : (
        <div className="h-16 w-11 flex-none rounded bg-gray-200" />
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
