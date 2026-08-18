---
status: implemented
last-reviewed: 2026-08-18
---

# Auth

## Goal

Email/password authentication (sign up, sign in, sign out, password
reset) that fails loudly on misconfiguration instead of producing
ambiguous runtime errors, doesn't leave a signed-in user able to
re-visit the sign-in/sign-up forms, and avoids Chrome's credential-
manager heuristics misfiring on account-creation and password-reset
forms. Originally scoped as a security-hardening pass (see
`working/2026-08-09-security-updates.md` for the session that did this
work) — this spec documents the resulting behavior as it stands now,
not the sequence of changes that produced it.

## User behavior

Four routes, none nested under the authenticated `RequireAuth`+`AppShell`
layout: `/signin`, `/signup`, `/forgot-password`, `/reset-password`.

- **`/signin`, `/signup`** — if a session already exists, both redirect
  to `/` immediately (`RedirectIfAuthenticated`, waits for auth
  hydration first) rather than showing the form. Switching between the
  two via their footer link clears the other form's local state first
  (email/password/errors) so a value typed into one doesn't carry into
  the other, and so Chrome doesn't see a "changed your mind mid-form"
  pattern that triggers its own save-password heuristics.
- **`/forgot-password`** — send a reset email; always shows the same
  "if an account exists..." confirmation regardless of whether the
  email matches an account (no account-enumeration signal). **Not**
  wrapped in `RedirectIfAuthenticated` — a signed-in user can still
  reach this page.
- **`/reset-password`** — requires an active Supabase session (the
  recovery session Supabase establishes when the user follows the
  emailed reset link, which `detectSessionInUrl` picks up from the URL).
  No session → redirect to `/forgot-password` rather than showing a form
  that would just fail on submit. After a successful password update,
  the recovery session is signed out and the user is sent to `/signin`
  — a recovery session is not left active after the password change.
- **Sign-out** (`NavBar.tsx`) — awaits `signOut()`, then navigates to
  `/signin` with `replace: true` explicitly, rather than relying on
  `onAuthStateChange` + `RequireAuth`'s redirect to happen eventually.

Visual design: all four auth pages share the same redesigned layout
(`src/pages/Auth.css`, `auth-page`/`auth-wordmark`/`auth-row`/
`auth-field` classes) — no card, a large centered "libbro" wordmark,
a centered filled `bg-primary` submit button below the form.
`/forgot-password` and `/reset-password` were extended to match
`/signin`/`/signup` in PR #13 (`better_covers`, merged 2026-08-17) —
verified by reading both pages' source (`src/pages/ForgotPassword.tsx`,
`src/pages/ResetPassword.tsx`), which now import `./Auth.css` and use
the same `auth-page`/`auth-wordmark`/`auth-form`/`auth-row`/`auth-field`
structure as `SignIn.tsx`/`SignUp.tsx`. This closes what was previously
documented here as a known visual inconsistency.

## Requirements

**Client setup** (`src/supabase-client.ts`): `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` are checked before `createClient` runs; a
missing value throws immediately with a named-variable error message
instead of failing later inside an auth call. `createClient` is called
with explicit `auth: { persistSession: true, autoRefreshToken: true,
detectSessionInUrl: true }` — these happen to match the library's own
defaults, but are now explicit/documented rather than implicit.

**Session hydration** (`src/context/AuthProvider.tsx`): the initial
`supabase.auth.getSession()` call now handles both a resolved `error`
and a rejected promise by clearing `user` (rather than leaving stale
state) and always reaching `setIsLoading(false)` via `.finally()`. An
`isMounted` flag guards every state update in case the provider
unmounts mid-check.

