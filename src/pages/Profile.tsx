import { useState } from "react";
import { useProfile } from "../hooks/useProfile";
import GenrePreferencePicker from "../components/GenrePreferencePicker";
import type { Profile as ProfileRow } from "../types/database.types";
import type { ProfilePatch } from "../services/supabase/profiles";

export default function Profile() {
  const { profile, isLoading, save, isSaving, error } = useProfile();

  if (isLoading) {
    return <p className="p-8 text-sm text-gray-500">Loading your profile...</p>;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Your profile</h1>
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
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");

  return (
    <section className="flex flex-col gap-3 rounded border p-4">
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-16 w-16 flex-none rounded-full object-cover"
          />
        ) : (
          <div className="h-16 w-16 flex-none rounded-full bg-gray-200" />
        )}
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Avatar URL
          <input
            type="url"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            placeholder="https://..."
            className="rounded border px-2 py-1"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Username
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="rounded border px-2 py-1"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Bio
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          rows={3}
          className="rounded border px-2 py-1"
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
            avatar_url: avatarUrl.trim() || null,
          })
        }
        className="w-fit rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {isSaving ? "Saving..." : "Save profile"}
      </button>
    </section>
  );
}
