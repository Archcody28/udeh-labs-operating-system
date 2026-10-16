# ADR 0001 — Phase 1 Monorepo Boundary

- **Status:** Accepted
- **Date:** 2026-10-16
- **Deciders:** Phase 1 execution (staff/principal engineer)

## Context

Phase 0 left a flat repository: a single `stitch_udehlabs_operating_system/`
prototype export (212 HTML mockups, 209 PNGs, 101 MD + 17 TXT specs) plus a
`.gitignore`. No `package.json`, backend, database, auth, AI runtime, tests,
CI, or deployment. Future production work needs stable, conventional homes
for code, decisions, and infrastructure without disturbing that evidence.

## Decision

Establish the minimum monorepo scaffold:

- `apps/web/` — future production web application boundary (README only).
- `docs/adr/` — Architecture Decision Record system (this directory).
- `infra/` — future infrastructure boundary (documentation only).
- `scripts/` + `.github/workflows/` — repository integrity CI.
- `CONTRIBUTING.md`, `SECURITY.md` — lean engineering conventions.
- `stitch_udehlabs_operating_system/` stays exactly where it is, read-only.

Explicitly NOT created: `apps/api`, `services/*`, `packages/*`,
`database/*`, `auth/*`, `ai/*`, `billing/*`, or any infrastructure code —
no Phase 1 repository evidence requires them.

## Consequences

- Later phases have canonical locations; no ad-hoc top-level sprawl.
- The prototype export remains addressable at its Phase 0 path.
- Any new boundary requires its own ADR amending this one.
