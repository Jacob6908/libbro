import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { Genre } from "../types/database.types";
import { buildGenreColorMap } from "../lib/genreColors";
import "./GenrePreferenceModal.css";

export default function GenrePreferenceModal({
  genres,
  initiallySelectedIds,
  onSave,
  onCancel,
  isSaving,
}: {
  genres: Genre[];
  initiallySelectedIds: Set<number>;
  onSave: (selectedIds: Set<number>) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(initiallySelectedIds)
  );
  const colorByGenreId = useMemo(() => buildGenreColorMap(genres), [genres]);

  // Deterministic per-genre float timing so the sway doesn't reshuffle on re-render.
  const animByGenreId = useMemo(() => {
    const map = new Map<number, { dur: string; delay: string }>();
    genres.forEach((genre) => {
      const seed = (genre.id * 9301 + 49297) % 233280;
      map.set(genre.id, {
        dur: (5 + (seed % 400) / 100).toFixed(2) + "s",
        delay: (-((seed % 600) / 100)).toFixed(2) + "s",
      });
    });
    return map;
  }, [genres]);

  const toggle = (genreId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(genreId)) next.delete(genreId);
      else next.add(genreId);
      return next;
    });
  };

  const selectedGenres = genres.filter((genre) => selected.has(genre.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex w-full max-w-xl flex-col overflow-hidden rounded bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
          <div>
            <h2 className="font-medium">Edit your shelf</h2>
            <p className="text-sm text-gray-500">
              Tap a genre to highlight it. Tap again to lift the mark.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onCancel}
            className="text-xl leading-none text-gray-400 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="genre-stage flex items-center justify-center px-6 py-4">
          <div className="word-flow">
            {genres.map((genre) => {
              const isSelected = selected.has(genre.id);
              const anim = animByGenreId.get(genre.id)!;
              return (
                <span
                  key={genre.id}
                  className="word-bob"
                  style={
                    {
                      "--dur": anim.dur,
                      "--delay": anim.delay,
                    } as CSSProperties
                  }
                >
                  <button
                    type="button"
                    className={`word-btn${isSelected ? " selected" : ""}`}
                    style={
                      { "--dot": colorByGenreId.get(genre.id) } as CSSProperties
                    }
                    onClick={() => toggle(genre.id)}
                  >
                    <span className="mark" />
                    {genre.name}
                  </button>
                </span>
              );
            })}
          </div>
        </div>

        <div className="border-t px-6 py-4">
          <div className="mb-3 flex min-h-[30px] gap-2 overflow-x-auto">
            {selectedGenres.length === 0 ? (
              <span className="py-1 text-sm text-gray-500">
                No genres selected yet
              </span>
            ) : (
              selectedGenres.map((genre) => (
                <span
                  key={genre.id}
                  className="flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full py-1 pl-3 pr-1 text-xs font-medium text-ink"
                  style={{ background: colorByGenreId.get(genre.id) }}
                >
                  {genre.name}
                  <button
                    type="button"
                    aria-label={`Remove ${genre.name}`}
                    onClick={() => toggle(genre.id)}
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-black/10 text-[11px]"
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="mr-auto text-xs text-gray-500 tabular-nums">
              {selected.size} selected
            </span>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="rounded border bg-white px-3 py-2 text-sm disabled:opacity-50"
            >
              Skip for now
            </button>
            <button
              type="button"
              onClick={() => onSave(selected)}
              disabled={isSaving}
              className="rounded bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save preferences"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
