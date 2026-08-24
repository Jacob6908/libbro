import type { ShelfTitleStyle } from "../types/database.types";

/** Shelf-title display options a user can pick in "Edit profile". Applied
 * everywhere `.shelf-row-title` renders (Profile, Home, Recommendations)
 * via a `data-shelf-title-style` attribute — see ShelfRow.css /
 * RecommendationShelfRow.css for the actual per-style rules. */
export const SHELF_TITLE_STYLES: { key: ShelfTitleStyle; name: string }[] = [
  { key: "spine-tick", name: "Spine tick" },
  { key: "ledger-rule", name: "Ledger rule" },
  { key: "chip-wordmark", name: "Genre chip" },
  { key: "floating-lift", name: "Floating lift" },
];

export const DEFAULT_SHELF_TITLE_STYLE: ShelfTitleStyle = "spine-tick";
