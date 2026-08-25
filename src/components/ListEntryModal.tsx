import { useState } from "react";
import type { CSSProperties } from "react";
import type { ListEntry, ReadingStatus } from "../types/database.types";
import { STATUS_COLORS, STATUS_OPTIONS } from "../lib/statusColors";
import BookShelfCover from "./BookShelfCover";
import "./ListEntryModal.css";

const PROGRESS_STATUSES: ReadingStatus[] = ["reading", "on_hold", "dropped"];
const RATING_STATUSES: ReadingStatus[] = ["completed", "dropped"];

export default function ListEntryModal({
  entry,
  pageCount,
  title,
  authors,
  coverImageUrl,
  onSave,
  isSaving,
  onRemove,
  isRemoving,
  onClose,
}: {
  entry: ListEntry | null;
  pageCount: number | null;
  title: string;
  authors: string[];
  coverImageUrl?: string | null;
  onSave: (input: {
    status: ReadingStatus;
    percentComplete: number;
    rating: number | null;
    review: string | null;
  }) => void;
  isSaving: boolean;
  onRemove: () => void;
  isRemoving: boolean;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<ReadingStatus>(
    entry?.status ?? "want_to_read"
  );
  const initialPercent = entry?.percent_complete ?? 0;
  // Page and percent are tracked as separate, independent state (not
  // derived from one another on every keystroke) so typing a page number
  // doesn't get corrupted by a lossy percent round-trip mid-edit — only
  // converted to `percentComplete` once, at save time.
  const [page, setPage] = useState<string>(
    pageCount ? String(Math.round((initialPercent / 100) * pageCount)) : "0"
  );
  const [percent, setPercent] = useState<string>(String(initialPercent));
  const [rating, setRating] = useState<number | null>(entry?.rating ?? null);
  const [review, setReview] = useState(entry?.review ?? "");

  const showProgress = PROGRESS_STATUSES.includes(status);
  const showRating = RATING_STATUSES.includes(status);
  const pageValue = page === "" ? 0 : Number(page);
  const percentValue = percent === "" ? 0 : Number(percent);
  const progressPercent = pageCount
    ? pageCount > 0
      ? Math.round((pageValue / pageCount) * 100)
      : 0
    : percentValue;

  const handleStatusChange = (next: ReadingStatus) => {
    const wasCompleted = status === "completed";

    setStatus(next);
    if (!RATING_STATUSES.includes(next)) {
      setRating(null);
    }

    if (next === "completed") {
      if (pageCount) setPage(String(pageCount));
      setPercent("100");
    } else if (next === "want_to_read") {
      setPage("0");
      setPercent("0");
    } else if (wasCompleted) {
      setPage("0");
      setPercent("0");
    }
  };

  const handlePageChange = (value: string) => {
    if (!pageCount) return;
    if (value === "") {
      setPage("");
      return;
    }

    const next = Number(value);
    if (Number.isNaN(next)) return;
    setPage(String(Math.max(0, Math.min(pageCount, next))));
  };

  const handlePercentChange = (value: string) => {
    if (value === "") {
      setPercent("");
      return;
    }

    const next = Number(value);
    if (Number.isNaN(next)) return;
    setPercent(String(Math.max(0, Math.min(100, next))));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-surface shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-ink/15 px-6 py-4">
          <div>
            <h2 className="font-serif text-lg font-semibold">{title}</h2>
            <p className="text-sm text-ink/60">
              {authors.join(", ")}
              {authors.length > 0 && pageCount ? " · " : ""}
              {pageCount ? `${pageCount} pages` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="float text-ink/40 hover:text-ink/70"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="list-entry-modal-body gap-6 px-6 py-5">
          <div className="list-entry-modal-cover-stage">
            <div className="list-entry-modal-cover">
              <BookShelfCover
                title={title}
                authors={authors}
                coverImageUrl={coverImageUrl}
                showCaption={false}
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/60">
                Status
              </p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleStatusChange(option.value)}
                    className={`press-pill rounded-full border-2 px-3 py-1.5 text-sm font-bold ${
                      status === option.value
                        ? "is-selected border-(--pc) opacity-100"
                        : "border-transparent opacity-55"
                    }`}
                    style={
                      {
                        "--pc": STATUS_COLORS[option.value],
                        background: `color-mix(in srgb, ${STATUS_COLORS[option.value]} 30%, var(--color-surface))`,
                        color: "var(--color-ink)",
                      } as CSSProperties
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {showProgress ? (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink/60">
                  Progress
                </p>
                {pageCount ? (
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="number"
                      min={0}
                      max={pageCount}
                      value={page}
                      onChange={(event) => handlePageChange(event.target.value)}
                      className="w-24 rounded border border-ink/20 bg-surface px-2 py-1"
                    />
                    <span className="text-ink/60">of {pageCount} pages</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={percent}
                      onChange={(event) =>
                        handlePercentChange(event.target.value)
                      }
                      className="w-24 rounded border border-ink/20 bg-surface px-2 py-1"
                    />
                    <span className="text-ink/60">% complete</span>
                  </div>
                )}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/15">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm italic text-ink/60">
                {status === "want_to_read"
                  ? 'No progress to track yet — flip to "Reading" once you start.'
                  : "✓ Finished — page tracking not needed."}
              </p>
            )}

            {showRating && (
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink/60">
                  Rating
                </p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(rating === star ? null : star)}
                      aria-label={`${star} star`}
                      className={`press-star text-2xl leading-none ${
                        rating !== null && star <= rating
                          ? "text-yellow-500"
                          : "text-ink/25"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            )}

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-bold uppercase tracking-wide text-ink/60">
                Notes
              </span>
              <textarea
                value={review}
                onChange={(event) => setReview(event.target.value)}
                rows={3}
                className="rounded border border-ink/20 bg-surface px-2 py-1"
                placeholder="Private notes about this book"
              />
            </label>
          </div>
        </div>

        <div className="flex gap-2 px-6 pb-6">
          <button
            type="button"
            disabled={isSaving}
            onClick={() =>
              onSave({
                status,
                percentComplete: progressPercent,
                rating: showRating ? rating : null,
                review: review.trim() || null,
              })
            }
            className="float flex-1 rounded-full bg-primary px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {isSaving ? "Saving..." : entry ? "Update" : "Add to list"}
          </button>
          {entry && (
            <button
              type="button"
              disabled={isRemoving}
              onClick={() => onRemove()}
              className="float rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isRemoving ? "Removing..." : "Remove"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
