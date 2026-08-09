import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { useMyList } from "../hooks/useMyList";
import { useShelves } from "../hooks/useShelves";
import { useShelfBooks } from "../hooks/useShelfBooks";
import AvatarImage from "../components/AvatarImage";
import BookShelfCover from "../components/BookShelfCover";
import ProfileEditModal from "../components/ProfileEditModal";
import GenrePreferencePicker from "../components/GenrePreferencePicker";
import { STATUS_COLORS, STATUS_LABELS } from "../lib/statusColors";
import "../components/BookShelfCover.css";

const MY_SHELF = "my-shelf";

export default function Profile() {
  const { user } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProfile();
  const { entries, isLoading: isListLoading } = useMyList();
  const { shelves, createShelf, renameShelf, deleteShelf } = useShelves(
    user?.id
  );
  const [selectedShelfId, setSelectedShelfId] = useState<string>(MY_SHELF);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingShelf, setIsAddingShelf] = useState(false);
  const [newShelfTitle, setNewShelfTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const customShelves = shelves.filter((shelf) => shelf.status_key == null);
  const selectedShelf =
    selectedShelfId === MY_SHELF
      ? null
      : (customShelves.find((s) => s.id === selectedShelfId) ?? null);

  const { shelfBooks, removeBook } = useShelfBooks(
    selectedShelf ? selectedShelf.id : undefined
  );

  const completedThisYear = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return entries.filter(
      (entry) =>
        entry.status === "completed" &&
        entry.finished_at != null &&
        new Date(entry.finished_at).getFullYear() === currentYear
    ).length;
  }, [entries]);

  const startRename = () => {
    if (!selectedShelf) return;
    setRenameValue(selectedShelf.title);
    setIsRenaming(true);
  };

  const submitRename = () => {
    const title = renameValue.trim();
    if (selectedShelf && title) {
      renameShelf({ shelfId: selectedShelf.id, title });
    }
    setIsRenaming(false);
  };

  const submitNewShelf = () => {
    const title = newShelfTitle.trim();
    if (title) createShelf(title);
    setNewShelfTitle("");
    setIsAddingShelf(false);
  };

  const isViewingMyShelf = selectedShelfId === MY_SHELF;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <AvatarImage url={profile?.avatar_url ?? null} size={56} />
          <div>
            <h1 className="text-2xl font-semibold">
              {isProfileLoading
                ? "Your books"
                : `${profile?.username ?? "Your"}'s books`}
            </h1>
            <p className="text-sm text-gray-500">
              {entries.length} tracked · {completedThisYear} finished this year
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {profile && (
            <Link
              to={`/u/${profile.username}`}
              className="rounded-full border bg-white px-4 py-2 text-sm font-semibold text-primary hover:border-primary"
            >
              View public profile
            </Link>
          )}
          <button
            type="button"
            onClick={() => setIsEditingProfile(true)}
            className="rounded-full border bg-white px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
          >
            ✎ Edit profile
          </button>
        </div>
      </div>

      <GenrePreferencePicker />

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
              Shelves
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setSelectedShelfId(MY_SHELF)}
              className={`rounded border bg-white px-4 py-3 text-left ${
                isViewingMyShelf
                  ? "border-primary shadow-sm"
                  : "border-gray-200"
              }`}
            >
              <span className="block font-semibold">My shelf</span>
              <span className="text-sm text-gray-500">
                {entries.length} tracked
              </span>
            </button>

            {customShelves.map((shelf) => (
              <button
                key={shelf.id}
                type="button"
                onClick={() => setSelectedShelfId(shelf.id)}
                className={`rounded border bg-white px-4 py-3 text-left ${
                  selectedShelf?.id === shelf.id
                    ? "border-primary shadow-sm"
                    : "border-gray-200"
                }`}
              >
                <span className="block font-semibold">{shelf.title}</span>
                <span className="text-sm text-gray-500">Custom shelf</span>
              </button>
            ))}
          </div>

          {isAddingShelf ? (
            <div className="flex flex-col gap-2 rounded border border-dashed bg-white p-3">
              <input
                autoFocus
                type="text"
                value={newShelfTitle}
                onChange={(e) => setNewShelfTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitNewShelf()}
                placeholder="Shelf title"
                className="rounded border bg-white px-3 py-2 text-sm"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={submitNewShelf}
                  className="text-sm font-semibold text-primary"
                >
                  Add shelf
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingShelf(false);
                    setNewShelfTitle("");
                  }}
                  className="text-sm text-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingShelf(true)}
              className="rounded border border-dashed bg-white px-4 py-3 text-left text-sm font-semibold text-gray-500 hover:border-primary hover:text-primary"
            >
              Add shelf
            </button>
          )}

          {selectedShelf &&
            (isRenaming ? (
              <div className="flex flex-col gap-2 rounded border bg-white p-3">
                <input
                  autoFocus
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitRename()}
                  className="rounded border bg-white px-3 py-2 text-sm"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={submitRename}
                    className="text-sm font-semibold text-primary"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRenaming(false)}
                    className="text-sm text-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-2 text-sm">
                <button
                  type="button"
                  onClick={startRename}
                  className="text-gray-500 hover:text-primary"
                >
                  Rename selected shelf
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteShelf(selectedShelf.id);
                    setSelectedShelfId(MY_SHELF);
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete selected shelf
                </button>
              </div>
            ))}
        </aside>

        <section className="flex min-w-0 flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold">
              {selectedShelf?.title ?? "My shelf"}
            </h2>
            <p className="text-sm text-gray-500">
              {isViewingMyShelf
                ? "Everything you are tracking."
                : "Books you added to this shelf."}
            </p>
          </div>

          {isViewingMyShelf ? (
            <>
              {isListLoading && (
                <p className="text-sm text-gray-500">Loading your books...</p>
              )}
              {!isListLoading && entries.length === 0 && (
                <p className="text-sm text-gray-500">
                  Nothing here yet - search for a book to get started.
                </p>
              )}

              <div className="shelf-grid">
                {entries.map((entry) => (
                  <Link
                    key={entry.id}
                    to={`/books/${entry.book.id}`}
                    className="shelf-card-btn"
                  >
                    <BookShelfCover
                      title={entry.book.title}
                      authors={entry.book.authors}
                      coverImageUrl={entry.book.cover_image_url}
                      badge={
                        <span className="shelf-card-badge">
                          <span
                            className="shelf-card-badge-swatch"
                            style={{ background: STATUS_COLORS[entry.status] }}
                          />
                          {STATUS_LABELS[entry.status]}
                          {entry.status === "reading" &&
                            ` · ${entry.percent_complete}%`}
                        </span>
                      }
                    />
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <>
              {shelfBooks.length === 0 && (
                <p className="text-sm text-gray-500">
                  Nothing on this shelf yet - add a book to it from the book's
                  page.
                </p>
              )}
              <div className="shelf-grid">
                {shelfBooks.map(({ book }) => (
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeBook(book.id);
                          }}
                          className="text-xs font-bold text-red-600 hover:text-red-800"
                        >
                          Remove from shelf
                        </button>
                      }
                    />
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {isEditingProfile && (
        <ProfileEditModal onClose={() => setIsEditingProfile(false)} />
      )}
    </main>
  );
}
