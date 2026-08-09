import { useState } from "react";
import { Link } from "react-router";
import { useProfile } from "../hooks/useProfile";
import { useMyList } from "../hooks/useMyList";
import { useListEntry } from "../hooks/useListEntry";
import {
  useRecommendationCategories,
  useSimilarBooks,
} from "../hooks/useRecommendations";
import AvatarImage from "../components/AvatarImage";
import ListEntryRow from "../components/ListEntryRow";
import ListEntryModal from "../components/ListEntryModal";
import RecommendationShelfRow from "../components/RecommendationShelfRow";
import BookShelfCover from "../components/BookShelfCover";
import "../components/BookShelfCover.css";
import "../components/RecommendationShelfRow.css";

const UP_NEXT_COUNT = 6;

export default function Home() {
  const { profile } = useProfile();
  const { entries, isLoading: isListLoading } = useMyList();
  const { data: recommendationCategories } = useRecommendationCategories(10);
  const [isEditingSpotlight, setIsEditingSpotlight] = useState(false);

  // `entries` is already ordered by updated_at desc, so the first reading
  // entry is the most recently touched one.
  const readingEntries = entries.filter((entry) => entry.status === "reading");
  const spotlight = readingEntries[0] ?? null;
  const otherReading = readingEntries.slice(1);
  const upNext = entries
    .filter((entry) => entry.status === "want_to_read")
    .slice(0, UP_NEXT_COUNT);
  const recommendedRow = recommendationCategories?.[0] ?? null;

  const { data: similarBooks } = useSimilarBooks(spotlight?.book_id ?? "");
  const {
    entry: spotlightListEntry,
    save: saveSpotlight,
    isSaving: isSavingSpotlight,
    remove: removeSpotlight,
    isRemoving: isRemovingSpotlight,
  } = useListEntry(spotlight?.book_id ?? "");

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AvatarImage url={profile?.avatar_url ?? null} size={44} />
          <div>
            <p className="text-xs text-gray-500">Signed in as</p>
            <p className="font-serif text-lg font-bold">
              {profile?.username ?? "..."}
            </p>
          </div>
        </div>
        <Link to="/profile" className="text-sm font-semibold text-primary">
          View full profile →
        </Link>
      </div>

      {isListLoading && (
        <p className="text-sm text-gray-500">Loading your books...</p>
      )}

      {spotlight && (
        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-lg font-semibold">Continue reading</h2>
          <div className="grid grid-cols-[140px_1fr] gap-6 rounded-2xl bg-white p-6 shadow-sm">
            <BookShelfCover
              title={spotlight.book.title}
              authors={[]}
              coverImageUrl={spotlight.book.cover_image_url}
            />
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Reading
              </p>
              <h3 className="font-serif text-xl font-semibold">
                {spotlight.book.title}
              </h3>
              {spotlight.book.authors.length > 0 && (
                <p className="text-sm text-gray-600">
                  {spotlight.book.authors.join(", ")}
                </p>
              )}
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                <span>{spotlight.percent_complete}% complete</span>
                <div className="h-1.5 w-40 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${spotlight.percent_complete}%` }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingSpotlight(true)}
                className="mt-1 w-fit rounded-full border bg-white px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
              >
                Update progress
              </button>
            </div>
          </div>

          {otherReading.length > 0 && (
            <ul className="flex flex-col gap-2">
              {otherReading.map((entry) => (
                <li key={entry.id}>
                  <ListEntryRow entry={entry} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {spotlight && similarBooks && similarBooks.length > 0 && (
        <RecommendationShelfRow
          title={`Because you're reading ${spotlight.book.title}`}
          books={similarBooks}
        />
      )}

      {upNext.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-lg font-semibold">Up next</h2>
            <Link to="/profile" className="text-sm font-semibold text-primary">
              See your full list →
            </Link>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-1">
            {upNext.map((entry) => (
              <Link
                key={entry.id}
                to={`/books/${entry.book.id}`}
                className="shelf-card-btn"
                style={{ width: 132, flex: "0 0 132px" }}
              >
                <BookShelfCover
                  title={entry.book.title}
                  authors={entry.book.authors}
                  coverImageUrl={entry.book.cover_image_url}
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {recommendedRow && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-end">
            <Link
              to="/recommendations"
              className="text-sm font-semibold text-primary"
            >
              View all recommended →
            </Link>
          </div>
          <RecommendationShelfRow
            title={recommendedRow.title}
            books={recommendedRow.books}
          />
        </div>
      )}

      {isEditingSpotlight && spotlight && (
        <ListEntryModal
          entry={spotlightListEntry}
          pageCount={spotlight.book.page_count}
          title={spotlight.book.title}
          authors={spotlight.book.authors}
          onSave={(input) => {
            saveSpotlight(input);
            setIsEditingSpotlight(false);
          }}
          isSaving={isSavingSpotlight}
          onRemove={() => {
            removeSpotlight();
            setIsEditingSpotlight(false);
          }}
          isRemoving={isRemovingSpotlight}
          onClose={() => setIsEditingSpotlight(false)}
        />
      )}
    </main>
  );
}
