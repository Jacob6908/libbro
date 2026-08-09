import { useMemo, useState } from "react";
import { useGenrePreferences } from "../hooks/useGenrePreferences";
import GenrePreferenceModal from "./GenrePreferenceModal";
import { buildGenreColorMap } from "../lib/genreColors";

export default function GenrePreferencePicker({
  compact = false,
}: {
  /** Folds the picker into a small inline pill row (for the profile
   * header) instead of its own full card section. */
  compact?: boolean;
}) {
  const { genres, selectedGenreIds, isLoading, saveSelection, isSaving } =
    useGenrePreferences();
  const [isEditing, setIsEditing] = useState(false);
  const colorByGenreId = useMemo(() => buildGenreColorMap(genres), [genres]);

  if (isLoading) {
    return compact ? null : (
      <p className="text-sm text-gray-500">Loading genres...</p>
    );
  }

  const selectedGenres = genres.filter((genre) =>
    selectedGenreIds.has(genre.id)
  );

  const handleSave = async (nextSelectedIds: Set<number>) => {
    await saveSelection(nextSelectedIds);
    setIsEditing(false);
  };

  if (compact) {
    const shown = selectedGenres.slice(0, 3);
    const extra = selectedGenres.length - shown.length;

    return (
      <>
        <div className="flex flex-wrap items-center gap-1.5">
          {shown.map((genre) => (
            <span
              key={genre.id}
              className="whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold text-ink"
              style={{ background: colorByGenreId.get(genre.id) }}
            >
              {genre.name}
            </span>
          ))}
          {extra > 0 && (
            <span className="text-xs font-bold text-gray-400">
              +{extra} more
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            title="Edit genre preferences"
            className="flex h-5 w-5 flex-none items-center justify-center rounded-full border border-dashed border-gray-300 text-xs text-gray-400 hover:border-primary hover:text-primary"
          >
            +
          </button>
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
      </>
    );
  }

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
