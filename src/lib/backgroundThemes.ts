import type { BackgroundTheme } from "../types/database.types";

/** Default profile-page backdrops a user can pick in "Edit profile".
 * Each overrides `--color-page`/`--color-ink`/`--color-primary` only
 * within the profile page's own subtree (see `Profile.css`) — shelf
 * card spine colors and genre chip colors come from the fixed
 * `lib/genreColors.ts` palette and don't change with theme. */
export const BACKGROUND_THEMES: {
  key: BackgroundTheme;
  name: string;
  page: string;
  ink: string;
  primary: string;
}[] = [
  {
    key: "warm-paper",
    name: "Warm Paper",
    page: "#f6f1e8",
    ink: "#2b271f",
    primary: "#4c6a83",
  },
  {
    key: "reading-room",
    name: "Reading Room",
    page: "#eef0e3",
    ink: "#232f1f",
    primary: "#5c7a4f",
  },
  {
    key: "night-shelf",
    name: "Night Shelf",
    page: "#1c1a16",
    ink: "#ece6d8",
    primary: "#d8a15c",
  },
  {
    key: "sun-faded",
    name: "Sun-Faded",
    page: "#f3e6cf",
    ink: "#4a3826",
    primary: "#b5652f",
  },
  {
    key: "ink-slate",
    name: "Ink & Slate",
    page: "#e6e9ee",
    ink: "#23272e",
    primary: "#3a5975",
  },
];

export const DEFAULT_BACKGROUND_THEME: BackgroundTheme = "warm-paper";
