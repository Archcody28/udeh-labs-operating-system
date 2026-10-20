import { PoolClient } from "pg";
import { BaseRepository, updateWithVersion } from "./baseRepository.js";
import { TenantContext } from "../domain/tenancy.js";
import { NotFoundError } from "../domain/errors.js";

/** Tenant-scoped billing repositories. Cross-org reads return null so routes map to 403. */
export class BillingPlanRepository extends BaseRepository {
  protected table = "billing_plans";
  async listActive(): Promise<Record<string, unknown>[]> {
    const res = await this.query("SELECT id, code, name, amount_minor, currency, interval, plan_version, features, status FROM billing_plans WHERE status='active' ORDER BY amount_minor ASC", []);
    return res.rows;
  }
  async findByCode(code: string): Promise<Record<string, unknown>> {
    const res = await this.query("SELECT * FROM billing_plans WHERE code=$1 AND status='active'", [code]);
    if (res.rowCount === 0) throw new NotFoundError("billing_plans");
    return res.rows[0];
  }
}

export class BillingCustomerRepository extends BaseRepository {
  protected table = "billing_customers";
  async upsert(ctx: TenantContext, provider: string, customerId: string, tx?: PoolClient): Promise<Record<string, unknown>> {
    const res = await this.query(
      "INSERT INTO billing_customers(organization_id, provider, provider_customer_id) VALUES ($1,$2,$3) ON CONFLICT (organization_id) DO UPDATE SET provider=EXCLUDED.provider, provider_customer_id=EXCLUDED.provider_customer_id, updated_at=now() RETURNING *",
      [ctx.organizationId, provider, customerId], tx);
    return res.rows[0];
  }
}

export class BillingSubscriptionRepository extends BaseRepository {
  protected table = "billing_subscriptions";
  async findOwned(ctx: TenantContext, id: string, tx?: PoolClient): Promise<Record<string, unknown> | null> {
    return this.findOwnedInOrg(id, ctx.organizationId, tx);
  }
  async list(ctx: TenantContext): Promise<Record<string, unknown>[]> {
    const res = await this.query("SELECT * FROM billing_subscriptions WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 20", [ctx.organizationId]);
    return res.rows;
  }
  async findActive(ctx: TenantContext, tx?: PoolClient): Promise<Record<string, unknown> | null> {
    const res = await this.query(
      "SELECT * FROM billing_subscriptions WHERE organization_id=$1 AND status IN ('trialing','active','past_due') ORDER BY created_at DESC LIMIT 1",
      [ctx.organizationId], tx);
    return res.rows[0] ?? null;
  }
  async findByIdem(ctx: TenantContext, key: string, tx?: PoolClient): Promise<Record<string, unknown> | null> {
    if (!key) return null;
    const res = await this.query("SELECT * FROM billing_subscriptions WHERE organization_id=$1 AND idempotency_key=$2",
      [ctx.organizationId, key], tx);
    return res.rows[0] ?? null;
  }
  async createRow(ctx: TenantContext, row: Record<string, unknown>, tx?: PoolClient): Promise<Record<string, unknown>> {
    const res = await this.query(
      "INSERT INTO billing_subscriptions(organization_id, plan_id, plan_code, plan_version, amount_minor, currency, status, current_period_start, current_period_end, idempotency_key) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *",
      [ctx.organizationId, row.plan_id, row.plan_code, row.plan_version, row.amount_minor, row.currency,
        row.status ?? "trialing", row.current_period_start ?? null, row.current_period_end ?? null, row.idempotency_key ?? ""],
      tx);
    return res.rows[0];
  }
  async transition(ctx: TenantContext, id: string, version: number, status: string, tx?: PoolClient): Promise<Record<string, unknown>> {
    await this.findByIdInOrg(id, ctx.organizationId, tx);
    return updateWithVersion(this.table, id, version, { status }, tx);
  }
  async changePlan(ctx: TenantContext, id: string, version: number, plan: Record<string, unknown>, tx?: PoolClient): Promise<Record<string, unknown>> {
    await this.findByIdInOrg(id, ctx.organizationId, tx);
    return updateWithVersion(this.table, id, version, {
      plan_id: plan.id, plan_code: plan.code, plan_version: plan.plan_version,
      amount_minor: plan.amount_minor, currency: plan.currency,
    }, tx);
  }
}

export class BillingEntitlementRepository extends BaseRepository {
  protected table = "billing_entitlements";
  async listForOrg(ctx: TenantContext): Promise<Record<string, unknown>[]> {
    const res = await this.query(
      "SELECT e.*, s.status AS subscription_status FROM billing_entitlements e JOIN billing_subscriptions s ON s.id = e.subscription_id WHERE e.organization_id=$1 ORDER BY e.feature_key ASC", [ctx.organizationId]);
    return res.rows;
  }
  async grant(ctx: TenantContext, subscriptionId: string, featureKey: string, limit: number | null, status: string, tx?: PoolClient): Promise<void> {
    await this.query(
      "INSERT INTO billing_entitlements(organization_id, subscription_id, feature_key, limit_value, status) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (subscription_id, feature_key) DO UPDATE SET limit_value=EXCLUDED.limit_value, status=EXCLUDED.status, updated_at=now()",
      [ctx.organizationId, subscriptionId, featureKey, limit, status], tx);
  }
}

