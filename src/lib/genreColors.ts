import type { Genre } from "../types/database.types";

/**
 * Cloth-binding-inspired accent colors, cycled by a genre's position in the
 * alphabetized list. Soft-pastel tint (55% toward white) of the original
 * spine colors, for use as fills with dark ink text rather than white text.
 */
const SPINE_COLORS = [
  "#deb1a7", // rust
  "#a9c5c2", // teal
  "#bcc3a9", // moss
  "#c4b2c6", // plum
  "#e7caa6", // ochre
  "#aebcc7", // slate
  "#cba9b0", // wine
  "#a9bcb1", // forest
];

export function buildGenreColorMap(genres: Genre[]): Map<number, string> {
  return new Map(
    genres.map((genre, i) => [genre.id, SPINE_COLORS[i % SPINE_COLORS.length]])
  );
}
