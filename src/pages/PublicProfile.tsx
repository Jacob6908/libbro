import { useState } from "react";
import { Link, useParams } from "react-router";
import { usePublicProfile } from "../hooks/usePublicProfile";
import { useShelfBooks } from "../hooks/useShelfBooks";
import AvatarImage from "../components/AvatarImage";
import BookShelfCover from "../components/BookShelfCover";
import "../components/BookShelfCover.css";

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const { profile, isProfileLoading, shelves, isShelvesLoading } =
    usePublicProfile(username);

  const [selectedShelfId, setSelectedShelfId] = useState<string | null>(null);
  const customShelves = shelves.filter((shelf) => shelf.status_key == null);
  const selectedShelf =
    customShelves.find((s) => s.id === selectedShelfId) ??
    customShelves[0] ??
    null;

  const { shelfBooks, isLoading: isShelfBooksLoading } = useShelfBooks(
    selectedShelf ? selectedShelf.id : undefined
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

  const books = shelfBooks.map((sb) => sb.book);

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

      {!isShelvesLoading && customShelves.length > 0 && (
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="flex flex-col gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
              Shelves
            </h2>
            <div className="flex flex-col gap-2">
              {customShelves.map((shelf) => {
                const isSelected = selectedShelf?.id === shelf.id;

                return (
                  <button
                    key={shelf.id}
                    type="button"
                    onClick={() => setSelectedShelfId(shelf.id)}
                    className={`rounded border bg-white px-4 py-3 text-left ${
                      isSelected
                        ? "border-primary shadow-sm"
                        : "border-gray-200"
                    }`}
                  >
                    <span className="block font-semibold">{shelf.title}</span>
                    <span className="text-sm text-gray-500">Shelf</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="flex min-w-0 flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                {selectedShelf?.title ?? "Shelf"}
              </h2>
              <p className="text-sm text-gray-500">
                Books {profile.username} added to this shelf.
              </p>
            </div>

            {isShelfBooksLoading && (
              <p className="text-sm text-gray-500">Loading books...</p>
            )}
            {!isShelfBooksLoading && books.length === 0 && (
              <p className="text-sm text-gray-500">
                Nothing on this shelf yet.
              </p>
            )}

            <div className="shelf-grid">
              {books.map((book) => (
                <Link
                  key={book.id}
                  to={`/books/${book.id}`}
                  className="shelf-card-btn"
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
        </div>
      )}

      {!isShelvesLoading && customShelves.length === 0 && (
        <p className="text-sm text-gray-500">No shelves published yet.</p>
      )}
    </main>
  );
}
