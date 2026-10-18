-- 016_ai_platform.sql — Phase 10 AI platform foundation (A.9 coordination + A.21 runtime).
-- Extends 005/006 shells with the fields the platform requires; forward-only, idempotent.

-- Agents: description, owner, default version pin, policy reference.
ALTER TABLE agents ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS default_version_id UUID;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS policy_id UUID;

-- Agent versions: immutable config snapshot.
ALTER TABLE agent_versions ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}';

-- Agent policies: full policy document.
ALTER TABLE agent_policies ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE RESTRICT;
ALTER TABLE agent_policies ADD COLUMN IF NOT EXISTS denied_tools JSONB NOT NULL DEFAULT '[]';
ALTER TABLE agent_policies ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE agent_policies ADD COLUMN IF NOT EXISTS max_tokens INTEGER;
ALTER TABLE agent_policies ADD COLUMN IF NOT EXISTS timeout_ms INTEGER NOT NULL DEFAULT 120000;
ALTER TABLE agent_policies ADD COLUMN IF NOT EXISTS max_tool_calls INTEGER NOT NULL DEFAULT 25;
ALTER TABLE agent_policies ADD COLUMN IF NOT EXISTS approval_required BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE agent_policies ADD COLUMN IF NOT EXISTS execution_mode TEXT NOT NULL DEFAULT 'supervised';

-- Runs: principal, correlation, lifecycle timestamps, budget snapshot, failure/cancel state.
ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS principal_id TEXT;
ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS correlation_id TEXT;
ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;
ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS budget JSONB NOT NULL DEFAULT '{}';
ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS failure_category TEXT;
ALTER TABLE agent_runs ADD COLUMN IF NOT EXISTS cancel_requested_at TIMESTAMPTZ;

-- Tool registry + invocation records.
CREATE TABLE IF NOT EXISTS tool_definitions (
  id TEXT PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  input_schema JSONB NOT NULL DEFAULT '{}',
  output_schema JSONB NOT NULL DEFAULT '{}',
  risk_class TEXT NOT NULL DEFAULT 'read'
    CHECK (risk_class IN ('read','write','high_risk','external_side_effect')),
  required_permission TEXT NOT NULL DEFAULT 'agent.tool.execute',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tool_invocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE RESTRICT,
  tool_id TEXT NOT NULL REFERENCES tool_definitions(id) ON DELETE RESTRICT,
  input JSONB NOT NULL DEFAULT '{}',
  decision TEXT NOT NULL DEFAULT 'denied' CHECK (decision IN ('allowed','denied')),
  idempotency_key TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'recorded'
    CHECK (status IN ('recorded','completed','failed')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS ix_tool_invocations_run ON tool_invocations (run_id);

-- A.9 coordination extensions: assignment detail, lock lease/holder, escalation state.
ALTER TABLE session_assignments ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE RESTRICT;
ALTER TABLE session_assignments ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agents(id) ON DELETE SET NULL;
ALTER TABLE session_assignments ADD COLUMN IF NOT EXISTS task TEXT NOT NULL DEFAULT '';
ALTER TABLE session_assignments ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0;
ALTER TABLE session_assignments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open'
  CHECK (status IN ('open','acknowledged','completed','cancelled'));
ALTER TABLE session_assignments ADD COLUMN IF NOT EXISTS creator_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE session_assignments ADD COLUMN IF NOT EXISTS correlation_id TEXT;
ALTER TABLE session_locks ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE session_escalations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open'
  CHECK (status IN ('open','acknowledged','resolved'));

-- Safe read-only tool seeds (no side-effecting tools in Phase 10).
INSERT INTO tool_definitions(id, name, description, risk_class, required_permission)
VALUES
  ('task.read', 'Read engineering task', 'Read-only task lookup; no mutation', 'read', 'engineering.task.read'),
  ('comment.read', 'Read comments', 'Read-only comment lookup; no mutation', 'read', 'collaboration.comment.read'),
  ('plan.read', 'Read agent plan', 'Read-only plan lookup; no mutation', 'read', 'agent.plan.read')
ON CONFLICT (id) DO NOTHING;
