---
status: accepted
date: 2026-07-29
---

# ADR-006: The genre palette becomes the app's primary visual theme

## Context

Through v1 and the nav bar/avatar-upload/genre-modal additions, libbro's
UI was plain Tailwind default black/white/gray with no color system at
all — every button was `bg-black`, every surface was implicit white, no
accent color existed anywhere. The only color in the app was the 8-hue
"spine" palette introduced for genre chips
(`specs/genre-preferences.md`), cycling by a genre's alphabetical
position.

The user liked that palette specifically and asked to promote it to the
app's primary UI theme rather than leave it scoped to genre chips, with
a "page tinted white" background as the other half of the idea. Two
rounds of visual exploration were built as standalone preview artifacts
(not wired into the app) before anything was changed: first a 3-depth
comparison (original/soft-pastel/whisper-pastel) of all 8 hues, then a
second pass showing background-tint candidates and primary-accent
candidates in context (mock nav + button + chips on each option). The
user picked concrete options from these previews via direct questions,
rather than the choice being inferred or defaulted.

## Decision

- **Depth**: the 8 genre hues move to their soft-pastel tint (55%
  blended toward white) as the app's categorical accent set — used for
  genre chips/highlights, no longer the bold/deep originals.
- **Background**: the page background becomes a warm, neutral
  off-white tint, `#f6f1e8` ("warm paper"), not leaning toward any one
  accent hue.
- **Primary accent**: one color, slate (`#4c6a83`, at its original —
  not pastel — depth for sufficient contrast), is the single repeated
  color for buttons, links, active nav/tab state, and focus rings across
  the whole app. The 8-hue pastel set is for categorical variety (genre
  chips only); it does not supply the primary action color.
- **Surfaces**: bordered "card" containers, rows, and form inputs
  across every page get an explicit white background, so they read as
  white surfaces sitting on the tinted page rather than blending into
  it.
- **Rollout**: applied everywhere in one pass — every page and shared
  component — rather than staged, per the user's explicit choice over a
  foundation-first option.
- Implemented as Tailwind v4 `@theme` tokens (`--color-page`,
  `--color-ink`, `--color-primary`) in `src/index.css`, rather than
  hardcoded hex scattered through components — see `architecture.md`'s
  "Design tokens" section.

## Rationale

Direct, confirmed user choice at each decision point (palette depth,
background tint, primary accent, rollout scope), made after reviewing
two rounds of non-deployed visual previews — not a default this session
picked unilaterally. Slate was chosen over forest/wine specifically for
being the most conventional/neutral primary-button color of the three
candidates shown.

## Consequences

- This is the first real design-token system in the app; previously
  there was nothing to extend when adding new UI, now `bg-primary`/
  `text-primary`/`bg-page` exist as reusable utilities.
- Semantic colors already in use (yellow star ratings in
  `ListEntryEditor`, red error text throughout) were deliberately left
  outside this token system — they're conventional/functional colors,
  not brand accents, and recoloring them wasn't part of what was asked.
- No hover or focus-visible states exist on any button anywhere in the
  app (true before this change too) — the primary color makes this gap
  more visible than plain black did, but fixing it wasn't in scope here.
- Genre chip/highlight text changed from white to dark ink, since pastel
  fills don't support white text legibly — a knock-on change from the
  depth decision, not independently requested.

## Alternatives considered

- **Whisper pastel** (78% toward white) instead of soft (55%) — shown
  in the first preview, rejected as too washed out for buttons/badges.
- **Forest** (`#3f6b52`) or **wine** (`#8c3f4f`) as the primary accent
  instead of slate — shown in the second preview alongside slate;
  slate was preferred as the more conventional choice.
- **Foundation-first rollout** (tokens + nav/chrome only, pages
  following in a later pass) — offered as the lower-risk option;
  rejected in favor of restyling everything in one pass.

## Evidence

`src/index.css` (`@theme` block), `src/lib/genreColors.ts` (pastel hex
values), and the primary-color/white-surface classes applied across
every file under `src/pages/` and `src/components/` as of this ADR.
