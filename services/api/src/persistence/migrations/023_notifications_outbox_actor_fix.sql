-- 023_notifications_outbox_actor_fix.sql — Phase 14 correction (forward-only).
--
-- 022 originally declared domain_events.actor_user_id as
--   UUID REFERENCES users(id)
-- which is too narrow: an actor may be a human user id, an agent run id, or
-- the literal "system" for service-initiated actions (AuthPrincipal.subjectId
-- is not a users FK). Storing those raised 22P02 and aborted the business
-- transaction that published the event.
--
-- The column is relaxed to TEXT, matching the repo-wide convention already
-- used by audit_events.actor_id and engineering_runs.principal_id.
--
-- Idempotent and forward-only: on a database where 022 was already applied
-- with the UUID column this migrates it; on a fresh database where 022 now
-- creates TEXT, this is a no-op.
DO $$
DECLARE
  col_type TEXT;
  fk_name TEXT;
BEGIN
  SELECT data_type INTO col_type
    FROM information_schema.columns
   WHERE table_name = 'domain_events' AND column_name = 'actor_user_id';

  IF col_type IS NULL OR col_type = 'text' THEN
    -- 022 not applied yet, or already TEXT: nothing to correct.
    RETURN;
  END IF;

  -- Drop the users FK (if any) before relaxing the type; a foreign key
  -- cannot survive a uuid -> text conversion.
  SELECT c.conname INTO fk_name
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = c.conkey[1]
   WHERE t.relname = 'domain_events'
     AND a.attname = 'actor_user_id'
     AND c.contype = 'f'
   LIMIT 1;

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE domain_events DROP CONSTRAINT %I', fk_name);
  END IF;

  ALTER TABLE domain_events
    ALTER COLUMN actor_user_id TYPE TEXT USING actor_user_id::text;
END $$;
