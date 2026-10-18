-- 019_engineering_plans.sql — Phase 11: autonomous-engineering plans are bound to
-- engineering_runs (NOT to Phase 10 agent_runs). agent_plans.run_id has an FK to
-- agent_runs, so storing engineering plans there violates referential integrity.
CREATE TABLE IF NOT EXISTS engineering_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  engineering_run_id UUID NOT NULL REFERENCES engineering_runs(id) ON DELETE RESTRICT,
  content_hash TEXT NOT NULL,
  body JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed','approved','denied','superseded')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_engineering_plans_run ON engineering_plans (engineering_run_id);
