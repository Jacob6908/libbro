import { useState } from "react";
import { useListEntry } from "../hooks/useListEntry";
import ListEntryModal from "./ListEntryModal";
import { STATUS_COLORS, STATUS_LABELS } from "../lib/statusColors";

export default function ListEntryEditor({
  bookId,
  pageCount,
  title,
  authors,
}: {
  bookId: string;
  pageCount: number | null;
  title: string;
  authors: string[];
}) {
  const { entry, isLoading, save, isSaving, remove, isRemoving } =
    useListEntry(bookId);
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return <p className="text-sm text-ink/60">Loading your tracking info...</p>;
  }

  return (
    <>
      {entry ? (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="flex w-fit items-center gap-2 rounded-full border bg-surface px-4 py-2 text-sm font-bold"
        >
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: STATUS_COLORS[entry.status] }}
          />
          {STATUS_LABELS[entry.status]}
          {entry.status === "reading" && ` · ${entry.percent_complete}%`}
          <span className="text-ink/40">· Edit</span>
        </button>
      ) : (
        <button
          type="button"
          disabled={isSaving}
          onClick={() =>
            save({
              status: "want_to_read",
              percentComplete: 0,
              rating: null,
              review: null,
            })
          }
          className="w-fit rounded-full bg-primary px-4 py-2 text-sm font-bold text-white"
        >
          {isSaving ? "Adding..." : "+ Add to your list"}
        </button>
      )}

      {isEditing && (
        <ListEntryModal
          key={entry?.id ?? "new"}
          entry={entry}
          pageCount={pageCount}
          title={title}
          authors={authors}
          onSave={(input) => {
            save(input);
            setIsEditing(false);
          }}
          isSaving={isSaving}
          onRemove={() => {
            remove();
            setIsEditing(false);
          }}
          isRemoving={isRemoving}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  );
}
