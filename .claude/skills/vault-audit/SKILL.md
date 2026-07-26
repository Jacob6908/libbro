---
name: vault-audit
description: Audit and reconcile this repo's Obsidian-compatible vault/ knowledge base against the actual codebase, CLAUDE.md, and git state. Verifies or rewrites index.md, product.md, architecture.md, quality.md, specs/, decisions/, runbooks/, and working/ notes based only on evidence found in the repo — never invents requirements, rationale, or commands. Use whenever the user says "/vault-audit", "sync the vault", "audit the vault", "does the vault match the code", "update the project docs", or after a notable change (new feature, architecture decision, dependency, or spec) that might have made vault/ stale. Safe to re-run repeatedly — it reconciles against current repo state rather than trusting what's already there.
---

# Vault Audit

Reconcile `vault/` — this repo's durable knowledge base — against what the
repository actually contains right now. Treat the existing vault as unverified
on every run, including the first: something may have drifted since it was
last written, or it may never have been accurate.

## The relationship this maintains

- The codebase is the current implementation.
- Tests are verified behavior where coverage exists.
- Approved specs are intended behavior.
- ADRs explain why past technical decisions were made.
- `vault/` stores durable project knowledge that would be difficult or risky
  to rediscover from the code alone.
- `CLAUDE.md` tells Claude how to locate and use that knowledge.

The vault should never duplicate the codebase or become a log of actions
performed — it documents things that aren't obvious from reading the code.

## Before changing anything

1. Inspect the full repository structure.
2. Read the current `CLAUDE.md`.
3. Read every existing file in `vault/`.
4. Inspect relevant package files, configuration, database schema/migrations,
   routes, tests, and source directories — whatever exists.
5. Check `git status` so you don't overwrite unrelated uncommitted work.

Do not assume the existing vault content is correct — that's the whole point
of an audit. Compare it against what you find in step 4 and flag drift.

## Hard constraints

- Never invent product requirements, business rules, architecture decisions,
  commands, deployment processes, or feature behavior that isn't supported by
  the repo or existing notes. When uncertain, write "unknown" and add an entry
  to `vault/working/open-questions.md` — don't guess.
- Never change application behavior, refactor production code, or install
  dependencies/plugins as part of this audit. This is a documentation-only
  pass.
- Never store secrets, credentials, API keys, tokens, or env-variable values
  in the vault.
- Preserve useful existing documentation. Reorganize or rewrite only where it
  improves clarity or fixes something that's now inaccurate.
- Don't create empty files just to satisfy the structure below. If a
  directory has no content yet, either leave it absent or add a short
  `README.md` explaining when files should go there.
- Don't claim a command in `quality.md` passes unless you ran it yourself
  during this audit.

## Target structure

```
vault/
├── index.md
├── product.md
├── architecture.md
├── quality.md
├── specs/
├── decisions/
├── runbooks/
└── working/
    ├── current-focus.md
    └── open-questions.md
```

Only materialize the parts that currently have real content behind them.

### `index.md` — entry point

Explains the vault's purpose, links to the other documents (relative or
Obsidian-style links), briefly describes what each contains, shows spec
status where known, identifies which documents are authoritative, and
distinguishes permanent docs from `working/` notes. Keep it short — it's a
map, not the content itself.

### `product.md` — product knowledge

Purpose, target users, primary user journeys, major capabilities, important
constraints, known non-goals — only what's established from the repo or
existing notes. Mark anything uncertain explicitly rather than filling gaps.

### `architecture.md` — high-level technical architecture

Major apps/services, frontend framework, backend services, database and
data-access approach, auth, routing, state management, external
integrations, important directories, major data flows, security boundaries,
deployment structure. Stay high-level and stable — not a line-by-line tour
of the source tree; future sessions can inspect implementation directly.

### `quality.md` — verified commands

For install, local dev, lint, format, type-check, run-all-tests, run-one-test,
production build, and any other required validation: record the command,
what it checks, when to run it, and whether it currently succeeds. Only
include commands that exist in the repo or that you personally ran and
verified during this audit.

### `specs/` — one file per meaningful feature

Only create a spec when there's enough information to describe the feature
accurately. Frontmatter and section format:

