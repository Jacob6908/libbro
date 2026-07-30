import { useMemo, useState } from "react";
import { useGenrePreferences } from "../hooks/useGenrePreferences";
import GenrePreferenceModal from "./GenrePreferenceModal";
import { buildGenreColorMap } from "../lib/genreColors";

export default function GenrePreferencePicker() {
  const { genres, selectedGenreIds, isLoading, saveSelection, isSaving } =
    useGenrePreferences();
  const [isEditing, setIsEditing] = useState(false);
  const colorByGenreId = useMemo(() => buildGenreColorMap(genres), [genres]);

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading genres...</p>;
  }

  const selectedGenres = genres.filter((genre) =>
    selectedGenreIds.has(genre.id)
  );

  const handleSave = async (nextSelectedIds: Set<number>) => {
    await saveSelection(nextSelectedIds);
    setIsEditing(false);
  };

  return (
    <section className="flex flex-col gap-3 rounded border bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Genre preferences</h2>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded border bg-white px-3 py-1.5 text-sm"
        >
          Edit genres
        </button>
      </div>
      <p className="text-sm text-gray-600">
        Tell us what you like - this shapes your recommendations.
      </p>

      <div className="flex flex-wrap gap-2">
        {selectedGenres.length === 0 ? (
          <p className="text-sm text-gray-500">No genres selected yet.</p>
        ) : (
          selectedGenres.map((genre) => (
            <span
              key={genre.id}
              className="rounded-full px-3 py-1 text-xs font-medium text-ink"
              style={{ background: colorByGenreId.get(genre.id) }}
            >
              {genre.name}
            </span>
          ))
        )}
      </div>

      {isEditing && (
        <GenrePreferenceModal
          genres={genres}
          initiallySelectedIds={selectedGenreIds}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          isSaving={isSaving}
        />
      )}
    </section>
  );
}
