---
status: accepted
date: 2026-08-18
---

# ADR-010: "Floating hover" becomes libbro's standard interaction pattern

## Context

The genre-preference picker (`GenrePreferenceModal.css`, see
`specs/genre-preferences.md`) was the app's first "floating" UI
language: words continuously bob (`word-bob`/`genre-sway`, ambient and
always running) and a colored "mark" slides in from the left on
selection.

This session reworked `NavBar.tsx`/`NavBar.css`, replacing the flat
colored-pill/chip nav links that had existed since v1 with a
background-free nav where links float on interaction. Several rounds of
artifact-previewed directions narrowed this down through explicit user
feedback:

- Ambient/idle motion (every link gently bobbing all the time,
  regardless of hover) was rejected — "I only want what you are
  currently about to select to move, not everything has to move."
- A permanently lifted+tilted active/current-page link was rejected —
  "once you have selected an option I want it to just go back to
  normal, I don't want it to stay tilted." The colored underline mark
  was kept as the persistent "you are here" indicator instead.
- After the nav bar shipped, the user confirmed the floating/lift
  aspect specifically (not the tilt, which they called out as
  optional) as a pattern they want to reuse generally, not something
  scoped to the nav bar alone.

## Decision

"Floating hover" is now libbro's standard interaction pattern for
clickable elements, distinct from (but visually descended from) the
genre picker's ambient bob:

- **Resting state**: flat — no transform, no persistent lift or tilt.
- **Hover state**: the element lifts a few pixels (`translateY`,
  spring-like easing — `cubic-bezier(0.34, 1.56, 0.64, 1)` in
  `NavBar.css`), with a soft blurred ink-tinted shadow appearing
  underneath to read as "picked up off the page."
- **Tilt is optional** — a slight rotation may be added per-element
  (`--tilt` in `NavBar.css`) but is a per-instance embellishment, not a
  required part of the pattern.
- **Scoped motion only** — only the element actually being interacted
  with animates; sibling elements never move in response to a
  neighbor's hover. No ambient/idle animation for the group.
- **Persistent state ≠ persistent motion** — an element's "currently
  selected/active" indicator (e.g. a colored underline mark) may stay
  visible at rest, but the lift/tilt/shadow motion itself only fires on
  actual hover, even for the active item.

First implemented in `.nav-link`, `.nav-logo`, and `.nav-signout` in
`NavBar.css`.

## Rationale

Direct, confirmed user preference, arrived at by iterating on artifact
previews of several nav-bar hover directions (mark-only, lift-only,
ambient-float, and a mark+lift cross) before implementation, then
refined twice more against real usage (drop the ambient bob, stop the
active link from staying lifted). The floating/lift aspect was
explicitly what the user wanted generalized; tilt was explicitly called
out as optional, not part of the core pattern.

## Consequences

- Future interactive elements (buttons, cards, rows, etc.) that want a
  hover treatment should default to lift-on-hover-only as described
  above, adding tilt only where it fits that specific element, and must
  not animate siblings or idle/ambient-animate as a group.
- This corrects `index.md`'s prior framing (from the previous audit)
  that nav bar changes were "routine feature additions... not new
  architectural tradeoffs" — this particular nav bar rework introduced
  a genuine, reusable interaction-design decision.
- No shared abstraction (a common CSS class, or a hook) exists yet for
  "floating hover" — it's implemented directly in `NavBar.css` only.
  Worth extracting if a second component adopts the pattern.
- The genre picker's own ambient bob is unchanged and not deprecated by
  this decision — it continues to be that component's own established
  behavior; this ADR governs new/general use elsewhere, not a
  retrofit of existing components.

## Alternatives considered

- **Ambient/idle bob on all nav links at all times** (matching the
  genre picker's own animation) — previewed as one of the original nav
  bar directions, rejected in favor of interaction-scoped motion only.
- **Active link stays permanently lifted/tilted** (the nav bar's first
  implementation) — rejected once seen in practice; only the color mark
  persists now.

## Evidence

`src/components/NavBar.tsx`, `src/components/NavBar.css` (this
session's edits), contrasted with `src/components/GenrePreferenceModal.css`'s
`word-bob`/`genre-sway` keyframes, which predate and inspired but are
not equivalent to this pattern.
