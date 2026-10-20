-- 020_integrations.sql -- Phase 12: integrations foundation.
-- Forward-only, idempotent. Reuses the existing integrations table from 008
-- and extends its status set with the Phase 12 lifecycle states.

ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_status_check;
ALTER TABLE integrations ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE integrations ADD CONSTRAINT integrations_status_check
  CHECK (status IN ('configured','disabled','pending','connected','active','degraded','revoked','disconnected'));

-- Credential reference (provider-neutral). No raw secrets in domain tables.
CREATE TABLE IF NOT EXISTS integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  credential_name TEXT NOT NULL DEFAULT '',
  credential_reference TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','revoked','expired')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_integration_credentials_integration
  ON integration_credentials (integration_id);

-- External account identity (e.g. GitHub App installation).
CREATE TABLE IF NOT EXISTS external_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_account_id TEXT NOT NULL DEFAULT '',
  external_owner TEXT NOT NULL DEFAULT '',
  account_label TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'connected'
    CHECK (status IN ('connected','disconnected','revoked')),
  correlation_id TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_external_accounts_integration_external
  ON external_accounts (integration_id, provider, external_account_id)
  WHERE external_account_id <> '';

-- Authorized external resources (e.g. an allow-listed GitHub repository).
CREATE TABLE IF NOT EXISTS external_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  external_account_id UUID NOT NULL REFERENCES external_accounts(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL,
  provider_resource_id TEXT NOT NULL DEFAULT '',
  resource_owner TEXT NOT NULL DEFAULT '',
  resource_name TEXT NOT NULL DEFAULT '',
  resource_type TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'approved'
    CHECK (status IN ('approved','pending','suspended','revoked')),
  correlation_id TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_external_resources_integration
  ON external_resources (integration_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_external_resources_integration_provider
  ON external_resources (integration_id, provider, provider_resource_id)
  WHERE provider_resource_id <> '';

-- Canonical Project -> external repository mapping (no duplicate project model).
CREATE TABLE IF NOT EXISTS repository_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE RESTRICT,
  external_account_id UUID NOT NULL REFERENCES external_accounts(id) ON DELETE RESTRICT,
  external_resource_id UUID NOT NULL REFERENCES external_resources(id) ON DELETE RESTRICT,
  authorized_principal TEXT NOT NULL DEFAULT '',
  authorized_scope TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'linked'
    CHECK (status IN ('linked','pending','suspended','unlinked')),
  correlation_id TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_repository_links_project
  ON repository_links (project_id, organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_repository_links_project_integration
  ON repository_links (project_id, integration_id);

-- Webhook endpoints (transport boundary; secret hash only, never the secret).
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  endpoint_path TEXT NOT NULL DEFAULT '',
  secret_hash TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','inactive','revoked')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_webhook_endpoints_integration
  ON webhook_endpoints (integration_id);

-- Inbound external events (idempotent per integration + external event id).
CREATE TABLE IF NOT EXISTS integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_event_id TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL DEFAULT '',
  payload JSONB NOT NULL DEFAULT '{}',
  delivered BOOLEAN NOT NULL DEFAULT FALSE,
  correlation_id TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_integration_events_integration
  ON integration_events (integration_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ux_integration_events_integration_external
  ON integration_events (integration_id, external_event_id)
  WHERE external_event_id <> '';

-- Outbound operation ledger (idempotent per integration + idempotency key).
CREATE TABLE IF NOT EXISTS integration_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL,
  operation_type TEXT NOT NULL DEFAULT '',
  actor TEXT NOT NULL DEFAULT '',
  actor_type TEXT NOT NULL DEFAULT '',
  idempotency_key TEXT NOT NULL DEFAULT '',
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','failed','cancelled')),
  result JSONB NOT NULL DEFAULT '{}',
  error_code TEXT,
  retryable BOOLEAN NOT NULL DEFAULT TRUE,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  correlation_id TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_integration_operations_integration
  ON integration_operations (integration_id, status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ux_integration_operations_integration_idem
  ON integration_operations (integration_id, idempotency_key)
  WHERE idempotency_key <> '';
