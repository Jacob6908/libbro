import type { Genre } from "../types/database.types";

/** Cloth-binding-inspired accent colors, cycled by a genre's position in the alphabetized list. */
const SPINE_COLORS = [
  "#b5523c", // rust
  "#3f7d78", // teal
  "#6b7a3f", // moss
  "#7c5480", // plum
  "#c98a3a", // ochre
  "#4c6a83", // slate
  "#8c3f4f", // wine
  "#3f6b52", // forest
];

export function buildGenreColorMap(genres: Genre[]): Map<number, string> {
  return new Map(
    genres.map((genre, i) => [genre.id, SPINE_COLORS[i % SPINE_COLORS.length]])
  );
}
