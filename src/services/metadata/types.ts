export interface BookSearchResult {
  externalId: string;
  title: string;
  subtitle?: string | null;
  authors: string[];
  coverImageUrl?: string | null;
  publishedDate?: string | null;
}

export interface BookDetail extends BookSearchResult {
  description?: string | null;
  isbn13?: string | null;
  isbn10?: string | null;
  pageCount?: number | null;
  categories: string[];
  publisher?: string | null;
  language?: string | null;
  averageRating?: number | null;
  ratingsCount?: number | null;
}

export interface BookMetadataProvider {
  readonly providerName: string;
  search(query: string, opts?: { limit?: number }): Promise<BookSearchResult[]>;
  getById(externalId: string): Promise<BookDetail | null>;
}
