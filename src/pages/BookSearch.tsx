import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useBookSearch } from "../hooks/useBookSearch";
import { importBookFromGoogleBooks } from "../api/bookImport";
import type { MergedSearchResult } from "../hooks/useBookSearch";
import BookShelfCover from "../components/BookShelfCover";
import "../components/BookShelfCover.css";

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
      navigate(`/books/${book.id}`);
    },
  });

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Search books</h1>
      <input
        type="search"
        placeholder="Title or author"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="rounded border bg-white px-3 py-2"
        autoFocus
      />
      {isLoading && <p className="text-sm text-gray-500">Searching...</p>}
      {error && (
        <p className="text-sm text-red-600">
          Something went wrong searching for books.
        </p>
      )}
      <div className="shelf-grid">
        {results.map((result) => (
          <button
            key={result.key}
            type="button"
            disabled={openBook.isPending}
            onClick={() => openBook.mutate(result)}
            className="shelf-card-btn"
          >
            <BookShelfCover
              title={result.title}
              authors={result.authors}
              coverImageUrl={result.coverImageUrl}
            />
          </button>
        ))}
      </div>
    </main>
  );
}
