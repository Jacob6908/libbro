---
status: accepted
date: 2026-07-26
---

# ADR-004: Content-based recommendations only; social features excluded from this version

## Context

`issho` had a fully built social layer (friend requests, activity feed,
threaded comments, upvotes/downvotes) but no recommendation engine at
all. When scoping libbro's v1, the user chose to include recommendations
but explicitly excluded social features, notifications, and
admin/moderation from this version — meaning there is no social graph
available to build collaborative-filtering recommendations from.

## Decision

Recommendations are content-based only: explicit per-genre user
preferences (weighted 1-3) combined with inferred per-genre affinity from
the user's own ratings, plus a per-book "similar to this" widget ranked
by shared genres and author overlap. No collaborative filtering, no
ML/embeddings.

## Rationale

Directly follows from the social-features-out-of-scope decision — there
is no "friends also read this" signal available. The user specifically
asked for explicit genre preference selection (Meh/Like/Love) as part of
the recommendation basis, not just inferred behavior.

## Consequences

- Cold-start users (no ratings, no preferences set) get a pure popularity
  fallback (`average_rating`/`ratings_count` ordering) rather than an
  empty feed.
- If social features are added in a later version, the recommendation
  engine would need a second, separate collaborative-filtering path
  layered on top — this isn't designed to grow into one on its own.

## Alternatives considered

- Full social feed + collaborative filtering, matching `issho`'s scope —
  explicitly deferred, not chosen for this version.
- Recommendations without explicit genre preferences (inferred-only) —
  the user asked for explicit preferences to be included, so this wasn't
  pursued.

## Evidence

`src/services/recommendations.ts`; no `friendships`, `comments`, or
`votes`-equivalent tables exist in the live schema (see
`architecture.md`).
