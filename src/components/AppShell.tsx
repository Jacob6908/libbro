import { useState } from "react";
import { Outlet } from "react-router";
import NavBar from "./NavBar";
import { useProfile } from "../hooks/useProfile";
import { DEFAULT_BACKGROUND_THEME } from "../lib/backgroundThemes";
import { DEFAULT_SHELF_TITLE_STYLE } from "../lib/shelfTitleStyles";
import { SetThemePreviewContext } from "../hooks/useThemePreview";
import type { BackgroundTheme } from "../types/database.types";
import "./AppShell.css";

export default function AppShell() {
  const { profile } = useProfile();
  // Set while ProfileEditModal is open and the owner is trying out a
  // different background theme, so the whole app previews it live —
  // cleared (falling back to the saved `profile.background_theme`)
  // whenever the modal closes, saved or not.
  const [previewTheme, setPreviewTheme] = useState<BackgroundTheme | null>(
    null
  );

  return (
    <SetThemePreviewContext.Provider value={setPreviewTheme}>
      <div
        className="app-theme min-h-screen"
        data-theme={
          previewTheme ?? profile?.background_theme ?? DEFAULT_BACKGROUND_THEME
        }
        data-shelf-title-style={
          profile?.shelf_title_style ?? DEFAULT_SHELF_TITLE_STYLE
        }
      >
        <NavBar />
        <Outlet />
      </div>
    </SetThemePreviewContext.Provider>
  );
}
