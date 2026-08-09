# Open Questions

Unresolved questions surfaced during vault audits. Grouped by topic.
Answer these with real evidence when it appears — don't guess.

## Deployment

- **Is there a deployment target?** Still unknown as of this audit —
  no CI/CD config, no `vercel.json` or equivalent, no deployment docs
  exist anywhere in the repo. Why it matters: a `runbooks/` deploy doc
  would otherwise have to be fabricated, which audits avoid doing.

## Architecture

- **Is a Google Books API key actually provisioned and
  referrer-restricted?** The code reads `VITE_GOOGLE_BOOKS_API_KEY` but
  whether a real, properly restricted key is configured wasn't
  re-verified in this audit (env values are never inspected/stored here
  by policy). Why it matters: unauthenticated Google Books quota is only
  ~1000/day, and this matters more now — see the next item.
- **Is the increased Google Books request volume from the new
  multi-query search strategy a problem?** As of 2026-08-07,
  `googleBooksProvider.ts` issues up to 3 parallel API requests per
  search keystroke (exact-phrase, per-term, raw) instead of 1, to
  improve match recall — see `architecture.md`'s "Search result
  ranking". Why it matters: this multiplies quota consumption 2-3x per
  search; worth revisiting if the ~1000/day unauthenticated quota (or
  even a provisioned key's quota) turns out to be a real constraint in
  practice. Not measured or hit yet as of this audit.
- **Should a periodic schema snapshot be exported into
  `vault/working/`?** Proposed as a lightweight mitigation for
  `decisions/ADR-002-dashboard-managed-schema.md`'s accepted risk, not
  yet actually done. Why it matters: right now there is no record
  anywhere in git of what the live schema looks like beyond this
  vault's manually-written description, which can drift silently.

## Testing / quality

- **Should an automated test suite be added?** Deliberately deferred for
  v1 (same choice `issho` made). All verification so far has been
  browser-driven manual/scripted testing during the build session
  itself, which doesn't persist as regression protection. Why it
  matters: several real bugs were found this way (a signup-flow bug, an
  auth-redirect race condition, an HTML-rendering bug, and a missing
  database grant) — none of them would be caught automatically on a
  future change without some form of persisted test.

## Product — bookshelves

- **Should shelves get a real reordering UI?** `reorderShelves` exists in
  `services/supabase/shelves.ts` and `useShelves`, but nothing in
  `Profile.tsx` calls it — shelves display in a fixed `position` order
  with no drag/up-down control. Why it matters: it's built but inert,
  the same "finished at the data layer, not wired to UI" state
  `getRecommendationsForUser` is in below — someone should decide
  whether to finish wiring it up or remove it until it's needed.
- **Should adding a book to a custom shelf eventually work from the
  shelf/profile view itself** (a search-and-add picker), not just from
  that book's own detail page? Shipped as a deliberate v1 scope cut (see
  `specs/bookshelves.md`) reusing the page where a book is already open.
  Why it matters: the current flow requires already having found the
  book via `/books` first; a from-the-shelf picker would let a user
  build out a shelf without leaving `/profile`, at the cost of new UI.
- **Should `/u/:username` ever become discoverable** (a user
  search/directory), rather than only reachable by already knowing a
  username or following the "preview" link from your own profile? No
  such feature exists per the "no social features" non-goal in
  `product.md`; whether read-only shelf visibility eventually implies
  wanting a way to find other users is undecided.

## Product

- **Should `getRecommendationsForUser`/`useRecommendations` (the
  original flat recommendation list) be kept, removed, or repurposed?**
  As of the 2026-08-07 categorized-recommendations rework, `Home.tsx`
  and `Recommendations.tsx` both moved to `getRecommendationCategories`
  instead — nothing in `src/pages/` calls the flat version anymore, but
  it wasn't deleted. Why it matters: it's functioning dead code today;
  someone should decide whether to remove it, or whether it has a future
  use (e.g. a non-categorized fallback) that justifies keeping it.
- **When (if ever) does series/volume tracking get built?** Deliberately
  deferred, see `decisions/ADR-005-defer-series-and-volumes.md`. No
  target version or timeline exists.
- **Should `profile_genre_preferences.weight` stay fixed at 2 long-term?**
  The genre-preference modal rework (see `specs/genre-preferences.md`)
  made the picker binary; every new selection writes a constant
  `weight = 2`, and the column itself was kept rather than dropped
  (recommendation given: keep it as headroom for a future strength
  signal, since 2 pre-existing rows still carry real `weight = 3` data
  that a schema migration would have destroyed). That recommendation was
  never explicitly confirmed by the user — the conversation moved on to
  shipping before answering it. Why it matters: `specs/recommendations.md`
  still describes the explicit signal as weight-driven, but in practice
  it's now nearly flat; if the answer turns out to be "derive weight from
  something real" (e.g. genre frequency among rated books), that's a
  small, well-contained change to `useGenrePreferences.ts` — but nobody
  should assume that's the plan until it's actually decided.
