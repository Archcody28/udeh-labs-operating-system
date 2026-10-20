-- 022_notifications_outbox.sql — Phase 14: durable domain events, transactional
-- outbox, notifications, deliveries, preferences, provider operations.
-- Forward-only, idempotent. Delivery semantics: at-least-once internal
-- processing; provider-level idempotency where supported (INV-NOTIFY-*).

-- Canonical immutable domain event log. Append-only by trigger (like audit).
CREATE TABLE IF NOT EXISTS domain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE RESTRICT,
  project_id UUID REFERENCES projects(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL CHECK (char_length(event_type) BETWEEN 1 AND 100),
  aggregate_type TEXT NOT NULL CHECK (char_length(aggregate_type) BETWEEN 1 AND 100),
  aggregate_id UUID NOT NULL,
  -- Actor is recorded as an opaque principal reference (TEXT), NOT a users FK.
  -- Matches audit_events.actor_id / engineering_runs.principal_id: an actor may
  -- be a human user id, an agent run id, or the literal "system" for service
  -- actions. A users FK would reject non-human principals and would break
  -- events published for agent/system principals.
  actor_user_id TEXT,
  principal_type TEXT NOT NULL DEFAULT 'human'
    CHECK (principal_type IN ('human','agent','system')),
  event_version INTEGER NOT NULL DEFAULT 1 CHECK (event_version >= 1),
  schema_version INTEGER NOT NULL DEFAULT 1 CHECK (schema_version >= 1),
  payload JSONB NOT NULL DEFAULT '{}',
  correlation_id TEXT NOT NULL DEFAULT '',
  causation_event_id UUID REFERENCES domain_events(id) ON DELETE RESTRICT,
  -- Deterministic identity: replaying the same logical event collapses to one row.
  dedupe_key TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_domain_events_dedupe
  ON domain_events (organization_id, dedupe_key);
CREATE INDEX IF NOT EXISTS ix_domain_events_type
  ON domain_events (organization_id, event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_domain_events_aggregate
  ON domain_events (aggregate_type, aggregate_id);
CREATE OR REPLACE FUNCTION forbid_domain_event_mutation() RETURNS TRIGGER AS $$
BEGIN RAISE EXCEPTION 'domain events immutable (INV-EVT-01)'; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_domain_events_immutable ON domain_events;
CREATE TRIGGER trg_domain_events_immutable BEFORE UPDATE OR DELETE ON domain_events
  FOR EACH ROW EXECUTE FUNCTION forbid_domain_event_mutation();

-- Transactional outbox: 1:1 with domain_events; mutable dispatch state only.
-- Business mutation + event + outbox row commit in ONE transaction; the
-- dispatcher claims rows with FOR UPDATE SKIP LOCKED and never holds a
-- transaction open across provider calls.
CREATE TABLE IF NOT EXISTS outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES domain_events(id) ON DELETE RESTRICT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','dispatched','retryable_failure','dead_letter')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 8 CHECK (max_attempts BETWEEN 1 AND 100),
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_by TEXT,
  claim_expires_at TIMESTAMPTZ,
  last_error_code TEXT,
  last_error_message TEXT NOT NULL DEFAULT '' CHECK (char_length(last_error_message) <= 500),
  dispatched_at TIMESTAMPTZ,
  dead_lettered_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT outbox_claim CHECK ((status = 'processing') = (claimed_by IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_outbox_event ON outbox_events (event_id);
CREATE INDEX IF NOT EXISTS ix_outbox_due ON outbox_events (status, next_attempt_at);
CREATE INDEX IF NOT EXISTS ix_outbox_org ON outbox_events (organization_id, created_at DESC);
DROP TRIGGER IF EXISTS trg_outbox_updated ON outbox_events;
CREATE TRIGGER trg_outbox_updated BEFORE UPDATE ON outbox_events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- Notifications: one logical notification per (event, recipient). Channel
-- neutral; deliveries carry the channel/provider dimension.
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE RESTRICT,
  project_id UUID REFERENCES projects(id) ON DELETE RESTRICT,
  event_id UUID NOT NULL REFERENCES domain_events(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL,
  recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
  body TEXT NOT NULL DEFAULT '' CHECK (char_length(body) <= 2000),
  payload JSONB NOT NULL DEFAULT '{}',
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','critical')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','delivered','failed')),
  read_at TIMESTAMPTZ,
  -- Retention windows stay UNRESOLVED (repo-wide stance); column reserved.
  expires_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ux_notification_identity UNIQUE (organization_id, event_id, recipient_user_id)
);
CREATE INDEX IF NOT EXISTS ix_notifications_recipient
  ON notifications (organization_id, recipient_user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS ix_notifications_unread
  ON notifications (organization_id, recipient_user_id, created_at DESC)
  WHERE read_at IS NULL;
DROP TRIGGER IF EXISTS trg_notifications_updated ON notifications;
CREATE TRIGGER trg_notifications_updated BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Deliveries: one per (notification, channel). Retry/dead-letter state lives
-- here so notification and audit semantics stay intact across attempts.
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE RESTRICT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  channel TEXT NOT NULL CHECK (channel IN ('in_app','email')),
  provider TEXT NOT NULL DEFAULT 'in_app' CHECK (char_length(provider) BETWEEN 1 AND 50),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','delivered','retryable_failure','dead_letter')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 6 CHECK (max_attempts BETWEEN 1 AND 100),
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_by TEXT,
  claim_expires_at TIMESTAMPTZ,
  last_error_code TEXT,
  last_error_message TEXT NOT NULL DEFAULT '' CHECK (char_length(last_error_message) <= 500),
  delivered_at TIMESTAMPTZ,
  dead_lettered_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ux_delivery_identity UNIQUE (notification_id, channel),
  CONSTRAINT delivery_claim CHECK ((status = 'processing') = (claimed_by IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS ix_deliveries_due ON notification_deliveries (status, next_attempt_at);
CREATE INDEX IF NOT EXISTS ix_deliveries_org ON notification_deliveries (organization_id, created_at DESC);
DROP TRIGGER IF EXISTS trg_deliveries_updated ON notification_deliveries;
CREATE TRIGGER trg_deliveries_updated BEFORE UPDATE ON notification_deliveries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Preferences: per (org, user, type, channel). Mandatory/security-critical
-- channels are enforced in domain code; rows cannot silence them.
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('in_app','email')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ux_notification_pref UNIQUE (organization_id, user_id, notification_type, channel)
);
CREATE INDEX IF NOT EXISTS ix_notification_prefs_user
  ON notification_preferences (organization_id, user_id);
DROP TRIGGER IF EXISTS trg_notification_prefs_updated ON notification_preferences;
CREATE TRIGGER trg_notification_prefs_updated BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Provider operations: append-only ledger of external/provider attempts.
-- Stores fingerprints and safe error codes only — never raw credentials or
-- unredacted provider responses (INV-NOTIFY-04).
CREATE TABLE IF NOT EXISTS notification_provider_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES notification_deliveries(id) ON DELETE RESTRICT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL,
  channel TEXT NOT NULL,
  attempt INTEGER NOT NULL DEFAULT 1 CHECK (attempt >= 1),
  idempotency_key TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL DEFAULT '',
  result TEXT NOT NULL CHECK (result IN ('accepted','retryable_failure','terminal_failure')),
  error_code TEXT,
  provider_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_provider_ops_delivery
  ON notification_provider_operations (delivery_id, attempt);
CREATE OR REPLACE FUNCTION forbid_notification_provider_op_mutation() RETURNS TRIGGER AS $$
BEGIN RAISE EXCEPTION 'provider operations append-only (INV-NOTIFY-04)'; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_provider_ops_immutable ON notification_provider_operations;
CREATE TRIGGER trg_provider_ops_immutable BEFORE UPDATE OR DELETE ON notification_provider_operations
  FOR EACH ROW EXECUTE FUNCTION forbid_notification_provider_op_mutation();