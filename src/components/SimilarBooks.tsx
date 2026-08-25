import { useSimilarBooks } from "../hooks/useRecommendations";
import RecommendationShelfRow from "./RecommendationShelfRow";

export default function SimilarBooks({ bookId }: { bookId: string }) {
  const { data: books, isLoading } = useSimilarBooks(bookId);

  if (isLoading || !books || books.length === 0) {
    return null;
  }

  return <RecommendationShelfRow title="Similar books" books={books} />;
}
