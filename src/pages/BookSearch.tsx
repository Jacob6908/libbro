import { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useBookSearch } from "../hooks/useBookSearch";
import { importBookFromProvider } from "../api/bookImport";
import type { MergedSearchResult } from "../hooks/useBookSearch";
import BookCoverCard from "../components/BookCoverCard";

export default function BookSearch() {
  const [query, setQuery] = useState("");
  const { results, isLoading, error } = useBookSearch(query);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const openBook = useMutation({
    mutationFn: async (result: MergedSearchResult) => {
      if (result.localBook) return result.localBook;
      return importBookFromProvider(result.externalId);
    },
    onSuccess: (book) => {
      queryClient.invalidateQueries({ queryKey: ["books", "local-search"] });
      navigate(`/books/${book.id}`);
    },
  });

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
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
      <ul className="flex flex-col gap-2">
        {results.map((result) => (
          <li key={result.key}>
            <button
              type="button"
              disabled={openBook.isPending}
              onClick={() => openBook.mutate(result)}
              className="flex w-full items-center gap-3 rounded border bg-white px-3 py-2 text-left disabled:opacity-50"
            >
              <BookCoverCard
                title={result.title}
                authors={result.authors}
                coverImageUrl={result.coverImageUrl}
              />
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
