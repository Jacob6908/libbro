import { Link } from "react-router";
import BookCoverCard from "./BookCoverCard";
import type { ListEntryWithBook } from "../services/supabase/listEntries";
import { STATUS_LABELS } from "../lib/statusColors";

export default function ListEntryRow({ entry }: { entry: ListEntryWithBook }) {
  return (
    <Link
      to={`/books/${entry.book.id}`}
      className="flex items-center justify-between gap-3 rounded border bg-surface px-3 py-2"
    >
      <BookCoverCard
        title={entry.book.title}
        authors={entry.book.authors}
        coverImageUrl={entry.book.cover_image_url}
      />
      <div className="flex-none text-right text-xs text-ink/70">
        <p>{STATUS_LABELS[entry.status] ?? entry.status}</p>
        {entry.status === "reading" && <p>{entry.percent_complete}%</p>}
        {entry.rating != null && <p>{"★".repeat(entry.rating)}</p>}
      </div>
    </Link>
  );
}
