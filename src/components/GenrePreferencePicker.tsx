import { useMemo, useState } from "react";
import { useGenrePreferences } from "../hooks/useGenrePreferences";
import GenrePreferenceModal from "./GenrePreferenceModal";
import { buildGenreColorMap } from "../lib/genreColors";

export default function GenrePreferencePicker({
  profileId,
  compact = false,
}: {
  /** Whose preferences to show — defaults to the signed-in user's own.
   * Preferences are visible to any signed-in user; only the profile's
   * owner gets the "edit genres" control. */
  profileId?: string;
  /** Folds the picker into a small inline pill row (for the profile
   * header) instead of its own full card section. */
  compact?: boolean;
}) {
  const {
    genres,
    selectedGenreIds,
    isLoading,
    saveSelection,
    isSaving,
    isOwnProfile,
  } = useGenrePreferences(profileId);
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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
    const shown = isExpanded ? selectedGenres : selectedGenres.slice(0, 3);
    const extra = selectedGenres.length - shown.length;

    return (
      <>
        <div className="genre-preference-compact flex flex-wrap items-center gap-2">
          {shown.map((genre) => (
            <span
              key={genre.id}
              className="genre-preference-chip whitespace-nowrap rounded-full font-bold text-ink"
              style={{ background: colorByGenreId.get(genre.id) }}
            >
              {genre.name}
            </span>
          ))}
          {extra > 0 && (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="genre-preference-text-btn profile-subtext font-bold hover:text-primary"
            >
              +{extra} more
            </button>
          )}
          {isExpanded && selectedGenres.length > 3 && (
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="genre-preference-text-btn profile-subtext font-bold hover:text-primary"
            >
              Show less
            </button>
          )}
          {isOwnProfile && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              title="Edit genre preferences"
              className="genre-preference-add flex flex-none items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-primary hover:text-primary"
            >
              +
            </button>
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
      </>
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded border bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Genre preferences</h2>
        {isOwnProfile && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded border bg-white px-3 py-1.5 text-sm"
          >
            Edit genres
          </button>
        )}
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
