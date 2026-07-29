# Quality Checks

All commands below were run and verified during the 2026-07-29 audit
unless noted otherwise. Run from the repo root.

## Install

```
npm install
```

Installs frontend dependencies (`package.json`). There is no separate
backend to install — Supabase is a hosted project, not local tooling.

## Local dev

```
npm run dev
```

Starts the Vite dev server (default `http://localhost:5173`). Requires
`.env.local` populated with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
and `VITE_GOOGLE_BOOKS_API_KEY` — **values are never stored in this
vault**; obtain them from the Supabase project dashboard and Google Cloud
Console respectively. Verified working repeatedly during the build via
browser-driven testing (Playwright against the running dev server), not
just a boot check.

## Lint

```
npm run lint
```

ESLint flat config (`eslint.config.js`): `@eslint/js` + `typescript-eslint`
recommended + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`,
Prettier enforced as a lint rule. **Verified passing** as of this audit.

```
npm run lint:fix
```

Same, with `--fix` — mutates files.

## Format

```
npm run format
```

`prettier --write` over `src/**/*.{ts,tsx,js,jsx,json,css}`. Mutates
files; there is no separate non-mutating `format:check` script.

## Type-check

```
npx tsc -b --noEmit
```

Not a `package.json` script (the `build` script runs `tsc -b` as part of
building, which does write `.tsbuildinfo` cache files under
`node_modules/.tmp`, and then runs `vite build`). Use the bare
`--noEmit` form for a pure, non-writing type-check. **Verified passing**
as of this audit, `strict: true` plus `noUnusedLocals`,
`noUnusedParameters`, `noFallthroughCasesInSwitch`,
`noUncheckedSideEffectImports` in both `tsconfig.app.json` and
`tsconfig.node.json`.

## Production build

```
npm run build
```

Runs `tsc -b && vite build`, outputs to `dist/` (gitignored). **Verified
passing** as of this audit — 858ms, one non-blocking warning about the
main JS chunk exceeding 500kB (no code-splitting has been set up yet;
not a failure, just worth knowing before it grows further).

## Tests

**None exist.** No test framework, no `test` script, deliberately deferred
for this version (same choice the reference app `issho` made). See
`working/open-questions.md` if this needs revisiting.

## Database schema / RLS

No CLI command exists for this — schema and RLS policies are applied by
hand via the Supabase SQL editor (dashboard-managed by deliberate choice,
see `decisions/ADR-002-dashboard-managed-schema.md`). There is nothing to
run locally to "check" the schema; the closest verification available is
exercising the app end-to-end against the live project, which is how the
one real grant bug found during the build (`book_genres` missing its
`DELETE` grant) was actually caught.
