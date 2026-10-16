# Contributing to UdehLabs (Phase 1)

Concise engineering conventions. Follow them; keep documentation lean.

## Directory conventions

```
apps/web/                     Future production web app (boundary only, Phase 1)
stitch_udehlabs_operating_system/  Preserved Phase 0 prototype export — READ-ONLY
docs/adr/                     Architecture Decision Records (see docs/adr/README.md)
infra/                        Future infrastructure boundary (docs only, Phase 1)
scripts/                      Repository integrity checks (CI + local)
.github/workflows/            Repository CI
```

- Do NOT create `apps/api`, `services/*`, `packages/*`, `database/*`,
  `auth/*`, `ai/*`, or `billing/*` without an accepted ADR.
- Never edit files under `stitch_udehlabs_operating_system/` to add
  functionality. It is evidence, not source.

## Documentation conventions

- Markdown, one `#` H1 per file, relative links only.
- Speculative content ("should", "could", vendor names) belongs in `Proposed`
  ADRs, never stated as fact.
- Implemented code outranks docs; when they conflict, record an ADR — do not
  silently pick a side.

## ADR conventions

See `docs/adr/README.md`. New records use the next sequence number and start
as `Proposed` unless the change is purely procedural (e.g. Phase scaffolds).

## Commit expectations

- One logical change per commit; present-tense summary line (< 72 chars).
- Phase commits: `Phase N: <what was established>`.
- Never commit secrets, `.env` values, keys, or certificates.
- Stay on `main`; no force-push; no history rewrites.

## Reviews

- Every ADR status change (`Proposed` -> `Accepted`/`Rejected`) needs at
  least one reviewer who verified the cited repository evidence.
