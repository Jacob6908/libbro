import { useState } from "react";
import { Link, useParams } from "react-router";
import { usePublicProfile } from "../hooks/usePublicProfile";
import { useShelfBooks } from "../hooks/useShelfBooks";
import AvatarImage from "../components/AvatarImage";
import BookShelfCover from "../components/BookShelfCover";
import { STATUS_COLORS, STATUS_LABELS } from "../lib/statusColors";
import "../components/BookShelfCover.css";

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const {
    profile,
    isProfileLoading,
    shelves,
    isShelvesLoading,
    readingStatus,
    isReadingStatusLoading,
  } = usePublicProfile(username);

  const [selectedShelfId, setSelectedShelfId] = useState<string | null>(null);
  const selectedShelf =
    shelves.find((s) => s.id === selectedShelfId) ?? shelves[0] ?? null;
  const isCustomShelf =
    selectedShelf != null && selectedShelf.status_key == null;

  const { shelfBooks, isLoading: isShelfBooksLoading } = useShelfBooks(
    isCustomShelf ? selectedShelf.id : undefined
  );

  if (isProfileLoading) {
    return <p className="p-8 text-sm text-gray-500">Loading profile...</p>;
  }

  if (!profile) {
    return (
      <p className="p-8 text-sm text-red-600">
        No profile found for "{username}".
      </p>
    );
  }

  const defaultShelfEntries = selectedShelf?.status_key
    ? readingStatus.filter((r) => r.status === selectedShelf.status_key)
    : [];

  const isLoadingBooks = isCustomShelf
    ? isShelfBooksLoading
    : isReadingStatusLoading;
  const books = isCustomShelf
    ? shelfBooks.map((sb) => sb.book)
    : defaultShelfEntries.map((r) => r.book);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <AvatarImage url={profile.avatar_url} size={56} />
          <div>
            <h1 className="text-2xl font-semibold">
              {profile.username}'s books
            </h1>
            {profile.bio && (
              <p className="text-sm text-gray-500">{profile.bio}</p>
            )}
          </div>
        </div>
        <Link to="/profile" className="text-sm font-semibold text-primary">
          ← Back to your profile
        </Link>
      </div>

      {isShelvesLoading && (
        <p className="text-sm text-gray-500">Loading shelves...</p>
      )}

      {!isShelvesLoading && shelves.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {shelves.map((shelf) => {
            const count =
              shelf.status_key != null
                ? readingStatus.filter((r) => r.status === shelf.status_key)
                    .length
                : undefined;
            const chipColor =
              shelf.status_key != null
                ? STATUS_COLORS[shelf.status_key]
                : "#c4b2c6";
            const isSelected = selectedShelf?.id === shelf.id;

            return (
              <button
                key={shelf.id}
                type="button"
                onClick={() => setSelectedShelfId(shelf.id)}
                className="rounded-full px-4 py-2 text-sm font-bold"
                style={{
                  background: `color-mix(in srgb, ${chipColor} 32%, white)`,
                  color: "var(--color-ink)",
                  opacity: isSelected ? 1 : 0.6,
                  outline: isSelected
                    ? "2px solid var(--color-primary)"
                    : undefined,
                  outlineOffset: isSelected ? "2px" : undefined,
                }}
              >
                {shelf.title}
                {count != null && (
                  <span className="ml-1 font-medium opacity-70">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {isLoadingBooks && (
        <p className="text-sm text-gray-500">Loading books...</p>
      )}
      {!isLoadingBooks && books.length === 0 && (
        <p className="text-sm text-gray-500">Nothing on this shelf yet.</p>
      )}

      <div className="shelf-grid">
        {books.map((book) => {
          const status = isCustomShelf
            ? null
            : defaultShelfEntries.find((r) => r.book_id === book.id);
          return (
            <Link
              key={book.id}
              to={`/books/${book.id}`}
              className="shelf-card-btn"
            >
              <BookShelfCover
                title={book.title}
                authors={book.authors}
                coverImageUrl={book.cover_image_url}
                badge={
                  status ? (
                    <span className="shelf-card-badge">
                      <span
                        className="shelf-card-badge-swatch"
                        style={{ background: STATUS_COLORS[status.status] }}
                      />
                      {STATUS_LABELS[status.status]}
                      {status.status === "reading" &&
                        ` · ${status.percent_complete}%`}
                    </span>
                  ) : undefined
                }
              />
            </Link>
          );
        })}
      </div>
    </main>
  );
}
