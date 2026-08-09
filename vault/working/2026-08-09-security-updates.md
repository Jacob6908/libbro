# Security Updates - 2026-08-09

This note records the client-side auth and Supabase connection hardening
completed on 2026-08-09. The scope was intentionally limited to codebase-facing
changes around client connection setup, session handling, sign-in, sign-out, and
password-reset routing. No Supabase dashboard, RLS, storage policy, table grant,
or profile/content sanitization changes were made.

## Changes

### Supabase client configuration

`src/supabase-client.ts` now validates required environment variables before
creating the Supabase client:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

If either value is missing, the app fails immediately with a clear configuration
error instead of failing later in an ambiguous auth or network path.

The Supabase auth behavior is also configured explicitly:

- `persistSession: true`
- `autoRefreshToken: true`
- `detectSessionInUrl: true`

These settings document the intended client behavior: sessions persist locally,
tokens refresh automatically, and Supabase can process auth/recovery tokens from
URL redirects.

### Session hydration handling

`src/context/AuthProvider.tsx` now handles failures from
`supabase.auth.getSession()` defensively.

Before this update, the initial session load assumed success. Now, if session
hydration returns an error or rejects, the app:

- clears the current user state
- completes the loading state
- avoids leaving protected routes stuck in an ambiguous loading condition

The effect also tracks whether the provider is still mounted before updating
React state, avoiding stale state updates if the provider unmounts during the
async session check.

### Signed-in redirects away from auth pages

Added `src/components/RedirectIfAuthenticated.tsx` and wrapped `/signin` and
`/signup` in `src/App.tsx`.

Signed-in users are now redirected to `/` if they visit:

- `/signin`
- `/signup`

The wrapper waits for auth hydration before deciding whether to render or
redirect, matching the existing pattern used by protected routes.

### Deterministic sign-out navigation

`src/components/NavBar.tsx` now awaits `signOut()` and then navigates directly
to `/signin` with `replace: true`.

Previously, the app relied on auth state clearing and the protected-route guard
to eventually redirect. The new flow makes sign-out behavior explicit and avoids
stale protected UI lingering after the user signs out.

### Reset-password route guard

`src/pages/ResetPassword.tsx` now requires an active Supabase auth session
before showing the password reset form.

If a user visits `/reset-password` directly without a recovery/auth session,
they are redirected to `/forgot-password`.

After a successful password update, the page now signs the user out and then
navigates to `/signin`, so the recovery session is not left active after the
password change.

### Auth form validation and autocomplete behavior

Added `src/lib/authValidation.ts` as the shared source of truth for auth form
validation constants.

Email validation now uses one reusable pattern and helper. Sign-in and sign-up
both validate the trimmed email before submitting to Supabase, and the email
inputs also use the same pattern in the browser's native validation layer.

New passwords now use one shared rule across account creation and password
reset:

- at least 8 characters
- at least one number
- at least one special character

The sign-up and reset-password forms show the password requirements in a small
theme-matched helper row and reject submissions that do not meet the shared
regex.

Autocomplete attributes were tightened so browsers can distinguish between
existing-login credentials and new-account/new-password credentials:

- sign-in email: `username`
- sign-in password: `current-password`
- sign-up password: `new-password`
- reset password: `new-password`

The sign-up form also uses distinct input names and disables form-level
autocomplete to reduce browsers carrying sign-in credentials into the create
account flow.

The auth forms now use `noValidate` and handle required-field, email-format,
and password-strength errors in React. This replaces browser-native validation
bubbles with the app's own inline error messages, keeping the validation
experience consistent with the rest of the auth UI.

Auth validation display was refined further:

- invalid email errors render directly beneath the email input
- missing password/password-strength errors render beneath the password input
- backend/auth submission errors use a softer pastel-red inline box
- password requirements update live while typing
- each completed password requirement turns pastel green
- password inputs get a green completion underline once the full password rule
  is satisfied

Password fields were also adjusted to reduce browser/password-manager prompt
interference while typing. The sign-in, sign-up, and reset-password password
inputs now use `autocomplete="off"` and include common ignore attributes for
1Password, Bitwarden, and LastPass. Browser and extension overlays cannot be
fully controlled by application code, but the markup no longer asks those tools
to attach saved-password/new-password suggestions to these fields.

The sign-in form now clears its local email/password/error state before routing
to create account, so typed sign-in credentials do not intentionally carry into
the sign-up page. Autocomplete semantics were then adjusted to give browsers a
clearer distinction between saved-login and new-account flows:

- sign-in email uses `autocomplete="username"`
- sign-in password uses `autocomplete="current-password"`
- sign-up password uses a less credential-like field name with
  `autocomplete="off"` because Chrome's `new-password` hint kept showing a
  persistent generate/save prompt on the create-account page
- reset password uses `autocomplete="new-password"`
- sign-up fields use distinct `new-account-*` field names

This is the standards-aligned way to reduce Chrome/Google Password Manager
treating the sign-up form as another login form for the same origin.

Auth-page switching now prevents default link navigation, clears the current
form state with `flushSync`, and then navigates programmatically. This makes the
email/password inputs empty in the DOM before the sign-in/sign-up route changes,
reducing Chrome's tendency to prompt to save credentials that were typed into a
form but never submitted.

The sign-up and reset-password flows no longer use native credential-form
submission. Their forms prevent default submit behavior, and their primary
buttons are `type="button"` handlers that call Supabase directly. This keeps the
login form as the only auth form that behaves like a credential submit target,
reducing browser save prompts for account creation and password replacement.

Chrome still treated native `type="password"` fields on sign-up/reset as
credential-save candidates, even without native form submission. To avoid that
heuristic, sign-up and reset-password now use visually masked text inputs
(`-webkit-text-security: disc`) instead of native password inputs. Sign-in
remains the only native password field because it is the only flow where browser
credential saving is desired after a successful login.

Sign-in was also moved off native form submission. Failed sign-in attempts had
still caused Chrome to offer to save credentials because the browser saw a real
login form submit, even though Supabase rejected the credentials. Sign-in now
uses a controlled `type="button"` handler, and Enter is handled manually through
the same path. This keeps failed login attempts from looking like successful
credential submissions to the browser.

## Verification

Before making changes, the existing baseline checks were run and passed:

```bash
npm run lint
npx tsc -b --noEmit
npm run build
```

The same checks were run after each implementation batch:

1. Supabase client env validation and explicit auth options
2. Session hydration hardening
3. Signed-in redirects away from `/signin` and `/signup`
4. Deterministic sign-out navigation
5. Reset-password route guard and post-reset sign-out
6. Auth email/password validation and autocomplete behavior

All checks passed after every batch.

A local Vite dev server was also started and verified with HTTP smoke checks.
The following routes returned `200 OK`:

- `/`
- `/signin`
- `/signup`
- `/reset-password`

The dev server was stopped after verification.

## Not Covered

This update did not change:

- Supabase RLS policies
- Supabase table grants
- Supabase Auth dashboard settings
- Supabase redirect allowlists
- storage bucket policies
- password policy enforcement in Supabase
- MFA
- rate limiting or bot protection
- profile input validation or content sanitization
- book/cache write permissions

Those remain separate Supabase-side or broader application-security tasks.
