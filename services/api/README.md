# services/api — Phase 5 Persistence + API Foundation

TypeScript (Node 22) + PostgreSQL 16 + hand-written SQL. ADR 0012.

## Layout

```text
src/config.ts            env config
src/domain/              errors, lifecycle, tenancy (DB-free)
src/persistence/         db, baseRepository, *Repositories, migrations/*.sql, migrate.ts
src/api/http.ts          envelopes, correlation, pagination
src/app/server.ts        routes: /health, /ready, /api/v1/organizations(+workspaces/projects/audit-events)
src/app/seed.ts          synthetic dev seed
src/tests/               unit.test.ts (DB-free), integration.test.ts (real Postgres)
```

## Commands

```powershell
npm install; npm run build; npm run typecheck
npm run test:unit
$env:DATABASE_URL="postgresql://..."; npm run migrate; npm run test:integration
npm start
```

Schema: ENT-001→ENT-042 across 8 migrations; ENT-043 Invoice excluded.
Audit/lineage append-only (triggers); tenancy org-scoped; A.9 vs A.21 tables separate.
