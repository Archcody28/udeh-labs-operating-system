-- 018_engineering_execution_hardening.sql — Phase 11 verification fixes.
-- Forward-only, idempotent. Does NOT modify 017.

-- Idempotency keys must be tenant-scoped: a global UNIQUE on idempotency_key
-- lets organization B collide with (and probe) organization A's keys.
-- Replace the column constraint with a per-organization unique index.
DO $$
DECLARE
  con RECORD;
BEGIN
  FOR con IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'engineering_runs'::regclass AND contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE engineering_runs DROP CONSTRAINT %I', con.conname);
  END LOOP;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS ux_engineering_runs_org_idem
  ON engineering_runs (organization_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Honest activity taxonomy: run creation/approval/review-decision/cancellation
-- are engineering-run events, not task lifecycle events.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'activity_events'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%ai.run.created%'
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
        'ai.review.requested','ai.revision.requested','ai.escalated',
        'ai.run.created','ai.plan.approved','ai.review.decided','ai.run.cancelled'
      ));
  END IF;
END $$;