```md
---
status: draft | approved | implemented | deprecated
last-reviewed: YYYY-MM-DD
---

# Feature Name

## Goal
## User behavior
## Requirements
## Acceptance criteria
## Permissions and security
## Edge cases
## Out of scope
## Implementation status
## Open questions
```

Use `approved` only when the repo or existing docs clearly establish
approval — otherwise `draft` or `implemented`. Don't rewrite requirements
just to match an incomplete implementation.

### `decisions/` — architecture decision records

For decisions already evident from the repo or existing notes. Sequential
naming: `ADR-001-use-supabase.md`, `ADR-002-use-expo-router.md`. Format:

```md
---
status: accepted | proposed | superseded | deprecated
date: YYYY-MM-DD
---

# ADR-XXX: Decision title

## Context
## Decision
## Rationale
## Consequences
## Alternatives
## Evidence
```

Never fabricate rationale. If the reason for a past choice is unknown, either
skip the ADR or mark rationale as unknown and raise it in
`open-questions.md`. Never rewrite an accepted historical ADR to reflect a
later decision — supersede it with a new one instead.

### `runbooks/` — operational steps

Only when supported by the repo: local dev setup, deployment, migrations,
environment setup, release process, incident recovery. Actionable steps, not
architectural explanation. Never invent a deployment or recovery procedure
that isn't backed by something in the repo.

### `working/current-focus.md` — temporary context

Only what's determinable from existing notes, active branches, TODOs, or
clear repo evidence. If current focus can't be determined, say so. This file
is temporary, not project history — don't let it accumulate permanently.

### `working/open-questions.md` — unresolved questions

Group by topic (product, architecture, security, deployment, testing,
feature behavior). For each question, state why the answer matters. Never
answer by guessing — that's what this file is for instead.

## Update `CLAUDE.md`

Keep it concise and acting as the repo-wide operating guide. It should
include these principles (merge with whatever's already there rather than
duplicating):

1. Read `vault/index.md` before non-trivial work.
2. Open only the vault documents relevant to the current task.
3. Inspect the actual implementation before assuming documentation is current.
4. Surface conflicts between code, tests, specs, and architecture — don't
   silently resolve them.
5. Don't silently change product requirements or architecture decisions.
6. Use the smallest coherent implementation change; avoid unrelated
   refactoring.
7. Run the relevant commands from `vault/quality.md`.
8. Don't claim a check passed unless it was actually run.
9. Update documentation only when durable project knowledge changes.
10. Keep temporary investigation notes in `vault/working/`.
11. Never store secrets in project documentation.
12. Never discard uncommitted user work.
13. Ask for explicit approval before destructive, production-sensitive, or
    major architectural changes.

Include a direct reference so the index loads as project context:
`@vault/index.md` — but don't import the whole vault into `CLAUDE.md`, and
don't duplicate document content there; keep it to instructions.

## Obsidian and git configuration

Check whether `vault/.obsidian/` exists — don't delete it. Inspect
`.gitignore` and make a conservative call: by default, vault Markdown files
should be tracked in git, workspace-specific Obsidian state
(`.obsidian/workspace.json` etc.) should be ignored, and potentially shared
Obsidian settings shouldn't be removed from tracking without explaining the
impact. Only touch `.gitignore` when the change is clearly safe.

## Validation before finishing

1. Check all Markdown links and referenced paths actually resolve.
2. Confirm `CLAUDE.md` only points to files that exist.
3. Confirm documented commands match what's actually in the repo's scripts/
   config.
4. Run the narrowest safe commands needed to verify documentation claims.
5. Review the complete `git diff`.
6. Confirm no application behavior changed.
7. Confirm no secrets or env values ended up in the vault.
8. Confirm there's no unnecessary duplicated or speculative documentation.

## Final report format

Always close an audit with:

1. Concise summary of the vault structure as it stands now.
2. Files created, moved, or substantially changed.
3. Important facts verified during this run.
4. Open questions that need the user's input.
5. Commands run and whether each passed.
6. Files intentionally not created, and why.
7. Recommendations not applied automatically.
8. Confirmation the full git diff was reviewed.

Do not go on to implement new application features after finishing an audit
— this skill is documentation-only.
