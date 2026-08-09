import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import {
  getRecommendationCategories,
  getRecommendationsForUser,
  getSimilarBooks,
} from "../services/recommendations";

export function useRecommendations(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recommendations", user?.id, limit],
    queryFn: () => getRecommendationsForUser(user!.id, limit),
    enabled: !!user,
    staleTime: 60 * 60 * 1000,
  });
}

export function useRecommendationCategories(booksPerCategory = 12) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recommendation-categories", user?.id, booksPerCategory],
    queryFn: () => getRecommendationCategories(user!.id, booksPerCategory),
    enabled: !!user,
    staleTime: 60 * 60 * 1000,
  });
}

export function useSimilarBooks(bookId: string, limit = 10) {
  return useQuery({
    queryKey: ["similar-books", bookId, limit],
    queryFn: () => getSimilarBooks(bookId, limit),
    enabled: !!bookId,
  });
}
