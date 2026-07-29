import { googleBooksProvider } from "./googleBooksProvider";
import type { BookMetadataProvider } from "./types";

export const bookMetadataProvider: BookMetadataProvider = googleBooksProvider;

export type {
  BookSearchResult,
  BookDetail,
  BookMetadataProvider,
} from "./types";
