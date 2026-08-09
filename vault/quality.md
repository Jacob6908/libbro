# Quality Checks

Lint, type-check, and build were re-run and verified during the
2026-08-07 audit; other commands as noted otherwise. Run from the repo
root.

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
Prettier enforced as a lint rule. **Verified passing** 2026-08-07.

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
2026-08-07, `strict: true` plus `noUnusedLocals`,
`noUnusedParameters`, `noFallthroughCasesInSwitch`,
`noUncheckedSideEffectImports` in both `tsconfig.app.json` and
`tsconfig.node.json`.

## Production build

```
npm run build
```

Runs `tsc -b && vite build`, outputs to `dist/` (gitignored). **Verified
passing** 2026-08-07 — ~920ms, one non-blocking warning about the
main JS chunk exceeding 500kB (553.80kB as of this audit, up from
547.07kB at the prior audit after the search-ranking/categorized-
recommendations rework — no code-splitting has been set up yet — worth
revisiting if the bundle keeps growing, not a failure today).

## Tests

**None exist.** No test framework, no `test` script, deliberately deferred
for this version (same choice the reference app `issho` made). See
`working/open-questions.md` if this needs revisiting.

## Database schema / RLS

No CLI command exists for this — schema and RLS policies are applied by
hand via the Supabase SQL editor, or directly via the `mcp__supabase__*`
tools (`apply_migration`/`execute_sql`) when working through Claude Code —
either way it's dashboard/live-project-managed by deliberate choice, see
`decisions/ADR-002-dashboard-managed-schema.md`. There is nothing to run
locally to "check" the schema; the closest verification available is
exercising the app end-to-end against the live project, plus
`mcp__supabase__get_advisors` (both `security` and `performance`) right
after any schema change.

**This exact bug class has now happened twice**: `book_genres` was
missing its `DELETE` grant during the v1 build, and the new `shelves`/
`shelf_books` tables (added for the custom-bookshelves feature, see
`specs/bookshelves.md`) were created with correct RLS policies but no
table-level `GRANT` to `authenticated` at all, which made every request
fail with a `403` regardless of the RLS policies being right — RLS only
narrows what a grantee can see/do, it doesn't substitute for the
underlying SQL grant. Caught the same way both times: browser-driven
verification, not lint/typecheck/build, and not `get_advisors` either (it
flags missing RLS, not missing grants). **Any new table created via raw
`create table` DDL needs an explicit `grant select/insert/update/delete
... to authenticated` — Supabase's dashboard table editor does this
automatically, but raw SQL/migrations do not.**

## Visual/browser verification

Use the `/quality-check` skill to run lint/typecheck/build plus a
browser-driven pass against the running dev server in a background
subagent, so other work (vault reconciliation, the next implementation
step) can continue in parallel instead of blocking on it. See
`.claude/skills/quality-check/SKILL.md`.
