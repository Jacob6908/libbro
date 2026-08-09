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

const ALL_TAB = "all";

export default function Profile() {
  const { user } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProfile();
  const { entries, isLoading: isListLoading } = useMyList();
  const { shelves, createShelf, renameShelf, deleteShelf } = useShelves(
    user?.id
  );
  const [selectedTab, setSelectedTab] = useState<string>(ALL_TAB);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingShelf, setIsAddingShelf] = useState(false);
  const [newShelfTitle, setNewShelfTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const selectedShelf =
    selectedTab === ALL_TAB
      ? null
      : (shelves.find((s) => s.id === selectedTab) ?? null);
  const isCustomShelf =
    selectedShelf != null && selectedShelf.status_key == null;

  const { shelfBooks, removeBook } = useShelfBooks(
    isCustomShelf ? selectedShelf.id : undefined
  );

  const filteredEntries =
    selectedShelf?.status_key != null
      ? entries.filter((e) => e.status === selectedShelf.status_key)
      : entries;

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

  const isOwnCustomShelf = isCustomShelf;

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
              className="text-sm font-semibold text-primary"
            >
              Preview how others see your profile →
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

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedTab(ALL_TAB)}
            className="rounded-full px-4 py-2 text-sm font-bold"
            style={{
              background: "var(--color-primary)",
              color: "white",
              opacity: selectedTab === ALL_TAB ? 1 : 0.6,
              outline:
                selectedTab === ALL_TAB
                  ? "2px solid var(--color-primary)"
                  : undefined,
              outlineOffset: selectedTab === ALL_TAB ? "2px" : undefined,
            }}
          >
            All
            <span className="ml-1 font-medium opacity-70">
              {entries.length}
            </span>
          </button>

          {shelves.map((shelf) => {
            const count =
              shelf.status_key != null
                ? entries.filter((e) => e.status === shelf.status_key).length
                : undefined;
            const chipColor =
              shelf.status_key != null
                ? STATUS_COLORS[shelf.status_key]
                : "#c4b2c6"; // plum, for custom shelves

            return (
              <button
                key={shelf.id}
                type="button"
                onClick={() => setSelectedTab(shelf.id)}
                className="rounded-full px-4 py-2 text-sm font-bold"
                style={{
                  background: `color-mix(in srgb, ${chipColor} 32%, white)`,
                  color: "var(--color-ink)",
                  opacity: selectedTab === shelf.id ? 1 : 0.6,
                  outline:
                    selectedTab === shelf.id
                      ? "2px solid var(--color-primary)"
                      : undefined,
                  outlineOffset: selectedTab === shelf.id ? "2px" : undefined,
                }}
              >
                {shelf.title}
                {count != null && (
                  <span className="ml-1 font-medium opacity-70">{count}</span>
                )}
              </button>
            );
          })}

          {isAddingShelf ? (
            <span className="flex items-center gap-1">
              <input
                autoFocus
                type="text"
                value={newShelfTitle}
                onChange={(e) => setNewShelfTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitNewShelf()}
                placeholder="Shelf title"
                className="rounded-full border bg-white px-3 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={submitNewShelf}
                className="rounded-full border bg-white px-3 py-1.5 text-sm font-semibold"
              >
                Add
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
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingShelf(true)}
              className="rounded-full border border-dashed bg-white px-4 py-2 text-sm font-semibold text-gray-500 hover:border-primary hover:text-primary"
            >
              + New shelf
            </button>
          )}
        </div>

        {selectedShelf &&
          (isRenaming ? (
            <span className="flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitRename()}
                className="rounded border bg-white px-2 py-1 text-sm"
              />
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
            </span>
          ) : (
            <span className="flex items-center gap-3 text-sm">
              <button
                type="button"
                onClick={startRename}
                className="text-gray-500 hover:text-primary"
              >
                ✎ Rename shelf
              </button>
              {isOwnCustomShelf && (
                <button
                  type="button"
                  onClick={() => {
                    deleteShelf(selectedShelf.id);
                    setSelectedTab(ALL_TAB);
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  ✕ Delete shelf
                </button>
              )}
            </span>
          ))}
      </div>

      {isCustomShelf ? (
        <>
          {shelfBooks.length === 0 && (
            <p className="text-sm text-gray-500">
              Nothing on this shelf yet — add a book to it from the book's page.
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
                      ✕ Remove from shelf
                    </button>
                  }
                />
              </Link>
            ))}
          </div>
        </>
      ) : (
        <>
          {isListLoading && (
            <p className="text-sm text-gray-500">Loading your books...</p>
          )}
          {!isListLoading && filteredEntries.length === 0 && (
            <p className="text-sm text-gray-500">
              Nothing here yet - search for a book to get started.
            </p>
          )}

          <div className="shelf-grid">
            {filteredEntries.map((entry) => (
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
      )}

      <GenrePreferencePicker />

      {isEditingProfile && (
        <ProfileEditModal onClose={() => setIsEditingProfile(false)} />
      )}
    </main>
  );
}
