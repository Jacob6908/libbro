import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useProfile } from "../hooks/useProfile";
import AvatarImage from "./AvatarImage";
import AvatarCropModal from "./AvatarCropModal";
import type { Profile as ProfileRow } from "../types/database.types";
import type { ProfilePatch } from "../services/supabase/profiles";

const ACCEPTED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;

export default function ProfileEditModal({ onClose }: { onClose: () => void }) {
  const {
    profile,
    isLoading,
    save,
    isSaving,
    error,
    uploadAvatar,
    isUploadingAvatar,
    avatarError,
  } = useProfile();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
          <div>
            <h2 className="font-medium">Edit profile</h2>
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

        <div className="flex flex-col gap-4 px-6 py-4">
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
                onSave={save}
                isSaving={isSaving}
                error={error}
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
}: {
  profile: ProfileRow | null;
  onSave: (patch: ProfilePatch) => void;
  isSaving: boolean;
  error: unknown;
}) {
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");

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
          })
        }
        className="w-fit rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Save profile"}
      </button>
    </div>
  );
}
