# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Vault

All project knowledge beyond this file lives in [`vault/`](vault/), an
Obsidian-compatible knowledge base. Start here:

@vault/index.md

## Operating principles

1. Read `vault/index.md` before non-trivial work.
2. Open only the vault documents relevant to the current task.
3. Inspect the actual implementation before assuming documentation is current.
4. Surface conflicts between code, tests, specs, and architecture — don't silently resolve them.
5. Don't silently change product requirements or architecture decisions.
6. Use the smallest coherent implementation change; avoid unrelated refactoring.
7. Run the relevant commands from `vault/quality.md`.
8. Don't claim a check passed unless it was actually run.
9. Update documentation only when durable project knowledge changes.
10. Keep temporary investigation notes in `vault/working/`.
11. Never store secrets in project documentation.
12. Never discard uncommitted user work.
13. Ask for explicit approval before destructive, production-sensitive, or major architectural changes.

Only run `/vault-audit` when the user explicitly invokes it. Don't
proactively reconcile the vault after individual changes, features, or
design decisions — wait to be asked.
