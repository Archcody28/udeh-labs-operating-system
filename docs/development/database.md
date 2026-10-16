# Database Guide — Phase 5

## Create / migrate / reset

```powershell
docker compose up -d postgres
cd services/api
npm run migrate        # ordered *.sql via schema_migrations journal
npm run seed           # synthetic dev data only
```

New migration: add `src/persistence/migrations/009_<name>.sql` (forward SQL +
documented rollback in file header comment), rebuild (`npm run build` copies SQL?
No — migrations run from `dist/persistence/migrations`; ensure build step copies or
run `tsc` then copy: the runner reads sibling `migrations/`). Rollback strategy:
each file header documents inverse; destructive reset only:
`DROP SCHEMA public CASCADE; CREATE SCHEMA public; npm run migrate`
(development only, explicit confirmation, never production).
CI/production: migrations run before app start (`server.ts` migrates on boot in
dev; production applies `npm run migrate` as a release step, then starts without
auto-migrate — see workflow `runtime-foundation.yml`).

## Testing

- Unit (no DB): `npm run test:unit` — 5 tests, lifecycle + error envelope.
- Integration (real Postgres): set `DATABASE_URL`, `npm run test:integration` —
  migrations, org→ws→project, tenant boundary, FK/unique, audit append-only,
  transaction atomicity, representative API flow. No in-memory substitutes.
