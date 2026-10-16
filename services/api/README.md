# services/api — Phase 6 Identity + Persistence Foundation

TypeScript (Node 22) + PostgreSQL 16 + hand-written SQL. ADR 0012 (runtime), ADR 0013 (identity).

## Layout

```text
src/config.ts            env config (+ COOKIE_SECURE)
src/domain/              errors, lifecycle, tenancy, principal, authorization, tenant, credentials, rateLimit (DB-free)
src/auth/                provider seam, localProvider (scrypt), authService, guards (authenticate/guardOrgRoute)
src/persistence/         db, baseRepository, *Repositories, migrations/*.sql (001..009), migrate.ts
src/api/http.ts          envelopes, correlation, pagination
src/app/server.ts        entry; routes.ts → tenancyRoutes.ts + guardedRoutes.ts
src/app/seed.ts          synthetic dev seed (+ dev owner login, printed once)
src/tests/               unit.test.ts (DB-free, 18 tests), integration.test.ts (real Postgres, 8 tests)
```

## Routes (public: GET /health, GET /ready only)

```text
POST /api/v1/auth/register | POST /api/v1/auth/login | POST /api/v1/auth/logout
POST /api/v1/auth/rotate | GET /api/v1/auth/me | POST /api/v1/invitations/accept
POST|GET /api/v1/organizations (auth; create grants owner)
GET|POST org/workspaces, org/projects, org/audit-events, org/members, org/invitations (guarded)
PATCH org/members/:userId (member.manage + step-up) | GET org/workspaces/:id, org/projects/:id (hierarchy-checked)
```

## Commands

```powershell
npm install; npm run build; npm run typecheck
npm run test:unit
$env:DATABASE_URL="postgresql://..."; npm run migrate; npm run test:integration
npm start
```

Schema: ENT-001→ENT-042 across 9 migrations (009 adds user_credentials,
sessions, invitation/membership hardening); ENT-043 Invoice excluded.
Audit/lineage append-only (triggers); tenancy org-scoped + membership-guarded;
sessions opaque server-side (no JWT); actor always server-derived.
