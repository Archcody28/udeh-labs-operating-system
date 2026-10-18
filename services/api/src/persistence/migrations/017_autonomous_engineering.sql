-- 017_autonomous_engineering.sql — Phase 11 autonomous engineering execution.
-- Forward-only, idempotent.

ALTER TABLE code_patches ADD COLUMN IF NOT EXISTS generating_principal_id TEXT;
ALTER TABLE code_patches ADD COLUMN IF NOT EXISTS agent_version_id UUID REFERENCES agent_versions(id) ON DELETE RESTRICT;
ALTER TABLE code_patches ADD COLUMN IF NOT EXISTS policy_id UUID REFERENCES agent_policies(id) ON DELETE RESTRICT;
ALTER TABLE code_patches ADD COLUMN IF NOT EXISTS source_context_ref TEXT;
ALTER TABLE code_patches ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS engineering_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  engineering_task_id UUID NOT NULL REFERENCES engineering_tasks(id) ON DELETE RESTRICT,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
  agent_version_id UUID NOT NULL REFERENCES agent_versions(id) ON DELETE RESTRICT,
  policy_id UUID NOT NULL REFERENCES agent_policies(id) ON DELETE RESTRICT,
  principal_id TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned','planning','waiting_approval','executing','validation','review','completed','escalated','failed','halted')),
  iteration_count INTEGER NOT NULL DEFAULT 0,
  max_iterations INTEGER NOT NULL DEFAULT 5,
  budget JSONB NOT NULL DEFAULT '{}',
  failure_category TEXT,
  idempotency_key TEXT UNIQUE,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_eng_runs_project ON engineering_runs (project_id);
CREATE INDEX IF NOT EXISTS ix_eng_runs_task ON engineering_runs (engineering_task_id);
CREATE INDEX IF NOT EXISTS ix_eng_runs_status ON engineering_runs (organization_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS engineering_iterations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  engineering_run_id UUID NOT NULL REFERENCES engineering_runs(id) ON DELETE CASCADE,
  iteration_number INTEGER NOT NULL,
  plan_id UUID REFERENCES agent_plans(id) ON DELETE SET NULL,
  patch_id UUID REFERENCES code_patches(id) ON DELETE SET NULL,
  review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
  validation_status TEXT NOT NULL DEFAULT 'generated'
    CHECK (validation_status IN ('generated','validation_failed','validation_passed','review_requested','changes_requested','approved','applied','superseded')),
  review_feedback TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (engineering_run_id, iteration_number)
);
CREATE INDEX IF NOT EXISTS ix_eng_iterations_run ON engineering_iterations (engineering_run_id, iteration_number);

INSERT INTO tool_definitions(id, name, description, risk_class, required_permission)
VALUES
  ('task.read', 'Read engineering task', 'Read-only task lookup; no mutation', 'read', 'engineering.task.read'),
  ('project.context.read', 'Read project context', 'Read-only project context lookup', 'read', 'project.read'),
  ('requirement.read', 'Read requirement', 'Read-only requirement lookup', 'read', 'commercial.requirement.read'),
  ('repository.context.read', 'Read repository context', 'Read-only project source context', 'read', 'engineering.task.read'),
  ('file.read', 'Read file', 'Read-only file read within repo boundary', 'read', 'engineering.task.read'),
  ('patch.generate', 'Generate patch', 'AI-authored code patch (never directly applied)', 'high_risk', 'engineering.patch.create'),
  ('patch.validate', 'Validate patch', 'Validate a generated patch', 'read', 'engineering.patch.read'),
  ('test.run', 'Run tests', 'Run tests against a patch', 'high_risk', 'engineering.task.update'),
  ('lint.run', 'Run lint', 'Run lint/static checks', 'high_risk', 'engineering.task.update'),
  ('typecheck.run', 'Run typecheck', 'Run type checking', 'high_risk', 'engineering.task.update'),
  ('review.request', 'Request review', 'Request human review of a patch', 'high_risk', 'engineering.review.create')
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'activity_events'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%ai.plan.submitted%'
  ) THEN
    ALTER TABLE activity_events DROP CONSTRAINT IF EXISTS activity_events_event_type_check;
    ALTER TABLE activity_events ADD CONSTRAINT activity_events_event_type_check
      CHECK (event_type IN (
        'project.created','participant.added','participant.removed',
        'task.created','task.assigned','task.unassigned','task.transitioned',
        'comment.added','comment.edited','comment.archived',
        'comment.mentioned','review.requested','review.decided',
        'patch.created','contract.activated','deployment.triggered',
        'ai.plan.submitted','ai.validation.completed','ai.patch.generated',
        'ai.review.requested','ai.revision.requested','ai.escalated'
      ));
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_eng_run_updated ON engineering_runs;
CREATE TRIGGER trg_eng_run_updated BEFORE UPDATE ON engineering_runs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_eng_iter_updated ON engineering_iterations;
CREATE TRIGGER trg_eng_iter_updated BEFORE UPDATE ON engineering_iterations FOR EACH ROW EXECUTE FUNCTION set_updated_at();