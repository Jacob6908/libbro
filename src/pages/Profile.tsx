import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useProfile } from "../hooks/useProfile";
import GenrePreferencePicker from "../components/GenrePreferencePicker";
import AvatarImage from "../components/AvatarImage";
import AvatarCropModal from "../components/AvatarCropModal";
import type { Profile as ProfileRow } from "../types/database.types";
import type { ProfilePatch } from "../services/supabase/profiles";

const ACCEPTED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;

export default function Profile() {
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

  if (isLoading) {
    return <p className="p-8 text-sm text-gray-500">Loading your profile...</p>;
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Your profile</h1>
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
      <GenrePreferencePicker />
    </main>
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
    <section className="flex items-center gap-4 rounded border bg-white p-4">
      <AvatarImage url={avatarUrl} size={64} />
      <div className="flex flex-col gap-1">
        <button
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className="w-fit rounded border bg-white px-3 py-2 text-sm disabled:opacity-50"
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
    </section>
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
    <section className="flex flex-col gap-3 rounded border bg-white p-4">
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
        className="w-fit rounded bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Save profile"}
      </button>
    </section>
  );
}
