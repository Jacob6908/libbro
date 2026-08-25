import type { ShelfTitleStyle } from "../types/database.types";

/** Shelf-title display options a user can pick in "Edit profile". Applied
 * everywhere `.shelf-row-title` renders (Profile, Home, Recommendations)
 * via a `data-shelf-title-style` attribute — see ShelfRow.css /
 * RecommendationShelfRow.css for the actual per-style rules. */
export const SHELF_TITLE_STYLES: {
  key: Exclude<ShelfTitleStyle, "floating-lift">;
  name: string;
  sample: string;
  description: string;
}[] = [
  {
    key: "spine-tick",
    name: "Spine tick",
    sample: "Summer Reads",
    description: "A quiet colored spine mark beside the title.",
  },
  {
    key: "ledger-rule",
    name: "Ledger rule",
    sample: "Finished This Year",
    description: "Small-caps catalog type with a rule underneath.",
  },
  {
    key: "chip-wordmark",
    name: "Genre chip",
    sample: "Favorites",
    description: "A soft label shape around each shelf title.",
  },
];

export const DEFAULT_SHELF_TITLE_STYLE: ShelfTitleStyle = "spine-tick";
