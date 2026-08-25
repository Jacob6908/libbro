import { Link } from "react-router";
import BookCoverCard from "./BookCoverCard";
import type { ListEntryWithBook } from "../services/supabase/listEntries";
import { STATUS_LABELS } from "../lib/statusColors";
import "./ListEntryRow.css";

const rowClassName =
  "list-entry-row flex w-full items-center justify-between gap-3 rounded-lg px-3 py-3.5 text-left";

/** Row content only - shared between the Link and button render paths so
 * they stay visually identical. */
function ListEntryRowContent({ entry }: { entry: ListEntryWithBook }) {
  return (
    <>
      <div className="min-w-0 flex-1">
        <BookCoverCard
          title={entry.book.title}
          authors={entry.book.authors}
          coverImageUrl={entry.book.cover_image_url}
        />
      </div>
      <div className="flex-none text-right text-sm text-ink/60 tabular-nums">
        {entry.status === "reading" ? (
          <p>{entry.percent_complete}%</p>
        ) : (
          <p>{STATUS_LABELS[entry.status] ?? entry.status}</p>
        )}
        {entry.rating != null && <p>{"★".repeat(entry.rating)}</p>}
      </div>
    </>
  );
}

export default function ListEntryRow({
  entry,
  onSelect,
}: {
  entry: ListEntryWithBook;
  /** When provided, the row becomes a focus-switch button instead of a link
   * to the book detail page - used on the home dashboard, where clicking
   * another "currently reading" book should bring it into the spotlight
   * rather than navigate away. */
  onSelect?: () => void;
}) {
  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} className={rowClassName}>
        <ListEntryRowContent entry={entry} />
      </button>
    );
  }

  return (
    <Link to={`/books/${entry.book.id}`} className={rowClassName}>
      <ListEntryRowContent entry={entry} />
    </Link>
  );
}
