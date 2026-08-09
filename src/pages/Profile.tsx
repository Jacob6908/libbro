import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { useMyList } from "../hooks/useMyList";
import { useShelves } from "../hooks/useShelves";
import { useShelfBooks, useAllShelvedBooks } from "../hooks/useShelfBooks";
import AvatarImage from "../components/AvatarImage";
import ShelfRow from "../components/ShelfRow";
import ProfileEditModal from "../components/ProfileEditModal";
import GenrePreferencePicker from "../components/GenrePreferencePicker";
import { STATUS_COLORS, STATUS_LABELS } from "../lib/statusColors";
import type { Book, Shelf } from "../types/database.types";
import type { ListEntryWithBook } from "../services/supabase/listEntries";

function renderStatusBadge(entry: ListEntryWithBook | undefined) {
  if (!entry) return null;
  return (
    <span className="shelf-card-badge">
      <span
        className="shelf-card-badge-swatch"
        style={{ background: STATUS_COLORS[entry.status] }}
      />
      {STATUS_LABELS[entry.status]}
      {entry.status === "reading" && ` · ${entry.percent_complete}%`}
    </span>
  );
}

/** One real shelf's row — fetches its own books so the number of hook
 * calls stays fixed regardless of how many shelves a profile has. */
function ShelfSection({
  shelf,
  isEditMode,
  entryByBookId,
  onRename,
  onDelete,
}: {
  shelf: Shelf;
  isEditMode: boolean;
  entryByBookId: Map<string, ListEntryWithBook>;
  onRename: (shelfId: string, title: string) => void;
  onDelete: (shelfId: string) => void;
}) {
  const { shelfBooks, removeBook } = useShelfBooks(shelf.id);
  const books = shelfBooks.map((sb) => sb.book);

  return (
    <ShelfRow
      title={shelf.title}
      isEditMode={isEditMode}
      books={books}
      badgeFor={(bookId) => renderStatusBadge(entryByBookId.get(bookId))}
      onRename={(title) => onRename(shelf.id, title)}
      onDelete={() => onDelete(shelf.id)}
      onRemoveBook={(bookId) => removeBook(bookId)}
      emptyMessage="Nothing on this shelf yet."
    />
  );
}

export default function Profile() {
  const { user } = useAuth();
  const { profile, isLoading: isProfileLoading } = useProfile();
  const { entries } = useMyList();
  const { books: shelvedBooks } = useAllShelvedBooks(user?.id);
  const { shelves, createShelf, renameShelf, deleteShelf } = useShelves(
    user?.id
  );
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddingShelf, setIsAddingShelf] = useState(false);
  const [newShelfTitle, setNewShelfTitle] = useState("");

  const entryByBookId = useMemo(
    () => new Map(entries.map((entry) => [entry.book_id, entry])),
    [entries]
  );

  // The "All Books" safety net: every book tracked (any status) or
  // shelved anywhere, deduplicated — so removing a book from its only
  // shelf never makes it disappear from the profile entirely.
  const allBooks = useMemo(() => {
    const byId = new Map<string, Book>();
    entries.forEach((entry) => byId.set(entry.book_id, entry.book));
    shelvedBooks.forEach((book) => {
      if (!byId.has(book.id)) byId.set(book.id, book);
    });
    return [...byId.values()];
  }, [entries, shelvedBooks]);

  const completedThisYear = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return entries.filter(
      (entry) =>
        entry.status === "completed" &&
        entry.finished_at != null &&
        new Date(entry.finished_at).getFullYear() === currentYear
    ).length;
  }, [entries]);

  const submitNewShelf = () => {
    const title = newShelfTitle.trim();
    if (title) createShelf(title);
    setNewShelfTitle("");
    setIsAddingShelf(false);
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <AvatarImage url={profile?.avatar_url ?? null} size={56} />
          <div>
            <h1 className="text-2xl font-semibold">
              {isProfileLoading
                ? "Your Library"
                : `${profile?.username ?? "Your"}'s Library`}
            </h1>
            <p className="text-sm text-gray-500">
              {entries.length} tracked · {completedThisYear} finished this year
            </p>
            <div className="mt-2">
              <GenrePreferencePicker compact />
            </div>
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
          <button
            type="button"
            onClick={() => setIsEditMode((v) => !v)}
            className={`rounded-full px-4 py-2 text-sm font-bold ${
              isEditMode ? "bg-ink text-page" : "bg-primary text-white"
            }`}
          >
            {isEditMode ? "Done" : "Edit Library"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-10">
        <ShelfRow
          title="All Books"
          isAuto
          isEditMode={isEditMode}
          books={allBooks}
          badgeFor={(bookId) => renderStatusBadge(entryByBookId.get(bookId))}
          emptyMessage="Nothing here yet - search for a book to get started."
        />

        {shelves.map((shelf) => (
          <ShelfSection
            key={shelf.id}
            shelf={shelf}
            isEditMode={isEditMode}
            entryByBookId={entryByBookId}
            onRename={(shelfId, title) => renameShelf({ shelfId, title })}
            onDelete={(shelfId) => deleteShelf(shelfId)}
          />
        ))}

        {isEditMode &&
          (isAddingShelf ? (
            <div className="flex items-center gap-2 rounded-lg border border-dashed bg-white p-4">
              <input
                autoFocus
                type="text"
                value={newShelfTitle}
                onChange={(e) => setNewShelfTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitNewShelf()}
                placeholder="Shelf title"
                className="flex-1 rounded border bg-white px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={submitNewShelf}
                className="text-sm font-semibold text-primary"
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
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingShelf(true)}
              className="flex items-center gap-3 rounded-lg border border-dashed bg-white px-5 py-4 text-left text-sm font-bold text-gray-500 hover:border-primary hover:text-primary"
            >
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-dashed border-current text-base">
                +
              </span>
              Add a new shelf
            </button>
          ))}
      </div>

      {isEditingProfile && (
        <ProfileEditModal onClose={() => setIsEditingProfile(false)} />
      )}
    </main>
  );
}
