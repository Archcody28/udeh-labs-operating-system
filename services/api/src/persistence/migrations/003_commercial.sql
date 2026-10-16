-- 003_commercial.sql — ENT-007..012 (D-03)
CREATE TABLE IF NOT EXISTS client_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','elaborated','closed')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_client_requests_org ON client_requests (organization_id);
CREATE TABLE IF NOT EXISTS requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE RESTRICT,
  client_request_id UUID NOT NULL REFERENCES client_requests(id) ON DELETE RESTRICT,
  title TEXT NOT NULL, body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','accepted')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_requirements_req ON requirements (client_request_id);
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  client_request_id UUID NOT NULL REFERENCES client_requests(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','in_review','sent','approved','rejected')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS proposal_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE RESTRICT,
  version_no INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  body JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','superseded','approved')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (proposal_id, version_no)
);
CREATE OR REPLACE FUNCTION forbid_sent_version_mutation() RETURNS TRIGGER AS $$
BEGIN IF OLD.status = 'sent' AND (NEW.body IS DISTINCT FROM OLD.body
  OR NEW.content_hash IS DISTINCT FROM OLD.content_hash) THEN
  RAISE EXCEPTION 'sent proposal version immutable (INV-CON-02)';
  END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_pv_immutable ON proposal_versions;
CREATE TRIGGER trg_pv_immutable BEFORE UPDATE ON proposal_versions
  FOR EACH ROW EXECUTE FUNCTION forbid_sent_version_mutation();
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  proposal_id UUID NOT NULL UNIQUE REFERENCES proposals(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'ready'
    CHECK (status IN ('ready','signed','active')),
  signed_package_hash TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE RESTRICT,
  project_id UUID REFERENCES projects(id) ON DELETE RESTRICT,
  target_type TEXT NOT NULL, target_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','approved','denied')),
  decided_by TEXT, decided_at TIMESTAMPTZ,
  idempotency_key TEXT UNIQUE,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_approvals_target ON approvals (target_type, target_id);
CREATE OR REPLACE FUNCTION forbid_approval_redecision() RETURNS TRIGGER AS $$
BEGIN IF OLD.status IN ('approved','denied')
  AND NEW.status IS DISTINCT FROM OLD.status THEN
  RAISE EXCEPTION 'approval decision immutable (single-decision)';
  END IF; RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_approval_immutable ON approvals;
CREATE TRIGGER trg_approval_immutable BEFORE UPDATE ON approvals
  FOR EACH ROW EXECUTE FUNCTION forbid_approval_redecision();
