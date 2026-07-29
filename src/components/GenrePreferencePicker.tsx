import { useGenrePreferences } from "../hooks/useGenrePreferences";

const WEIGHT_LABELS: Record<number, string> = {
  1: "Meh",
  2: "Like",
  3: "Love",
};

export default function GenrePreferencePicker() {
  const { genres, preferences, isLoading, setWeight, remove, isMutating } =
    useGenrePreferences();

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading genres...</p>;
  }

  const weightByGenreId = new Map(
    preferences.map((p) => [p.genre_id, p.weight])
  );

  return (
    <section className="flex flex-col gap-2 rounded border p-4">
      <h2 className="font-medium">Genre preferences</h2>
      <p className="text-sm text-gray-600">
        Tell us what you like - this shapes your recommendations.
      </p>
      <div className="flex flex-col divide-y">
        {genres.map((genre) => {
          const currentWeight = weightByGenreId.get(genre.id) ?? null;
          return (
            <div
              key={genre.id}
              className="flex items-center justify-between py-2"
            >
              <span className="text-sm">{genre.name}</span>
              <div className="flex gap-1">
                {[1, 2, 3].map((weight) => (
                  <button
                    key={weight}
                    type="button"
                    disabled={isMutating}
                    onClick={() =>
                      currentWeight === weight
                        ? remove(genre.id)
                        : setWeight({ genreId: genre.id, weight })
                    }
                    className={`rounded border px-2 py-1 text-xs disabled:opacity-50 ${
                      currentWeight === weight
                        ? "border-black bg-black text-white"
                        : "border-gray-300 text-gray-600"
                    }`}
                  >
                    {WEIGHT_LABELS[weight]}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
