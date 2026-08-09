import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getBookById } from "../services/supabase/books";
import ListEntryEditor from "../components/ListEntryEditor";
import SimilarBooks from "../components/SimilarBooks";

export default function BookDetail() {
  const { bookId } = useParams<{ bookId: string }>();

  const { data: book, isLoading } = useQuery({
    queryKey: ["books", "by-id", bookId],
    queryFn: () => getBookById(bookId!),
    enabled: !!bookId,
  });

  if (isLoading) {
    return <p className="p-8 text-sm text-gray-500">Loading...</p>;
  }

  if (!book) {
    return <p className="p-8 text-sm text-red-600">Book not found.</p>;
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8">
      <div className="flex gap-4">
        {book.cover_image_url ? (
          <img
            src={book.cover_image_url}
            alt=""
            className="h-48 w-32 flex-none rounded object-cover"
          />
        ) : (
          <div className="h-48 w-32 flex-none rounded bg-gray-200" />
        )}
        <div>
          <h1 className="text-2xl font-semibold">{book.title}</h1>
          {book.subtitle && (
            <p className="text-lg text-gray-600">{book.subtitle}</p>
          )}
          {book.authors.length > 0 && (
            <p className="text-sm text-gray-600">{book.authors.join(", ")}</p>
          )}
          {book.page_count && (
            <p className="text-sm text-gray-500">{book.page_count} pages</p>
          )}
        </div>
      </div>
      {book.description && (
        <p className="whitespace-pre-line text-sm text-gray-800">
          {book.description}
        </p>
      )}
      <ListEntryEditor
        bookId={book.id}
        pageCount={book.page_count}
        title={book.title}
        authors={book.authors}
      />
      <SimilarBooks bookId={book.id} />
    </main>
  );
}