export class BillingUsageRepository extends BaseRepository {
  protected table = "billing_usage_events";
  async recordOnce(ctx: TenantContext, subscriptionId: string, featureKey: string, quantity: number, eventKey: string, tx?: PoolClient): Promise<{ row: Record<string, unknown>; duplicate: boolean }> {
    const res = await this.query(
      "INSERT INTO billing_usage_events(organization_id, subscription_id, feature_key, quantity, event_key) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING *",
      [ctx.organizationId, subscriptionId, featureKey, quantity, eventKey], tx);
    if (res.rowCount && res.rowCount > 0) return { row: res.rows[0], duplicate: false };
    const existing = await this.query(
      "SELECT * FROM billing_usage_events WHERE organization_id=$1 AND event_key=$2",
      [ctx.organizationId, eventKey], tx);
    return { row: existing.rows[0], duplicate: true };
  }
  async usageFor(ctx: TenantContext, subscriptionId: string, featureKey: string, tx?: PoolClient): Promise<number> {
    const res = await this.query(
      "SELECT COALESCE(SUM(quantity),0)::bigint AS used FROM billing_usage_events WHERE organization_id=$1 AND subscription_id=$2 AND feature_key=$3",
      [ctx.organizationId, subscriptionId, featureKey], tx);
    return Number(res.rows[0]?.used ?? 0);
  }
  async aggregate(ctx: TenantContext, subscriptionId: string, tx?: PoolClient): Promise<Record<string, number>> {
    const res = await this.query(
      "SELECT feature_key, COALESCE(SUM(quantity),0)::bigint AS total FROM billing_usage_events WHERE organization_id=$1 AND subscription_id=$2 GROUP BY feature_key",
      [ctx.organizationId, subscriptionId], tx);
    const out: Record<string, number> = {};
    for (const r of res.rows) out[String(r.feature_key)] = Number(r.total);
    return out;
  }
}
export class BillingInvoiceRepository extends BaseRepository {
  protected table = "billing_invoices";
  async findOwned(ctx: TenantContext, id: string, tx?: PoolClient): Promise<Record<string, unknown> | null> {
    return this.findOwnedInOrg(id, ctx.organizationId, tx);
  }
  async list(ctx: TenantContext): Promise<Record<string, unknown>[]> {
    const res = await this.query("SELECT * FROM billing_invoices WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 50", [ctx.organizationId]);
    return res.rows;
  }
  async findByIdem(ctx: TenantContext, key: string, tx?: PoolClient): Promise<Record<string, unknown> | null> {
    if (!key) return null;
    const res = await this.query("SELECT * FROM billing_invoices WHERE organization_id=$1 AND idempotency_key=$2", [ctx.organizationId, key], tx);
    return res.rows[0] ?? null;
  }
  async lines(ctx: TenantContext, invoiceId: string): Promise<Record<string, unknown>[]> {
    const res = await this.query("SELECT * FROM billing_invoice_lines WHERE organization_id=$1 AND invoice_id=$2 ORDER BY created_at ASC", [ctx.organizationId, invoiceId]);
    return res.rows;
  }
}

export class BillingPaymentRepository extends BaseRepository {
  protected table = "billing_payments";
  async findOwned(ctx: TenantContext, id: string, tx?: PoolClient): Promise<Record<string, unknown> | null> {
    return this.findOwnedInOrg(id, ctx.organizationId, tx);
  }
  async listForInvoice(ctx: TenantContext, invoiceId: string): Promise<Record<string, unknown>[]> {
    const res = await this.query("SELECT id, invoice_id, provider, amount_minor, currency, status, failure_code, retry_count, version, created_at FROM billing_payments WHERE organization_id=$1 AND invoice_id=$2 ORDER BY created_at DESC LIMIT 20",
      [ctx.organizationId, invoiceId]);
    return res.rows;
  }
  async findByProviderRef(provider: string, ref: string, tx?: PoolClient): Promise<Record<string, unknown> | null> {
    if (!ref) return null;
    const res = await this.query("SELECT * FROM billing_payments WHERE provider=$1 AND provider_payment_id=$2", [provider, ref], tx);
    return res.rows[0] ?? null;
  }
  async findByIdem(ctx: TenantContext, key: string, tx?: PoolClient): Promise<Record<string, unknown> | null> {
    if (!key) return null;
    const res = await this.query("SELECT * FROM billing_payments WHERE organization_id=$1 AND idempotency_key=$2", [ctx.organizationId, key], tx);
    return res.rows[0] ?? null;
  }
}