-- 011_db_roles.sql — Phase 7 least-privilege runtime roles (forward-only).
-- Local dev keeps superuser flow; production wiring uses these roles.
-- Migration authority: schema owner (migrator). Application runtime: restricted.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'udehlabs_migrator') THEN
    CREATE ROLE udehlabs_migrator WITH LOGIN PASSWORD 'migrator_dev_only';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'udehlabs_app') THEN
    CREATE ROLE udehlabs_app WITH LOGIN PASSWORD 'app_dev_only';
  END IF;
END $$;
-- Append-only audit already enforced by 008 (trg_audit_append); no duplicate trigger.
-- Privilege separation is documented in ADR 0014; enforceable statements for
-- a managed production database (run as schema owner, parameterize db name):
--   REVOKE CREATE ON SCHEMA public FROM udehlabs_app;
--   REVOKE DELETE ON audit_events FROM udehlabs_app;
--   REVOKE UPDATE, DELETE, TRUNCATE ON schema_migrations FROM udehlabs_app;
-- RLS remains deferred (ADR 0014 §11): application/repository isolation is the
-- enforced boundary; no fake RLS claimed.
SELECT 1;
