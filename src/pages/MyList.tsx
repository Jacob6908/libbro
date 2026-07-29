import { useState } from "react";
import { useMyList } from "../hooks/useMyList";
import ListEntryRow from "../components/ListEntryRow";
import type { ReadingStatus } from "../types/database.types";

const TABS: { value: ReadingStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "want_to_read", label: "Want to read" },
  { value: "reading", label: "Reading" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On hold" },
  { value: "dropped", label: "Dropped" },
];

export default function MyList() {
  const { entries, isLoading } = useMyList();
  const [tab, setTab] = useState<ReadingStatus | "all">("all");

  const filtered =
    tab === "all" ? entries : entries.filter((e) => e.status === tab);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">My list</h1>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`rounded border px-3 py-1 text-sm ${
              tab === t.value
                ? "border-black bg-black text-white"
                : "border-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <p className="text-sm text-gray-500">Loading your list...</p>
      )}
      {!isLoading && filtered.length === 0 && (
        <p className="text-sm text-gray-500">Nothing here yet.</p>
      )}

      <ul className="flex flex-col gap-2">
        {filtered.map((entry) => (
          <li key={entry.id}>
            <ListEntryRow entry={entry} />
          </li>
        ))}
      </ul>
    </main>
  );
}
