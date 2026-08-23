import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { useMyList } from "../hooks/useMyList";
import { useShelves } from "../hooks/useShelves";
import { useShelfBooks, useAllShelvedBooks } from "../hooks/useShelfBooks";
import { getProfileByUsername } from "../services/supabase/profiles";
import AvatarImage from "../components/AvatarImage";
import ShelfRow from "../components/ShelfRow";
import ProfileEditModal from "../components/ProfileEditModal";
import GenrePreferencePicker from "../components/GenrePreferencePicker";
import { STATUS_COLORS, STATUS_LABELS } from "../lib/statusColors";
import { DEFAULT_BACKGROUND_THEME } from "../lib/backgroundThemes";
import type { Book, Shelf } from "../types/database.types";
import type { ListEntryWithBook } from "../services/supabase/listEntries";
import "./Profile.css";

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
  isOwner,
  isEditMode,
  entryByBookId,
  onRename,
  onDelete,
}: {
  shelf: Shelf;
  isOwner: boolean;
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
      badgeFor={(bookId) =>
        isOwner ? renderStatusBadge(entryByBookId.get(bookId)) : null
      }
      onRename={(title) => onRename(shelf.id, title)}
      onDelete={() => onDelete(shelf.id)}
      onRemoveBook={(bookId) => removeBook(bookId)}
      emptyMessage="Nothing on this shelf yet."
    />
  );
}

/** Same page for everyone — the signed-in user's own library at
 * `/profile`, or any user's at `/u/:username`. Ownership (comparing the
 * loaded profile's id to the signed-in user's id) is the only thing that
 * changes what renders: edit affordances, reading-status badges, and the
 * "All Books" safety net (which for a visitor can only be built from
 * open-read shelf data, never another user's private list_entries). */
export default function Profile() {
  const { username: routeUsername } = useParams<{ username?: string }>();
  const isSelfRoute = routeUsername === undefined;

  const { user } = useAuth();
  const { profile: ownProfile, isLoading: isOwnProfileLoading } = useProfile();

  const viewedProfileQuery = useQuery({
    queryKey: ["profiles", "by-username", routeUsername],
    queryFn: () => getProfileByUsername(routeUsername!),
    enabled: !isSelfRoute,
  });

  const profile = isSelfRoute ? ownProfile : (viewedProfileQuery.data ?? null);
  const isProfileLoading = isSelfRoute
    ? isOwnProfileLoading
    : viewedProfileQuery.isLoading;
  const isOwner = !!user && !!profile && profile.id === user.id;

  const { entries } = useMyList();
  const { books: shelvedBooks } = useAllShelvedBooks(profile?.id);
  const { shelves, createShelf, renameShelf, deleteShelf } = useShelves(
    profile?.id
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
  // shelf never makes it disappear from the profile entirely. Tracked
  // books only ever come from the signed-in user's own private
  // list_entries, so a visitor's "All Books" is shelf-only.
  const allBooks = useMemo(() => {
    const byId = new Map<string, Book>();
    if (isOwner) {
      entries.forEach((entry) => byId.set(entry.book_id, entry.book));
    }
    shelvedBooks.forEach((book) => {
      if (!byId.has(book.id)) byId.set(book.id, book);
    });
    return [...byId.values()];
  }, [isOwner, entries, shelvedBooks]);

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

  if (!isSelfRoute && !isProfileLoading && !profile) {
    return (
      <p className="p-8 text-sm text-red-600">
        No profile found for "{routeUsername}".
      </p>
    );
  }

  return (
    <main
      className="profile-theme mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8"
      data-theme={profile?.background_theme ?? DEFAULT_BACKGROUND_THEME}
      data-edit-mode={isOwner && isEditMode}
    >
      {isOwner && isEditMode && (
        <div className="profile-edit-banner">
          ✎ Editing your library — changes save as you go
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <AvatarImage url={profile?.avatar_url ?? null} size={56} />
          <div>
            <h1 className="text-2xl font-semibold">
              {isProfileLoading
                ? "Library"
                : `${profile?.username ?? "Your"}'s Library`}
            </h1>
            <p className="profile-subtext text-sm">
              {isOwner
                ? `${entries.length} tracked · ${completedThisYear} finished this year`
                : `${allBooks.length} book${
                    allBooks.length === 1 ? "" : "s"
                  } · ${shelves.length} ${
                    shelves.length === 1 ? "shelf" : "shelves"
                  }`}
            </p>
            {profile && (
              <div className="mt-2">
                <GenrePreferencePicker profileId={profile.id} compact />
              </div>
            )}
          </div>
        </div>
        {isOwner && (
          <div className="flex items-center gap-3">
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
        )}
      </div>

      <div className="flex flex-col gap-10">
        <ShelfRow
          title="All Books"
          isAuto
          isEditMode={isOwner && isEditMode}
          books={allBooks}
          badgeFor={(bookId) =>
            isOwner ? renderStatusBadge(entryByBookId.get(bookId)) : null
          }
          emptyMessage="Nothing here yet - search for a book to get started."
        />

        {shelves.map((shelf) => (
          <ShelfSection
            key={shelf.id}
            shelf={shelf}
            isOwner={isOwner}
            isEditMode={isOwner && isEditMode}
            entryByBookId={entryByBookId}
            onRename={(shelfId, title) => renameShelf({ shelfId, title })}
            onDelete={(shelfId) => deleteShelf(shelfId)}
          />
        ))}

        {isOwner &&
          isEditMode &&
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
                className="profile-subtext text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingShelf(true)}
              className="profile-subtext flex items-center gap-3 rounded-lg border border-dashed bg-white px-5 py-4 text-left text-sm font-bold hover:border-primary hover:text-primary"
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
