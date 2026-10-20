-- 021_billing.sql -- Phase 13: secure billing & commercial operations.
-- Forward-only, idempotent. Money in integer minor units (BIGINT); never float.
-- Invoice line items immutable once parent invoice leaves draft.

CREATE TABLE IF NOT EXISTS billing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  interval TEXT NOT NULL DEFAULT 'monthly' CHECK (interval IN ('monthly','annual','one_time')),
  plan_version INTEGER NOT NULL DEFAULT 1 CHECK (plan_version >= 1),
  features JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','deprecated')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO billing_plans (code, name, amount_minor, currency, interval, plan_version, features, status)
VALUES
  ('starter', 'Starter', 0, 'USD', 'monthly', 1, '{"seats": 5, "projects": 3, "ai_runs": 100}', 'active'),
  ('growth', 'Growth', 4900, 'USD', 'monthly', 1, '{"seats": 25, "projects": 25, "ai_runs": 5000}', 'active'),
  ('scale', 'Scale', 19900, 'USD', 'monthly', 1, '{"seats": 200, "projects": 200, "ai_runs": 100000}', 'active')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS billing_customers (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL DEFAULT 'testpay',
  provider_customer_id TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  plan_id UUID NOT NULL REFERENCES billing_plans(id) ON DELETE RESTRICT,
  plan_code TEXT NOT NULL DEFAULT '',
  plan_version INTEGER NOT NULL DEFAULT 1,
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  status TEXT NOT NULL DEFAULT 'trialing'
    CHECK (status IN ('trialing','active','past_due','canceled')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  idempotency_key TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_billing_subs_org ON billing_subscriptions (organization_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ux_billing_subs_org_idem
  ON billing_subscriptions (organization_id, idempotency_key) WHERE idempotency_key <> '';
CREATE UNIQUE INDEX IF NOT EXISTS ux_billing_subs_org_single_active
  ON billing_subscriptions (organization_id) WHERE status IN ('trialing','active','past_due');

CREATE TABLE IF NOT EXISTS billing_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  subscription_id UUID NOT NULL REFERENCES billing_subscriptions(id) ON DELETE RESTRICT,
  feature_key TEXT NOT NULL DEFAULT '',
  limit_value BIGINT CHECK (limit_value IS NULL OR limit_value >= -1),
  status TEXT NOT NULL DEFAULT 'granted' CHECK (status IN ('granted','suspended','revoked')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subscription_id, feature_key)
);
CREATE INDEX IF NOT EXISTS ix_billing_ent_org ON billing_entitlements (organization_id);

CREATE TABLE IF NOT EXISTS billing_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  subscription_id UUID NOT NULL REFERENCES billing_subscriptions(id) ON DELETE RESTRICT,
  feature_key TEXT NOT NULL DEFAULT '',
  quantity BIGINT NOT NULL CHECK (quantity > 0 AND quantity <= 1000000000),
  event_key TEXT NOT NULL DEFAULT '',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_billing_usage_sub ON billing_usage_events (subscription_id, occurred_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ux_billing_usage_org_event
  ON billing_usage_events (organization_id, event_key) WHERE event_key <> '';

CREATE TABLE IF NOT EXISTS billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  subscription_id UUID NOT NULL REFERENCES billing_subscriptions(id) ON DELETE RESTRICT,
  invoice_number TEXT NOT NULL DEFAULT '',
  period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  period_end TIMESTAMPTZ NOT NULL DEFAULT now(),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  plan_code TEXT NOT NULL DEFAULT '',
  plan_version INTEGER NOT NULL DEFAULT 1,
  subtotal_minor BIGINT NOT NULL CHECK (subtotal_minor >= 0),
  tax_minor BIGINT NOT NULL DEFAULT 0 CHECK (tax_minor >= 0),
  total_minor BIGINT NOT NULL CHECK (total_minor >= 0),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','open','paid','void','refunded')),
  idempotency_key TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE billing_invoices ADD CONSTRAINT ck_billing_inv_totals CHECK (total_minor = subtotal_minor + tax_minor);
ALTER TABLE billing_invoices ADD CONSTRAINT ck_billing_inv_period CHECK (period_end > period_start);
CREATE INDEX IF NOT EXISTS ix_billing_inv_org ON billing_invoices (organization_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ux_billing_inv_org_number
  ON billing_invoices (organization_id, invoice_number) WHERE invoice_number <> '';
CREATE UNIQUE INDEX IF NOT EXISTS ux_billing_inv_org_idem
  ON billing_invoices (organization_id, idempotency_key) WHERE idempotency_key <> '';

CREATE TABLE IF NOT EXISTS billing_invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  invoice_id UUID NOT NULL REFERENCES billing_invoices(id) ON DELETE RESTRICT,
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 500),
  quantity BIGINT NOT NULL CHECK (quantity > 0),
  unit_amount_minor BIGINT NOT NULL CHECK (unit_amount_minor >= 0),
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_billing_line_math CHECK (amount_minor = quantity * unit_amount_minor)
);
CREATE INDEX IF NOT EXISTS ix_billing_lines_invoice ON billing_invoice_lines (invoice_id);

CREATE OR REPLACE FUNCTION forbid_billing_line_mutation() RETURNS TRIGGER AS $$
DECLARE parent_status TEXT;
BEGIN
  SELECT status INTO parent_status FROM billing_invoices WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  IF parent_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'invoice line items immutable once invoice leaves draft (INV-BILL-01)';
  END IF;
  IF TG_OP <> 'INSERT' THEN
    RAISE EXCEPTION 'invoice line items immutable (INV-BILL-01)';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_billing_lines_immutable ON billing_invoice_lines;
CREATE TRIGGER trg_billing_lines_immutable BEFORE UPDATE OR DELETE ON billing_invoice_lines
  FOR EACH ROW EXECUTE FUNCTION forbid_billing_line_mutation();

CREATE OR REPLACE FUNCTION forbid_open_invoice_money_mutation() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM 'draft' THEN
    IF NEW.subtotal_minor IS DISTINCT FROM OLD.subtotal_minor
      OR NEW.tax_minor IS DISTINCT FROM OLD.tax_minor
      OR NEW.total_minor IS DISTINCT FROM OLD.total_minor
      OR NEW.currency IS DISTINCT FROM OLD.currency
      OR NEW.subscription_id IS DISTINCT FROM OLD.subscription_id THEN
      RAISE EXCEPTION 'open invoice money immutable (INV-BILL-02)';
    END IF;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_billing_invoice_money ON billing_invoices;
CREATE TRIGGER trg_billing_invoice_money BEFORE UPDATE ON billing_invoices
  FOR EACH ROW EXECUTE FUNCTION forbid_open_invoice_money_mutation();

CREATE TABLE IF NOT EXISTS billing_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  invoice_id UUID NOT NULL REFERENCES billing_invoices(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL DEFAULT 'testpay',
  provider_payment_id TEXT NOT NULL DEFAULT '',
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','succeeded','failed','canceled')),
  idempotency_key TEXT NOT NULL DEFAULT '',
  failure_code TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0 AND retry_count <= 10),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_billing_pay_invoice ON billing_payments (invoice_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ux_billing_pay_org_idem
  ON billing_payments (organization_id, idempotency_key) WHERE idempotency_key <> '';
CREATE UNIQUE INDEX IF NOT EXISTS ux_billing_pay_provider_ref
  ON billing_payments (provider, provider_payment_id) WHERE provider_payment_id <> '';
CREATE OR REPLACE FUNCTION forbid_billing_payment_reopen() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IN ('succeeded','canceled') AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'terminal payment immutable (INV-BILL-03)';
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_billing_payment_terminal ON billing_payments;
CREATE TRIGGER trg_billing_payment_terminal BEFORE UPDATE ON billing_payments
  FOR EACH ROW EXECUTE FUNCTION forbid_billing_payment_reopen();

CREATE TABLE IF NOT EXISTS billing_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'testpay',
  external_event_id TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL DEFAULT '',
  organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
  invoice_id UUID REFERENCES billing_invoices(id) ON DELETE RESTRICT,
  payment_id UUID REFERENCES billing_payments(id) ON DELETE RESTRICT,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, external_event_id)
);
