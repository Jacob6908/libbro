import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useProfile } from "../hooks/useProfile";
import { useMyList } from "../hooks/useMyList";
import AvatarImage from "../components/AvatarImage";
import BookShelfCover from "../components/BookShelfCover";
import ProfileEditModal from "../components/ProfileEditModal";
import GenrePreferencePicker from "../components/GenrePreferencePicker";
import { STATUS_COLORS, STATUS_LABELS } from "../lib/statusColors";
import type { ReadingStatus } from "../types/database.types";
import "../components/BookShelfCover.css";

const TABS: { value: ReadingStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "want_to_read", label: "Want to read" },
  { value: "reading", label: "Reading" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On hold" },
  { value: "dropped", label: "Dropped" },
];

export default function Profile() {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const { entries, isLoading: isListLoading } = useMyList();
  const [tab, setTab] = useState<ReadingStatus | "all">("all");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const filtered =
    tab === "all" ? entries : entries.filter((e) => e.status === tab);

  const completedThisYear = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return entries.filter(
      (entry) =>
        entry.status === "completed" &&
        entry.finished_at != null &&
        new Date(entry.finished_at).getFullYear() === currentYear
    ).length;
  }, [entries]);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <AvatarImage url={profile?.avatar_url ?? null} size={56} />
          <div>
            <h1 className="text-2xl font-semibold">
              {isProfileLoading
                ? "Your books"
                : `${profile?.username ?? "Your"}'s books`}
            </h1>
            <p className="text-sm text-gray-500">
              {entries.length} tracked · {completedThisYear} finished this year
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsEditingProfile(true)}
          className="rounded-full border bg-white px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
        >
          ✎ Edit profile
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className="rounded-full px-4 py-2 text-sm font-bold"
            style={{
              background:
                t.value === "all"
                  ? "var(--color-primary)"
                  : `color-mix(in srgb, ${STATUS_COLORS[t.value]} 32%, white)`,
              color: t.value === "all" ? "white" : "var(--color-ink)",
              opacity: tab === t.value ? 1 : 0.6,
              outline:
                tab === t.value ? "2px solid var(--color-primary)" : undefined,
              outlineOffset: tab === t.value ? "2px" : undefined,
            }}
          >
            {t.label}
            <span className="ml-1 font-medium opacity-70">
              {t.value === "all"
                ? entries.length
                : entries.filter((e) => e.status === t.value).length}
            </span>
          </button>
        ))}
      </div>

      {isListLoading && (
        <p className="text-sm text-gray-500">Loading your books...</p>
      )}
      {!isListLoading && filtered.length === 0 && (
        <p className="text-sm text-gray-500">
          Nothing here yet - search for a book to get started.
        </p>
      )}

      <div className="shelf-grid">
        {filtered.map((entry) => (
          <Link
            key={entry.id}
            to={`/books/${entry.book.id}`}
            className="shelf-card-btn"
          >
            <BookShelfCover
              title={entry.book.title}
              authors={entry.book.authors}
              coverImageUrl={entry.book.cover_image_url}
              badge={
                <span className="shelf-card-badge">
                  <span
                    className="shelf-card-badge-swatch"
                    style={{ background: STATUS_COLORS[entry.status] }}
                  />
                  {STATUS_LABELS[entry.status]}
                  {entry.status === "reading" &&
                    ` · ${entry.percent_complete}%`}
                </span>
              }
            />
          </Link>
        ))}
      </div>

      <GenrePreferencePicker />

      {isEditingProfile && (
        <ProfileEditModal onClose={() => setIsEditingProfile(false)} />
      )}
    </main>
  );
}
