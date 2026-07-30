import { Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useMyList } from "../hooks/useMyList";
import { useRecommendations } from "../hooks/useRecommendations";
import ListEntryRow from "../components/ListEntryRow";
import BookCoverCard from "../components/BookCoverCard";

export default function Home() {
  const { user } = useAuth();
  const { entries, isLoading: isListLoading } = useMyList();
  const { data: recommended, isLoading: isRecsLoading } = useRecommendations(5);

  const currentlyReading = entries.filter(
    (entry) => entry.status === "reading"
  );

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <p className="text-sm text-gray-600">Signed in as {user?.email}</p>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">Currently reading</h2>
        {isListLoading && <p className="text-sm text-gray-500">Loading...</p>}
        {!isListLoading && currentlyReading.length === 0 && (
          <p className="text-sm text-gray-500">
            Nothing in progress - search for a book to get started.
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {currentlyReading.map((entry) => (
            <li key={entry.id}>
              <ListEntryRow entry={entry} />
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Recommended for you</h2>
          <Link
            to="/recommendations"
            className="text-sm text-primary underline"
          >
            See all
          </Link>
        </div>
        {isRecsLoading && <p className="text-sm text-gray-500">Loading...</p>}
        <ul className="flex flex-col gap-2">
          {recommended?.map((book) => (
            <li key={book.id}>
              <Link
                to={`/books/${book.id}`}
                className="flex items-center gap-3 rounded border bg-white px-3 py-2"
              >
                <BookCoverCard
                  title={book.title}
                  authors={book.authors}
                  coverImageUrl={book.cover_image_url}
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
