# Security Updates - 2026-08-09 (session notes)

**Reconciled into durable docs during the 2026-08-09 vault audit** —
`architecture.md`'s "Auth flow" section and the new `specs/auth.md` now
describe the resulting behavior in full; this file is kept only as a
short pointer plus the scope boundary, not as the primary reference.

This session did a client-side auth/Supabase-connection hardening pass:
env-var validation at client creation, explicit Supabase auth client
options, hardened session hydration, redirect-when-already-authenticated
on `/signin`/`/signup`, a session guard on `/reset-password`, a shared
8-char/digit/special-character password rule, and a set of
Chrome-credential-manager workarounds (masked password fields on
sign-up/reset, fully manual form submission, tuned `autocomplete`
attributes). Shipped as branch `login_updates`, PR #10, merged to
`main`. See `specs/auth.md` for what this produced.

## Verification run during the session

`npm run lint`, `npx tsc -b --noEmit`, `npm run build` — all passed
after each implementation batch. A local dev server smoke-tested
`/`, `/signin`, `/signup`, `/reset-password` all returning `200 OK`,
then was stopped.

## Not covered by this work

No Supabase dashboard, RLS, storage policy, table grant, or
profile/content sanitization change was made. Specifically untouched:

- Supabase RLS policies, table grants, Auth dashboard settings, redirect
  allowlists, storage bucket policies
- password policy enforcement on the Supabase side
- MFA, rate limiting/bot protection
- profile input validation or content sanitization
- book/cache write permissions

Those remain separate, un-started Supabase-side or broader
application-security tasks — see `working/open-questions.md`.
