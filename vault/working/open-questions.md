# Open Questions

Unresolved questions surfaced during vault audits. Grouped by topic. Answer
these with real evidence when it appears — don't guess.

## Product

- **What is `libbro`?** No product description exists anywhere in the repo
  (`README.md` is empty, `CLAUDE.md` only describes vault mechanics). Why it
  matters: `vault/product.md` can't be written, and there's no way to judge
  whether future work is in-scope, until this is answered.

## Architecture

- **What will the tech stack be?** No source code, package manifest, or
  config file exists yet. Why it matters: `vault/architecture.md` is
  currently a placeholder — populating it requires an actual implementation
  to inspect.

## Testing / quality

- **What commands will install, build, lint, and test this project?** None
  exist yet. Why it matters: `vault/quality.md` can't list verified commands
  until there's something to run.

## Deployment

- **Is there a deployment target?** Unknown — nothing in the repo indicates
  hosting, CI, or a release process. Why it matters: a `runbooks/` deploy
  doc would otherwise have to be fabricated, which this audit avoids doing.
