-- 014_collaboration.sql — Phase 9 collaboration & delivery coordination.
-- Forward-only. Comments (tombstone), assignment ledger, activity seam.
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN
    ('project','task','requirement','proposal','patch','review')),
  target_id UUID NOT NULL,
  author_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
  mentions TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','edited','archived')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_comments_org_proj
  ON comments (organization_id, project_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS ix_comments_target
  ON comments (organization_id, target_type, target_id);
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES engineering_tasks(id) ON DELETE CASCADE,
  assignee_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('assigned','reassigned','unassigned')),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_assign_task
  ON task_assignments (organization_id, task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_assign_proj
  ON task_assignments (organization_id, project_id, created_at DESC);
CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN
    ('project.created','participant.added','participant.removed',
     'task.created','task.assigned','task.unassigned','task.transitioned',
     'comment.added','comment.edited','comment.archived',
     'comment.mentioned','review.requested','review.decided',
     'patch.created','contract.activated','deployment.triggered')),
  target_type TEXT NOT NULL,
  target_id UUID,
  summary JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_activity_proj
  ON activity_events (organization_id, project_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS ix_activity_type
  ON activity_events (organization_id, event_type, created_at DESC);
