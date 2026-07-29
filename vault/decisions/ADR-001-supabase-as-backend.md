---
status: accepted
date: 2026-07-26
---

# ADR-001: Supabase (Postgres + Auth) as the entire backend, no custom server

## Context

A read-only study of the reference app `issho` (see
`working/issho-study.md`) found it uses Supabase directly from a React SPA
with no custom backend server at all. When planning libbro's own backend,
this was one of several explicit options presented to the user
(alternatives: a custom Node/Python server, or Postgres behind a thin
framework).

## Decision

Use Supabase (Postgres + Auth) as the entire backend, same shape as
`issho`. The frontend talks to Supabase directly via
`@supabase/supabase-js` with the anon/publishable key.

## Rationale

User's explicit choice when asked to pick between BaaS, a custom backend
server, or a thin-framework middle ground. Fastest path to a working v1
with real data persistence, and reuses a pattern already proven to work
in the reference app.

## Consequences

- No custom authorization logic beyond RLS — correctness of RLS policies
  is the entire security boundary (see `architecture.md`).
- No server-side business logic layer; anything that would normally live
  in an API server (import orchestration, recommendation scoring) lives
  in client-side TypeScript instead (see ADR-002 and
  `services/recommendations.ts`).

## Alternatives considered

- Custom backend server (Node/TS, Python, etc.) — more control, more
  upfront work, not chosen.
- Postgres + a lightweight framework (FastAPI/Express) as a middle
  ground — not chosen.

## Evidence

`src/supabase-client.ts`; no server directory or server framework
dependency exists anywhere in `package.json`.
