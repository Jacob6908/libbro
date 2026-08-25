import { createContext, useContext } from "react";
import type { BackgroundTheme } from "../types/database.types";

/** Lets ProfileEditModal's live theme-swatch preview reach the app-wide
 * theme wrapper in AppShell, even though AppShell is an ancestor of the
 * page that owns the edit modal, not a descendant. Nothing is persisted
 * until "Save profile" — this only drives the live preview. */
export const SetThemePreviewContext = createContext<
  (theme: BackgroundTheme | null) => void
>(() => {});

export function useSetThemePreview() {
  return useContext(SetThemePreviewContext);
}
