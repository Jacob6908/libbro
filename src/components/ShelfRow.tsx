import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { Book } from "../types/database.types";
import { getTitleSpineColor } from "../lib/genreColors";
import BookShelfCover from "./BookShelfCover";
import "./BookShelfCover.css";
import "./RecommendationShelfRow.css";
import "./ShelfRow.css";

export default function ShelfRow({
  title,
  isAuto = false,
  isEditMode,
  books,
  badgeFor,
  onRename,
  onDelete,
  onRemoveBook,
  emptyMessage = "Nothing here yet.",
}: {
  title: string;
  /** The computed "All Books" row — not a real shelf, so it gets no
   * rename/delete/add-book controls even in edit mode. */
  isAuto?: boolean;
  isEditMode: boolean;
  books: Book[];
  badgeFor?: (bookId: string) => ReactNode;
  onRename?: (title: string) => void;
  onDelete?: () => void;
  onRemoveBook?: (bookId: string) => void;
  emptyMessage?: string;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(title);

  const startRename = () => {
    setRenameValue(title);
    setIsRenaming(true);
  };

  const submitRename = () => {
    const next = renameValue.trim();
    if (next) onRename?.(next);
    setIsRenaming(false);
  };

  // A real shelf with nothing on it still shows its (invisible outside
  // edit mode) add-book slot, so there's somewhere to look once editing —
  // only the auto row falls back to plain empty text, since it has no
  // add-book slot at all (you can't add to a computed view directly).
  const showEmptyMessage = books.length === 0 && (isAuto || !isEditMode);

  return (
    <section className="shelf-row">
      <div className="shelf-row-head">
        {isRenaming ? (
          <div className="shelf-row-rename">
            <input
              autoFocus
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitRename()}
              className="shelf-row-rename-input"
            />
            <button
              type="button"
              onClick={submitRename}
              className="float-icon row-icon-btn"
              title="Save"
            >
              ✓
            </button>
            <button
              type="button"
              onClick={() => setIsRenaming(false)}
              className="float-icon row-icon-btn"
              title="Cancel"
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <h2
              className="shelf-row-title"
              style={
                { "--tick-color": getTitleSpineColor(title) } as CSSProperties
              }
            >
              {title}
            </h2>
            {isAuto ? (
              <span className="auto-tag">Always here</span>
            ) : (
              <span className={`row-crud${isEditMode ? " is-visible" : ""}`}>
                <button
                  type="button"
                  onClick={startRename}
                  className="float-icon row-icon-btn"
                  title="Rename shelf"
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="float-icon row-icon-btn danger"
                  title="Delete shelf"
                >
                  ✕
                </button>
              </span>
            )}
          </>
        )}
      </div>

      {showEmptyMessage ? (
        <p className="shelf-row-empty">{emptyMessage}</p>
      ) : (
        <div className="shelf-row-scroll library-shelf-row-scroll">
          {books.map((book) => (
            <div
              key={book.id}
              className="shelf-card-frame shelf-row-item library-shelf-row-item"
            >
              <BookShelfCover
                title={book.title}
                authors={book.authors}
                coverImageUrl={book.cover_image_url}
                linkTo={`/books/${book.id}`}
                badge={
                  <>
                    {badgeFor?.(book.id)}
                    {!isAuto && (
                      <button
                        type="button"
                        onClick={() => onRemoveBook?.(book.id)}
                        className={`glide-link remove-badge${isEditMode ? " is-visible" : ""}`}
                      >
                        ✕ Remove from shelf
                      </button>
                    )}
                  </>
                }
              />
            </div>
          ))}
          {!isAuto && (
            <button
              type="button"
              className={`float add-slot${isEditMode ? " is-visible" : ""}`}
              // Deferred: this will open the add-book picker in a later pass.
            >
              <span className="add-slot-cover">
                <span className="add-slot-face">
                  <span className="add-slot-plus">+</span>
                  <span className="add-slot-label">Add book</span>
                </span>
              </span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}
