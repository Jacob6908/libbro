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
  ~1000/day.
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

## Product

- **When (if ever) does series/volume tracking get built?** Deliberately
  deferred, see `decisions/ADR-005-defer-series-and-volumes.md`. No
  target version or timeline exists.
