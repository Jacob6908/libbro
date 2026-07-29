import { useState } from "react";
import { useListEntry } from "../hooks/useListEntry";
import type { ListEntry, ReadingStatus } from "../types/database.types";

const STATUS_OPTIONS: { value: ReadingStatus; label: string }[] = [
  { value: "want_to_read", label: "Want to read" },
  { value: "reading", label: "Reading" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On hold" },
  { value: "dropped", label: "Dropped" },
];

export default function ListEntryEditor({
  bookId,
  pageCount,
}: {
  bookId: string;
  pageCount: number | null;
}) {
  const { entry, isLoading, save, isSaving, remove, isRemoving } =
    useListEntry(bookId);

  if (isLoading) {
    return (
      <p className="text-sm text-gray-500">Loading your tracking info...</p>
    );
  }

  return (
    <ListEntryForm
      // Remount (and re-derive initial state) whenever we move to a
      // different book or the loaded entry identity changes.
      key={entry?.id ?? "new"}
      entry={entry}
      pageCount={pageCount}
      onSave={save}
      isSaving={isSaving}
      onRemove={remove}
      isRemoving={isRemoving}
    />
  );
}

function ListEntryForm({
  entry,
  pageCount,
  onSave,
  isSaving,
  onRemove,
  isRemoving,
}: {
  entry: ListEntry | null;
  pageCount: number | null;
  onSave: (input: {
    status: ReadingStatus;
    percentComplete: number;
    rating: number | null;
    review: string | null;
  }) => void;
  isSaving: boolean;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const [status, setStatus] = useState<ReadingStatus>(
    entry?.status ?? "want_to_read"
  );
  const [percentComplete, setPercentComplete] = useState(
    entry?.percent_complete ?? 0
  );
  const [rating, setRating] = useState<number | null>(entry?.rating ?? null);
  const [review, setReview] = useState(entry?.review ?? "");

  const pageLabel =
    pageCount && percentComplete > 0
      ? ` (~page ${Math.round((percentComplete / 100) * pageCount)} of ${pageCount})`
      : "";

  return (
    <section className="flex flex-col gap-3 rounded border p-4">
      <h2 className="font-medium">Your tracking</h2>

      <label className="flex flex-col gap-1 text-sm">
        Status
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as ReadingStatus)}
          className="rounded border px-2 py-1"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Progress: {percentComplete}%{pageLabel}
        <input
          type="range"
          min={0}
          max={100}
          value={percentComplete}
          onChange={(event) => setPercentComplete(Number(event.target.value))}
        />
      </label>

      <div className="flex flex-col gap-1 text-sm">
        Rating
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
        Notes
        <textarea
          value={review}
          onChange={(event) => setReview(event.target.value)}
          rows={3}
          className="rounded border px-2 py-1"
          placeholder="Private notes about this book"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={isSaving}
          onClick={() =>
            onSave({
              status,
              percentComplete,
              rating,
              review: review.trim() || null,
            })
          }
          className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {isSaving ? "Saving..." : entry ? "Update" : "Add to list"}
        </button>
        {entry && (
          <button
            type="button"
            disabled={isRemoving}
            onClick={() => onRemove()}
            className="rounded border px-3 py-2 text-sm disabled:opacity-50"
          >
            {isRemoving ? "Removing..." : "Remove from list"}
          </button>
        )}
      </div>
    </section>
  );
}
