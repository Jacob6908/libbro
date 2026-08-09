import { useState } from "react";
import type { CSSProperties } from "react";
import type { ListEntry, ReadingStatus } from "../types/database.types";
import { STATUS_COLORS, STATUS_OPTIONS } from "../lib/statusColors";

const PROGRESS_STATUSES: ReadingStatus[] = ["reading", "on_hold", "dropped"];

export default function ListEntryModal({
  entry,
  pageCount,
  title,
  authors,
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
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
          <div>
            <h2 className="font-serif text-lg font-semibold">{title}</h2>
            <p className="text-sm text-gray-500">
              {authors.join(", ")}
              {authors.length > 0 && pageCount ? " · " : ""}
              {pageCount ? `${pageCount} pages` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 py-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
              Status
            </p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleStatusChange(option.value)}
                  className="rounded-full border-2 px-3 py-1.5 text-sm font-bold"
                  style={
                    {
                      "--pc": STATUS_COLORS[option.value],
                      background: `color-mix(in srgb, ${STATUS_COLORS[option.value]} 30%, white)`,
                      color: "var(--color-ink)",
                      borderColor:
                        status === option.value
                          ? STATUS_COLORS[option.value]
                          : "transparent",
                      opacity: status === option.value ? 1 : 0.55,
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
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
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
                    className="w-24 rounded border px-2 py-1"
                  />
                  <span className="text-gray-500">of {pageCount} pages</span>
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
                    className="w-24 rounded border px-2 py-1"
                  />
                  <span className="text-gray-500">% complete</span>
                </div>
              )}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm italic text-gray-500">
              {status === "want_to_read"
                ? 'No progress to track yet — flip to "Reading" once you start.'
                : "✓ Finished — page tracking not needed."}
            </p>
          )}

          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">
              Rating
            </p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(rating === star ? null : star)}
                  aria-label={`${star} star`}
                  className={`text-2xl leading-none ${
                    rating !== null && star <= rating
                      ? "text-yellow-500"
                      : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Notes
            </span>
            <textarea
              value={review}
              onChange={(event) => setReview(event.target.value)}
              rows={3}
              className="rounded border px-2 py-1"
              placeholder="Private notes about this book"
            />
          </label>
        </div>

        <div className="flex gap-2 px-6 pb-6">
          <button
            type="button"
            disabled={isSaving}
            onClick={() =>
              onSave({
                status,
                percentComplete: progressPercent,
                rating,
                review: review.trim() || null,
              })
            }
            className="flex-1 rounded-full bg-primary px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {isSaving ? "Saving..." : entry ? "Update" : "Add to list"}
          </button>
          {entry && (
            <button
              type="button"
              disabled={isRemoving}
              onClick={() => onRemove()}
              className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
            >
              {isRemoving ? "Removing..." : "Remove"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
