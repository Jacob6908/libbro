import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useProfile } from "../hooks/useProfile";
import AvatarImage from "./AvatarImage";
import AvatarCropModal from "./AvatarCropModal";
import {
  BACKGROUND_THEMES,
  DEFAULT_BACKGROUND_THEME,
} from "../lib/backgroundThemes";
import {
  SHELF_TITLE_STYLES,
  DEFAULT_SHELF_TITLE_STYLE,
} from "../lib/shelfTitleStyles";
import type {
  BackgroundTheme,
  Profile as ProfileRow,
  ShelfTitleStyle,
} from "../types/database.types";
import type { ProfilePatch } from "../services/supabase/profiles";

const ACCEPTED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;

export default function ProfileEditModal({
  onClose,
  onPreviewBackgroundTheme,
}: {
  onClose: () => void;
  /** Called as the user tries different swatches, so the real page behind
   * the modal can preview the theme live — nothing is persisted until
   * "Save profile" is clicked. */
  onPreviewBackgroundTheme: (theme: BackgroundTheme) => void;
}) {
  const {
    profile,
    isLoading,
    saveAsync,
    isSaving,
    error,
    uploadAvatar,
    isUploadingAvatar,
    avatarError,
  } = useProfile();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/70 p-6">
      <div
        className="flex max-h-[min(760px,calc(100vh-3rem))] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-edit-title"
      >
        <div className="flex flex-none items-start justify-between gap-4 border-b px-7 py-5">
          <div>
            <h2 id="profile-edit-title" className="font-medium">
              Edit profile
            </h2>
            <p className="text-sm text-gray-500">
              Username, bio, and photo — separate from your book lists.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-7 py-5">
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading your profile...</p>
          ) : (
            <>
              <AvatarUploader
                avatarUrl={profile?.avatar_url ?? null}
                onUpload={uploadAvatar}
                isUploading={isUploadingAvatar}
                error={avatarError}
              />
              <ProfileForm
                key={profile?.id ?? "loading"}
                profile={profile}
                onSave={async (patch) => {
                  await saveAsync(patch);
                  onClose();
                }}
                isSaving={isSaving}
                error={error}
                onPreviewBackgroundTheme={onPreviewBackgroundTheme}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AvatarUploader({
  avatarUrl,
  onUpload,
  isUploading,
  error,
}: {
  avatarUrl: string | null;
  onUpload: (file: File) => void;
  isUploading: boolean;
  error: unknown;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingImageSrc, setPendingImageSrc] = useState<string | null>(null);
  const [selectError, setSelectError] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setSelectError("Please choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_SOURCE_IMAGE_BYTES) {
      setSelectError("Image must be under 20MB.");
      return;
    }

    setSelectError(null);
    setPendingImageSrc(URL.createObjectURL(file));
  };

  const closeCropModal = () => {
    if (pendingImageSrc) URL.revokeObjectURL(pendingImageSrc);
    setPendingImageSrc(null);
  };

  const handleCropConfirm = (file: File) => {
    onUpload(file);
    closeCropModal();
  };

  const displayedError =
    selectError ?? (error instanceof Error ? error.message : null);

  return (
    <div className="flex items-center gap-4">
      <AvatarImage url={avatarUrl} size={64} />
      <div className="flex flex-col gap-1">
        <button
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className="w-fit rounded-full border bg-white px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
        >
          {isUploading ? "Uploading..." : "Change photo"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleChange}
          className="hidden"
        />
        <p className="text-xs text-gray-500">
          JPEG, PNG, WebP, or GIF - you&apos;ll be able to crop it next.
        </p>
        {displayedError && (
          <p className="text-sm text-red-600">{displayedError}</p>
        )}
      </div>
      {pendingImageSrc && (
        <AvatarCropModal
          imageSrc={pendingImageSrc}
          onCancel={closeCropModal}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}

function ProfileForm({
  profile,
  onSave,
  isSaving,
  error,
  onPreviewBackgroundTheme,
}: {
  profile: ProfileRow | null;
  onSave: (patch: ProfilePatch) => Promise<void>;
  isSaving: boolean;
  error: unknown;
  onPreviewBackgroundTheme: (theme: BackgroundTheme) => void;
}) {
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [backgroundTheme, setBackgroundTheme] = useState<BackgroundTheme>(
    profile?.background_theme ?? DEFAULT_BACKGROUND_THEME
  );
  const [shelfTitleStyle, setShelfTitleStyle] = useState<ShelfTitleStyle>(
    profile?.shelf_title_style ?? DEFAULT_SHELF_TITLE_STYLE
  );

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Username
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="rounded border bg-white px-2 py-1"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Bio
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          rows={3}
          className="rounded border bg-white px-2 py-1"
        />
      </label>

      <div className="flex flex-col gap-1.5 text-sm">
        <span>Background theme</span>
        <div className="grid grid-cols-5 gap-2">
          {BACKGROUND_THEMES.map((theme) => (
            <button
              key={theme.key}
              type="button"
              title={theme.name}
              onClick={() => {
                setBackgroundTheme(theme.key);
                onPreviewBackgroundTheme(theme.key);
              }}
              className={`flex h-11 flex-col items-center justify-center rounded-lg border-2 ${
                backgroundTheme === theme.key
                  ? "border-primary"
                  : "border-transparent"
              }`}
              style={{ background: theme.page }}
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: theme.primary }}
              />
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500">
          {BACKGROUND_THEMES.find((t) => t.key === backgroundTheme)?.name}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 text-sm">
        <span>Shelf title style</span>
        <div className="grid grid-cols-1 gap-2">
          {SHELF_TITLE_STYLES.map((style) => (
            <button
              key={style.key}
              type="button"
              onClick={() => setShelfTitleStyle(style.key)}
              className={`shelf-title-option rounded-lg border-2 px-3 py-2 text-left ${
                shelfTitleStyle === style.key
                  ? "border-primary text-primary"
                  : "border-transparent bg-gray-50 text-gray-700"
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-wide">
                {style.name}
              </span>
              <span
                className={`shelf-title-option-preview shelf-title-option-preview--${style.key}`}
              >
                {style.sample}
              </span>
              <span className="text-xs font-normal text-gray-500">
                {style.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error instanceof Error && (
        <p className="text-sm text-red-600">{error.message}</p>
      )}

      <button
        type="button"
        disabled={isSaving || !username.trim()}
        onClick={() =>
          onSave({
            username: username.trim(),
            bio: bio.trim() || null,
            background_theme: backgroundTheme,
            shelf_title_style: shelfTitleStyle,
          })
        }
        className="w-fit rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Save profile"}
      </button>
    </div>
  );
}
