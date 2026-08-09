export type ReadingStatus =
  "want_to_read" | "reading" | "completed" | "dropped" | "on_hold";

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
}

export interface CategoryAlias {
  raw_category: string;
  genre_id: number | null;
  created_at: string;
}

export interface ProfileGenrePreference {
  profile_id: string;
  genre_id: number;
  weight: number;
}

export interface Book {
  id: string;
  provider: string;
  external_id: string;
  title: string;
  subtitle: string | null;
  authors: string[];
  description: string | null;
  isbn_13: string | null;
  isbn_10: string | null;
  page_count: number | null;
  published_date: string | null;
  published_year: number | null;
  publisher: string | null;
  language: string | null;
  cover_image_url: string | null;
  average_rating: number | null;
  ratings_count: number | null;
  raw_categories: string[] | null;
  fetched_at: string;
  created_at: string;
  updated_at: string;
}

export type BookInsert = Omit<
  Book,
  "id" | "created_at" | "updated_at" | "fetched_at"
> & {
  fetched_at?: string;
};

export interface BookGenre {
  book_id: string;
  genre_id: number;
}

export interface ListEntry {
  id: string;
  user_id: string;
  book_id: string;
  status: ReadingStatus;
  percent_complete: number;
  rating: number | null;
  review: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Shelf {
  id: string;
  profile_id: string;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ShelfBook {
  shelf_id: string;
  book_id: string;
  position: number;
  added_at: string;
}
