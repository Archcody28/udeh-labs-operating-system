-- 008_data_platform.sql — ENT-035..042 + ENT-034 audit (append-only)
CREATE TABLE IF NOT EXISTS datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'cataloged'
    CHECK (status IN ('cataloged','governed','deprecated')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, name)
);
CREATE TABLE IF NOT EXISTS lineage_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  from_dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE RESTRICT,
  to_dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION forbid_lineage_mutation() RETURNS TRIGGER AS $$
BEGIN RAISE EXCEPTION 'lineage append-only (INV-CON-03)'; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_lineage_append ON lineage_edges;
CREATE TRIGGER trg_lineage_append BEFORE UPDATE OR DELETE ON lineage_edges
  FOR EACH ROW EXECUTE FUNCTION forbid_lineage_mutation();
CREATE TABLE IF NOT EXISTS quality_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','violated')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS data_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  title TEXT NOT NULL, body JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'recorded'
    CHECK (status IN ('recorded','superseded')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS api_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  label TEXT NOT NULL, key_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'issued'
    CHECK (status IN ('issued','active','revoked')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, config JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'configured'
    CHECK (status IN ('configured','disabled')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- ENT-034 AuditEvent: append-only, no UPDATE/DELETE, no cascade delete
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE RESTRICT,
  project_id UUID REFERENCES projects(id) ON DELETE RESTRICT,
  correlation_id TEXT NOT NULL,
  actor_id TEXT, principal_type TEXT NOT NULL DEFAULT 'system'
    CHECK (principal_type IN ('human','agent','system')),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL, target_id TEXT NOT NULL,
  result TEXT NOT NULL DEFAULT 'success'
    CHECK (result IN ('success','denied','failed')),
  metadata JSONB NOT NULL DEFAULT '{}',
  prev_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_audit_org ON audit_events (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_audit_corr ON audit_events (correlation_id);
CREATE OR REPLACE FUNCTION forbid_audit_mutation() RETURNS TRIGGER AS $$
BEGIN RAISE EXCEPTION 'audit append-only (INV-AUD-02)'; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_audit_append ON audit_events;
CREATE TRIGGER trg_audit_append BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION forbid_audit_mutation();
-- NOTE: ENT-043 Invoice deliberately NOT created (non-canonical, UNRESOLVED).
