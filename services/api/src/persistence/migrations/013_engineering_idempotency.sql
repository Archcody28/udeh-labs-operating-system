-- 013_engineering_idempotency.sql — Phase 8 engineering + idempotency ledger.
ALTER TABLE engineering_tasks ADD COLUMN IF NOT EXISTS assignee_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE engineering_tasks ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE engineering_tasks ADD COLUMN IF NOT EXISTS requirement_id UUID REFERENCES requirements(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS ix_eng_tasks_status ON engineering_tasks (project_id, status);
ALTER TABLE code_patches ADD COLUMN IF NOT EXISTS engineering_task_id UUID REFERENCES engineering_tasks(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS ix_patches_project ON code_patches (project_id, status);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS decided_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS decided_at TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS note TEXT NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS domain_idempotency (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  key TEXT NOT NULL,
  response JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, scope, key)
);
DROP TRIGGER IF EXISTS trg_ms_updated ON milestones;
CREATE TRIGGER trg_ms_updated BEFORE UPDATE ON milestones FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_et_updated ON engineering_tasks;
CREATE TRIGGER trg_et_updated BEFORE UPDATE ON engineering_tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_ext_updated ON execution_tasks;
CREATE TRIGGER trg_ext_updated BEFORE UPDATE ON execution_tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_patch_updated ON code_patches;
CREATE TRIGGER trg_patch_updated BEFORE UPDATE ON code_patches FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_review_updated ON reviews;
CREATE TRIGGER trg_review_updated BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_deploy_updated ON deployments;
CREATE TRIGGER trg_deploy_updated BEFORE UPDATE ON deployments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
