# Vault Index

This is the entry point for `libbro`'s knowledge base. It documents durable
project knowledge that would be hard or risky to rediscover from the code
alone — it does not duplicate the codebase or log every action taken here.

**Current state: this repo has no source code yet.** It contains only this
vault and its own tooling (`CLAUDE.md`, `.claude/skills/`). Most of the
documents below are placeholders until real implementation exists to
document.

## Documents

- `product.md` — *not yet created.* No product description exists anywhere
  in the repo (README is empty). Create this once product purpose, users, or
  journeys are established.
- [`architecture.md`](architecture.md) — high-level technical architecture.
  Currently a placeholder; nothing to document until there's a codebase.
- [`quality.md`](quality.md) — verified build/lint/test commands. Currently
  a placeholder; no commands exist in the repo yet.
- [`specs/`](specs/) — one file per feature, only once a feature exists to
  describe. Empty for now — see `specs/README.md`.
- `decisions/` — architecture decision records (ADRs) for major technical
  choices. Not yet created — there are no technical decisions to record.
- `runbooks/` — operational steps (deploy, migrations, incident recovery).
  Not yet created — nothing operational exists yet.
- [`working/current-focus.md`](working/current-focus.md) — temporary,
  current project context.
- [`working/open-questions.md`](working/open-questions.md) — unresolved
  questions surfaced during vault audits.

## Authoritative vs. working

`architecture.md`, `product.md`, `quality.md`, `specs/`, and `decisions/`
are durable — they should stay accurate as the project evolves and are the
authoritative record once populated. Everything under `working/` is
temporary scratch context and should not be treated as project history.

## For future sessions

Read this file before non-trivial work, then open only the specific
documents relevant to the task. Once source code exists, treat the
implementation as ground truth over any stale vault doc, and surface (rather
than silently resolve) any conflict between what the vault says and what the
code does. Re-run `/vault-audit` after notable changes (new feature,
architecture decision, dependency, or spec) to keep this reconciled.
