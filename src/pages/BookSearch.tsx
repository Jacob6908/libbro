import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useBookSearch } from "../hooks/useBookSearch";
import { importBookFromGoogleBooks } from "../api/bookImport";
import type { MergedSearchResult } from "../hooks/useBookSearch";
import { getTitleSpineColor } from "../lib/genreColors";
import BookShelfCover from "../components/BookShelfCover";
import "../components/BookShelfCover.css";
import "./BookSearch.css";

const OPEN_TRANSITION_MS = 550;

export default function BookSearch() {
  // The input itself is driven by local state, so every keystroke is
  // instantly responsive. It's seeded from (and mirrored into) the URL's
  // `q` param so the search survives a round trip to a book's detail
  // page: back navigation remounts this page against that same history
  // entry, restoring the query instead of a blank search box.
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQueryState] = useState(() => searchParams.get("q") ?? "");
  const { results, isLoading, error } = useBookSearch(query);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [openResult, setOpenResult] = useState<MergedSearchResult | null>(null);
  const openTimeoutRef = useRef<number | null>(null);

  function setQuery(value: string) {
    setQueryState(value);
    setSearchParams(value ? { q: value } : {}, { replace: true });
  }

  const openBook = useMutation({
    mutationFn: async (result: MergedSearchResult) => {
      if (result.localBook) return result.localBook;
      return importBookFromGoogleBooks(result.externalId);
    },
    onSuccess: (book) => {
      queryClient.invalidateQueries({ queryKey: ["books", "local-search"] });
      // Pre-seed the detail page's cache so it's fully rendered right
      // away instead of showing a brief loading state.
      queryClient.setQueryData(["books", "by-id", book.id], book);
      // Let the spread panel's opening animation play before navigating,
      // so the click reads as the book opening rather than an instant jump.
      openTimeoutRef.current = window.setTimeout(() => {
        navigate(`/books/${book.id}`);
      }, OPEN_TRANSITION_MS);
    },
  });

  function openCard(result: MergedSearchResult) {
    setOpenResult(result);
    openBook.mutate(result);
  }

  function closeSpread() {
    if (openTimeoutRef.current !== null) {
      window.clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    setOpenResult(null);
  }

  useEffect(() => {
    return () => {
      if (openTimeoutRef.current !== null) {
        window.clearTimeout(openTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!openResult) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeSpread();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openResult]);

  const trimmed = query.trim();
  const blurb =
    openBook.data?.description ?? openResult?.localBook?.description ?? null;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8">
      <div className="search-hero">
        <h1>What are you in the mood for?</h1>
        <div className="search-shell">
          <input
            type="search"
            placeholder="Search your shelves…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="search-input"
            autoFocus
          />
        </div>
        {trimmed.length === 0 && (
          <p className="search-status">
            Search your library, or the wider Google Books catalog.
          </p>
        )}
        {trimmed.length === 1 && <p className="search-status">Keep typing…</p>}
        {isLoading && <p className="search-status">Searching…</p>}
        {!isLoading && trimmed.length >= 2 && (
          <p className="search-status">
            {results.length} result{results.length === 1 ? "" : "s"} for
            &nbsp;&ldquo;{trimmed}&rdquo;
          </p>
        )}
        {error && (
          <p className="mt-2 text-center text-sm text-red-600">
            Something went wrong searching for books.
          </p>
        )}
      </div>
      <div className="shelf-grid">
        {results.map((result) => (
          <button
            key={result.key}
            type="button"
            disabled={openResult !== null}
            onClick={() => openCard(result)}
            className="shelf-card-btn"
          >
            <BookShelfCover
              title={result.title}
              authors={result.authors}
              coverImageUrl={result.coverImageUrl}
              variant="browse"
            />
          </button>
        ))}
      </div>

      <div
        className={`book-scrim ${openResult ? "show" : ""}`}
        onClick={closeSpread}
      />
      {openResult && (
        <div
          className={`book-spread ${openResult ? "show" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label={openResult.title}
        >
          <div
            className="book-spread-cover"
            style={{ background: getTitleSpineColor(openResult.title) }}
          >
            {openResult.coverImageUrl && (
              <img src={openResult.coverImageUrl} alt="" />
            )}
          </div>
          <div className="book-spread-body">
            <h2>{openResult.title}</h2>
            {openResult.authors.length > 0 && (
              <p className="book-spread-author">
                {openResult.authors.join(", ")}
              </p>
            )}
            {openBook.isError ? (
              <p className="book-spread-blurb">
                Something went wrong opening this book.
              </p>
            ) : (
              <p className="book-spread-blurb">{blurb ?? "Opening…"}</p>
            )}
            <button
              type="button"
              className="book-spread-close"
              onClick={closeSpread}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
