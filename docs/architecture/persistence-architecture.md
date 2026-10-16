# Persistence Architecture — Phase 5

Date 2026-10-16. Runtime: TypeScript/Node 22 + PostgreSQL 16 + hand-written SQL (ADR 0012).

## Layers (`services/api/src/`)

```text
api/            transport only (http server, envelopes, correlation) — no SQL
app/            composition (server.js, seed.js)
domain/         pure rules (errors, lifecycle, tenancy) — no DB imports
persistence/    db.ts (pool/tx), baseRepository, *Repositories, migrations/*.sql, migrate.ts
config.ts       env-only configuration
tests/          unit (DB-free) + integration (real Postgres)
```

Rules: HTTP never imports `pg`; repositories never build HTTP; domain never imports
persistence. `TenantContext` is constructed server-side, never from client `organizationId`.

## Database

PostgreSQL 16. 8 migrations cover ENT-001→ENT-042; ENT-043 Invoice excluded.
Every tenant table carries `organization_id` (+ `workspace_id`/`project_id` where the
tenancy contract requires); immutability (workspace org link, project move, sent versions,
approval re-decision) enforced by triggers; audit/lineage append-only by trigger
(`UPDATE`/`DELETE` raise). `version INTEGER DEFAULT 1` on mutable tables for optimistic
concurrency. See `database-conventions.md`.

## Tenancy

Organization = primary tenant. Server resolves `TenantContext`; repositories scope every
query by `organization_id`; `ProjectRepository.create` verifies workspace org match;
cross-tenant writes raise `CONFLICT` + audit. DB cannot fully enforce row-level isolation
without an auth principal — application layer enforces until Phase 6 adds authN/Z.

## A.9 vs A.21

`orchestration_sessions (+assignments/locks/escalations)` coordinate; `agents`,
`agent_versions`, `policies`, `runs`, `plans`, `results`, `delegations`, `memories`,
`workflows` execute. Runs reference (not own) sessions.
