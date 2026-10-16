# ADR 0012 — Persistence Runtime Stack (Phase 5)

Date: 2026-10-16. Status: Accepted. Phase: 5.

## Context

Phase 0–4 are documentation-only. No production runtime exists (`apps/web/README.md`
explicitly states no executable app). Phase 4 binds Phase 5 to: PostgreSQL-compatible
persistence, migrations, repository layer, `/api/v1` API foundation, org→workspace→project
tenancy, append-only audit, A.9/A.21 separation, lifecycle contracts. Auth/AI/billing/
telemetry providers must remain neutral (HD-01narrow, HD-06narrow, HD-07narrow, HD-08 open).

Local evidence: Node.js v22 + npm available; Python/Docker/PostgreSQL CLIs absent on this
machine; CI runs `ubuntu-latest` with Python checks. No existing `package.json`, no ORM,
no framework — greenfield runtime choice.

## Decision

- **Language/runtime:** TypeScript on Node.js 22 LTS (`services/api`). Strict `tsc`,
  built-in `node:test` + `node:http`. No web framework.
- **Database:** PostgreSQL 16 (dev/CI/prod). Docker Compose service `postgres:16-alpine`
  for local dev; CI `postgres:16` service.
- **Migration technology:** hand-written ordered SQL files
  (`services/api/src/persistence/migrations/*.sql`) applied by a small `migrate` script
  over `node-postgres (pg)`. Up + documented down/rollback notes + `schema_migrations`
  journal. No ORM codegen.
- **Data access:** hand-written repositories over `pg` `Pool` with parameterized queries
  only. `BaseRepository` enforces tenant-scoped queries + `NotFoundError` vs
  infrastructure-error distinction + optimistic-concurrency (`version`) helpers.
  Domain validation in `src/domain/*` (pure, DB-free). No query builder / ORM entities.
- **API foundation:** dependency-free Node `http` server, routes under `/api/v1/*`,
  standard error envelope `{ code, message, correlationId, retryable, fields? }`,
  `x-correlation-id` echo/generation, cursor pagination envelope, `GET /health`,
  `GET /ready` (DB check), representative Organization/Workspace/Project flow.

## Why

- Boring + auditable: every SQL statement is reviewable; tenancy predicates and
  append-only audit triggers are visible, not hidden in ORM magic.
- Matches constraints: parameterized queries, transactions, pooling (`pg.Pool`),
  version fields, unique constraints — all native Postgres; no extra services.
- Validatable here and in CI: `node:test` unit tests run with zero infra; integration
  tests run against real Postgres (Compose locally, service container in CI).
- Thin seam for later phases: authN/Z becomes middleware + `TenantContext` plumbing;
  AI runtime/billing/telemetry stay provider-neutral behind repository interfaces.

## Alternatives considered

- **Prisma/Drizzle/TypeORM:** rejected — codegen + magic migrations obscure audit/
  tenancy guarantees; adds provider surface for zero Phase-5 benefit.
- **Python/FastAPI + SQLAlchemy/Alembic:** rejected — no Python toolchain on this
  machine and no repo evidence favouring it; duplicates CI language for no gain.
- **Express/Fastify/NestJS:** rejected — unnecessary framework surface for a health +
  one-resource proof; plain `http` keeps the contract explicit and dependency-light.
- **SQLite/pg-mem for tests:** rejected as substitute — allowed only as supplement;
  Postgres-behavior tests (FKs, unique, triggers) must hit real Postgres.

## Trade-offs / risks

- More hand-written SQL vs ORM velocity. Mitigated by one migration folder, one
  repository base class, documented conventions.
- No framework conveniences (routing/validation). Mitigated by tiny explicit helpers.
- Future ORM adoption would require a migration-strategy ADR; schema (SQL) remains
  portable regardless.

## What remains provider-neutral

Auth provider, AI/model provider, billing provider, telemetry vendor, deployment
platform, session/RBAC product. `TenantContext` is server-resolved plumbing, not an
auth product. Audit `prev_hash` chain stays PROPOSED/optional.

## Consequences

- New boundary `services/api/`; CI job `runtime-foundation`; docs under
  `docs/architecture/` + `docs/development/`.
- ENT-043 Invoice excluded from schema. UNRESOLVED/PROPOSED lifecycle labels preserved
  as documented constants, not DB-enforced states.
