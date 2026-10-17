-- 010_project_grants.sql — Phase 7 tenant-isolation hardening (forward-only).
-- Narrow project-level grants. Org boundary mandatory; grants never bypass membership.
CREATE TABLE IF NOT EXISTS project_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (char_length(permission) BETWEEN 1 AND 80),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  version INTEGER NOT NULL DEFAULT 1,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id, permission)
);
CREATE INDEX IF NOT EXISTS ix_project_grants_org ON project_grants (organization_id);
CREATE INDEX IF NOT EXISTS ix_project_grants_project ON project_grants (project_id);
CREATE INDEX IF NOT EXISTS ix_project_grants_user ON project_grants (user_id);
-- Org boundary of a grant must match the project's org (defense in depth).
CREATE OR REPLACE FUNCTION enforce_grant_org_boundary() RETURNS TRIGGER AS $$
DECLARE proj_org UUID;
BEGIN
  SELECT organization_id INTO proj_org FROM projects WHERE id = NEW.project_id;
  IF proj_org IS NULL THEN
    RAISE EXCEPTION 'project grant references missing project';
  END IF;
  IF NEW.organization_id IS DISTINCT FROM proj_org THEN
    RAISE EXCEPTION 'project grant org mismatch (cross-tenant grant prohibited)';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_grant_org_boundary ON project_grants;
CREATE TRIGGER trg_grant_org_boundary BEFORE INSERT OR UPDATE ON project_grants
  FOR EACH ROW EXECUTE FUNCTION enforce_grant_org_boundary();
DROP TRIGGER IF EXISTS trg_project_grants_updated ON project_grants;
CREATE TRIGGER trg_project_grants_updated BEFORE UPDATE ON project_grants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