**Password rule** (`src/lib/authValidation.ts`, `PASSWORD_MIN_LENGTH =
8`): at least 8 characters, at least one digit, at least one
non-alphanumeric character — one shared regex (`PASSWORD_REGEX`) used
by both sign-up and password-reset. `PASSWORD_REQUIREMENT_CHECKS` is
the same rule split into three independently-checkable predicates,
driving the live per-requirement checklist UI on sign-up/reset-password
(each requirement turns green as it's satisfied while typing).
`EMAIL_REGEX`/`isValidEmail` is one shared pattern used by sign-in and
sign-up. Sign-in only validates that a password was entered (non-empty)
— it does not re-check the strength rule, since an existing account's
password may predate this rule or simply differ from it.

**Field-level validation, not native browser validation**: every auth
form sets `noValidate` and handles required/format/strength errors in
React (`emailError`/`passwordError` state per field, rendered directly
beneath that field), rather than relying on the browser's native
validation-bubble UI. A separate `error` state holds the
Supabase-returned message from a failed submission (shown in a
pastel-red `auth-form-error` box) — kept distinct from field-level
validation errors, which are about the input itself, not the server's
response to it.

**Browser credential-manager workarounds** (Chrome-specific, verified
against Chrome only — see Edge cases): sign-in remains a native
`type="password"` field, since credential saving *is* wanted there
after a successful login. Sign-up's and reset-password's password
inputs are `type="text"` with `-webkit-text-security: disc` (CSS class
`.auth-secret-input`) instead — Chrome was still treating a real
`type="password"` field on those forms as a save-credential candidate
even with no native form submission, so the fields were changed to not
look like password inputs to the browser at all while still rendering
masked. None of the three forms perform a native form submission
anymore: `<form>`'s `onSubmit` always calls `preventDefault()`, the
primary action is a `type="button"` `onClick` handler, and Enter is
handled manually via `onKeyDown` — because a failed native submit was
still enough for Chrome to offer to save the (rejected) credentials.
Autocomplete attributes are tuned per field to tell the browser which
flow it's in: sign-in email/password use `username`/`current-password`;
sign-up uses distinct field names (`new-account-email`,
`account-secret`) with `autocomplete="off"` rather than
`autocomplete="new-password"`, because Chrome's `new-password` hint
itself kept triggering a persistent generate/save prompt on the
create-account page; reset-password uses `autocomplete="new-password"`
on a masked text field. `data-1p-ignore`/`data-bwignore`/`data-lpignore`
attributes are set on sign-up/reset-password fields to reduce 1Password/
Bitwarden/LastPass overlay interference (extension behavior, not fully
controllable from application code).

## Acceptance criteria

Verified during the original session
(`working/2026-08-09-security-updates.md`): `npm run lint`, `npx tsc -b
--noEmit`, and `npm run build` all passed after each implementation
batch; a local dev server smoke-tested `/`, `/signin`, `/signup`,
`/reset-password` all returning `200 OK`.

Re-verified 2026-08-09 (later pass): `npm run lint`, `npx tsc -b
--noEmit`, and `npm run build` all pass against the current
`grainy_scroll` branch tip. `/signup` and `/signin` were also checked
directly in a browser (screenshot) — wordmark, horizontal email/password
row, live password-requirement checklist, and the centered filled
submit button all render as designed.

Re-verified 2026-08-18: the shared-layout claim above for
`/forgot-password`/`/reset-password` was confirmed by reading both
pages' current source on `main` (not a fresh browser screenshot this
pass).

Not verified in any session: no automated regression test exists for
any of this (no test suite in the project at all — see `quality.md`),
and the browser-credential-manager behavior has only been checked in
Chrome, not Safari or Firefox.

## Permissions and security

Unchanged from before this work — RLS is still the only
access-control boundary (see `architecture.md`'s "Security boundaries").
This pass was explicitly scoped to client-side auth/session/routing
code only; no Supabase dashboard, RLS, storage policy, table grant, or
Auth-provider setting was touched. Specifically **not** covered by this
work (from `working/2026-08-09-security-updates.md`'s original scope
note): Supabase Auth dashboard settings, redirect allowlists, storage
bucket policies, password policy enforcement on the Supabase side, MFA,
rate limiting/bot protection, profile input validation/content
sanitization, book/cache write permissions. Those remain separate,
un-started Supabase-side or broader application-security tasks.

## Edge cases

- `/forgot-password`'s confirmation message is identical whether or not
  the email matches an account — a deliberate anti-enumeration choice,
  not a bug (an attacker can't use this page to test which emails have
  accounts).
- Visiting `/reset-password` without ever having clicked a reset-email
  link (no recovery session) redirects to `/forgot-password` rather
  than showing a form that would only fail once submitted.
- The masked-input (`-webkit-text-security`) approach is a WebKit/Blink
  CSS property — it degrades to plain visible text in any browser that
  doesn't support it, rather than failing. Not verified in this repo
  against a non-WebKit/Blink browser.
- Every credential-manager workaround here targets specifically
  observed Chrome behavior; the underlying assumption (that this is
  still the right tradeoff, and doesn't regress the experience in other
  browsers) hasn't been re-checked outside Chrome.

## Out of scope

- MFA, rate limiting/bot protection, OAuth — none exist; email/password
  only (unchanged from before this work, see `architecture.md`).
- Server-side/Supabase-side password policy enforcement — the 8-char +
  number + special-character rule is enforced only in the client; the
  Supabase Auth dashboard's own password requirements (if any) weren't
  inspected or changed as part of this.

## Implementation status

Implemented. `src/supabase-client.ts`, `src/context/AuthProvider.tsx`,
`src/context/AuthContext.tsx`, `src/components/RequireAuth.tsx`,
`src/components/RedirectIfAuthenticated.tsx`, `src/lib/authValidation.ts`,
`src/pages/SignIn.tsx`, `src/pages/SignUp.tsx`, `src/pages/Auth.css`,
`src/components/NavBar.tsx` (sign-out navigation) — shipped via branch
`login_updates`, PR #10, merged to `main`. `src/pages/ForgotPassword.tsx`
and `src/pages/ResetPassword.tsx` got their session-guard/validation
behavior in PR #10 and their matching visual redesign later, in PR #13
(`better_covers`, merged 2026-08-17) — both pages now fully match this
spec.

## Open questions

Whether the Chrome-specific credential-manager workarounds need
verification (or a different approach) in Safari/Firefox — see
`working/open-questions.md`.
