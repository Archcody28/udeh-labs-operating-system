-- 006_ai_runtime.sql — A.21 plane: ENT-020..028 (never merged with A.9)
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'defined'
    CHECK (status IN ('defined','provisioned','retired')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS agent_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
  version_no INTEGER NOT NULL,
  definition_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pinned'
    CHECK (status IN ('pinned','superseded')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_id, version_no)
);
CREATE TABLE IF NOT EXISTS agent_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
  tools JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
  agent_version_id UUID REFERENCES agent_versions(id) ON DELETE RESTRICT,
  policy_id UUID REFERENCES agent_policies(id) ON DELETE RESTRICT,
  orchestration_session_id UUID REFERENCES orchestration_sessions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN
    ('planning','waiting_approval','executing','succeeded','failed','halted')),
  idempotency_key TEXT UNIQUE,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_agent_runs_project ON agent_runs (project_id);
CREATE TABLE IF NOT EXISTS agent_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE RESTRICT,
  content_hash TEXT NOT NULL, body JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed','approved','denied','superseded')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS agent_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE RESTRICT,
  payload_hash TEXT NOT NULL, payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'produced'
    CHECK (status IN ('produced','verified','rejected')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS agent_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE RESTRICT,
  delegate_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','accepted','completed')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS agent_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  project_id UUID REFERENCES projects(id) ON DELETE RESTRICT,
  scope TEXT NOT NULL DEFAULT 'org',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','governed','purged')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  project_id UUID REFERENCES projects(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'defined'
    CHECK (status IN ('defined','active','disabled')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
