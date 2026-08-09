import type { ReadingStatus } from "../types/database.types";

/** Same 8-hue "spine" palette as `genreColors.ts`, assigned per status
 * rather than cycled, so a status carries the same color everywhere. */
export const STATUS_COLORS: Record<ReadingStatus, string> = {
  want_to_read: "#e7caa6", // ochre
  reading: "#a9c5c2", // teal
  completed: "#bcc3a9", // moss
  on_hold: "#aebcc7", // slate
  dropped: "#cba9b0", // wine
};

export const STATUS_LABELS: Record<ReadingStatus, string> = {
  want_to_read: "Want to read",
  reading: "Reading",
  completed: "Completed",
  on_hold: "On hold",
  dropped: "Dropped",
};

export const STATUS_OPTIONS: { value: ReadingStatus; label: string }[] = [
  { value: "want_to_read", label: STATUS_LABELS.want_to_read },
  { value: "reading", label: STATUS_LABELS.reading },
  { value: "completed", label: STATUS_LABELS.completed },
  { value: "on_hold", label: STATUS_LABELS.on_hold },
  { value: "dropped", label: STATUS_LABELS.dropped },
];
