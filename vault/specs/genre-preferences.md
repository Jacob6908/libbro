---
status: implemented
last-reviewed: 2026-07-29
---

# Genre preference editing

## Goal

Let a user tell the app which of the 24 curated genres they like, as an
explicit signal into recommendations (see `specs/recommendations.md`),
in a way that's quick and engaging to fill out rather than a long
checklist.

## User behavior

On the profile page, the "Genre preferences" section shows the user's
current selections as colored chips (or "No genres selected yet") and an
"Edit genres" button. Clicking it opens `GenrePreferenceModal`: all 24
genres float in a gently swaying paragraph inside the modal body. Tapping
a genre highlights it (marker-sweep fill, per-genre accent color) and
adds it to a chip tray in the modal's footer; tapping a highlighted genre
again lifts the mark and removes its chip. Nothing is written to the
database until "Save preferences" is clicked; "Skip for now" (or the ×
close button) discards the in-progress selection and leaves stored
preferences untouched.

## Requirements

- Selection is binary — a genre is either preferred or it isn't. There is
  no in-modal way to express relative strength (no more Meh/Like/Love).
- On save, the modal's final selected-id set is diffed against the
  previously-fetched preferences (`useGenrePreferences`): newly-selected
  genres are upserted with `weight = 2` (a fixed constant,
  `EXPLICIT_WEIGHT` in the hook — matches `profile_genre_preferences
  .weight`'s own DB default, so no schema change was needed); newly-
  deselected genres are deleted; untouched genres are left alone
  (existing row and weight unchanged, whatever it is).
- Each genre gets a stable accent color from `lib/genreColors.ts`, which
  cycles 8 soft-pastel hex colors by the genre's position in the
  alphabetized `genres` list fetched from Supabase (`getAllGenres`
  orders by `name`). With 24 genres and 8 colors, every genre exactly 8
  positions apart alphabetically shares a color (e.g. Fantasy and
  Mystery) — an accepted visual limit of the palette size, not a bug.
  Selected genre text renders in dark ink, not white, since the pastel
  fills don't support white text legibly. These same 8 hues (at this
  pastel depth) went on to become the app's primary UI theme — see
  `architecture.md`'s "Design tokens" section and
  `decisions/ADR-006-genre-palette-as-primary-theme.md`.
- The floating/swaying motion is continuous CSS animation
  (`GenrePreferenceModal.css`); `prefers-reduced-motion: reduce` disables
  it entirely, falling back to a static layout.

## Acceptance criteria

Verified via a scripted Playwright session against the live dev server +
Supabase project during the build (a disposable test account was created
and its `auth.users`/`profiles` rows deleted afterward via SQL):

- Selecting genres in the modal and saving persists across a hard reload
  (chips reappear with matching colors).
- Deselecting a previously-selected genre and adding a different one in
  the same save round-trips correctly — the deselected genre's row is
  gone, the newly-added one is present, and an untouched third genre from
  an earlier save is unaffected.
- No console errors during any of the above.

## Permissions and security

Unchanged from before this rework — `profile_genre_preferences` is fully
RLS-private per user (see `architecture.md`); the modal only ever reads
and writes the signed-in user's own rows via the existing
`setGenrePreference`/`removeGenrePreference` service functions.

## Edge cases

- Rows written before this change may still hold `weight = 1` or `weight
  = 3` (2 rows at `weight = 3` remain as of this audit). These aren't
  migrated proactively; they keep contributing their original weight to
  recommendations scoring until the user deselects and reselects that
  genre, at which point they collapse to the new fixed `weight = 2`.
- The word-shelf's continuous sway means genre buttons are never
  perfectly stationary; this is intentional for a human user but means
  browser automation (Playwright) needs `force: true` on clicks, since
  its actionability check expects a settled bounding box.

## Out of scope

- Any UI for expressing preference strength again (e.g. a long-press or
  double-tap gesture analogous to Apple Music's like/love) — not built.
  Whether this is worth adding, and whether the `weight` column should
  stay fixed at 2 indefinitely or eventually be driven by something else
  entirely (e.g. inferred from read/rated books in that genre), is open
  — see `working/open-questions.md`.
- Migrating existing `weight = 1`/`weight = 3` rows to the new fixed
  value — left as-is (see Edge cases).

## Implementation status

Implemented. `src/components/GenrePreferencePicker.tsx`,
`src/components/GenrePreferenceModal.tsx`,
`src/components/GenrePreferenceModal.css`, `src/lib/genreColors.ts`,
`src/hooks/useGenrePreferences.ts`.

## Open questions

Whether the `weight` column should stay fixed at a flat 2 long-term, be
retired, or eventually be driven by a real signal — see
`working/open-questions.md`. Recommended (keep it, treat it as headroom)
during the rework that produced this modal, but not explicitly confirmed
by the user, so treated as open rather than decided.
