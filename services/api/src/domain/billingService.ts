/** Billing domain service: cross-table financial transitions in one tx each. */
import { PoolClient } from "pg";
import { randomUUID } from "node:crypto";
import { TenantContext } from "./tenancy.js";
import { ValidationError, ConflictError } from "./errors.js";
import { withTransaction } from "../persistence/db.js";
import { IdempotencyRepository } from "../persistence/idempotencyRepository.js";
import { AuditRepository } from "../persistence/auditRepository.js";
import { updateWithVersion } from "../persistence/baseRepository.js";
import {
  BillingPlanRepository, BillingCustomerRepository, BillingSubscriptionRepository,
  BillingEntitlementRepository, BillingUsageRepository, BillingInvoiceRepository,
  BillingPaymentRepository,
} from "../persistence/billingRepository.js";
import {
  assertSubscriptionTransition, assertInvoiceTransition, assertPaymentTransition,
  lineTotal, invoiceTotal, parseFeatures, decideEntitlement, validateCurrency,
} from "./billing.js";
import { getBillingProvider } from "./billingProvider.js";
import { sanitizeForAudit } from "./integrationSecrets.js";

const plans = new BillingPlanRepository();
const customers = new BillingCustomerRepository();
const subs = new BillingSubscriptionRepository();
const ents = new BillingEntitlementRepository();
const usage = new BillingUsageRepository();
const invoices = new BillingInvoiceRepository();
const payments = new BillingPaymentRepository();
const idem = new IdempotencyRepository();
const audits = new AuditRepository();

function requireIdemKey(key: unknown): string {
  const k = String(key ?? "").trim();
  if (!k || k.length > 200) throw new ValidationError("idempotencyKey required (1..200 chars)");
  return k;
}

export const billingService = {
  async subscribe(ctx: TenantContext, planCode: string, idemKeyRaw: string, actorId: string) {
    const idemKey = requireIdemKey(idemKeyRaw);
    return withTransaction(async (tx) => {
      const prior = await idem.check(ctx, "billing.subscribe", idemKey, tx);
      if (prior) return { replayed: true as const, subscription: prior };
      const existing = await subs.findByIdem(ctx, idemKey, tx);
      if (existing) return { replayed: true as const, subscription: existing };
      const active = await subs.findActive(ctx, tx);
      if (active) throw new ConflictError("organization already has an active subscription");
      const plan = await plans.findByCode(planCode) as { id: string; code: string; plan_version: number; amount_minor: number; currency: string; features: unknown };
      const now = new Date();
      const end = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
      const row = await subs.createRow(ctx, {
        plan_id: plan.id, plan_code: plan.code, plan_version: plan.plan_version,
        amount_minor: plan.amount_minor, currency: plan.currency, status: "trialing",
        current_period_start: now.toISOString(), current_period_end: end.toISOString(), idempotency_key: idemKey,
      }, tx);
      await customers.upsert(ctx, "testpay", `cus_${ctx.organizationId.slice(0, 8)}`, tx);
      await grantPlanEntitlements(ctx, String(row.id), plan.features, tx);
      const payload = { subscriptionId: row.id, planCode: plan.code };
      await idem.save(ctx, "billing.subscribe", idemKey, payload, tx);
      await audits.append({ ...ctx, actorId, principalType: "human" }, "billing.subscribed", "subscription", String(row.id), "success", sanitizeForAudit(payload) as Record<string, unknown>, tx);
      return { replayed: false as const, subscription: row };
    });
  },

  async changePlan(ctx: TenantContext, subscriptionId: string, version: number, planCode: string, idemKeyRaw: string, actorId: string) {
    const idemKey = requireIdemKey(idemKeyRaw);
    return withTransaction(async (tx) => {
      const prior = await idem.check(ctx, "billing.change-plan", idemKey, tx);
      if (prior) return { replayed: true as const, subscription: prior };
      const current = await subs.findOwned(ctx, subscriptionId, tx);
      if (!current) throw new ConflictError("subscription not found");
      if (!["trialing", "active", "past_due"].includes(String(current.status))) {
        throw new ConflictError(`cannot change plan from ${current.status}`);
      }
      const plan = await plans.findByCode(planCode) as { id: string; code: string; plan_version: number; amount_minor: number; currency: string; features: unknown };
      const updated = await subs.changePlan(ctx, subscriptionId, version, plan as unknown as Record<string, unknown>, tx);
      await grantPlanEntitlements(ctx, subscriptionId, plan.features, tx);
      const payload = { subscriptionId, planCode: plan.code, version: updated.version };
      await idem.save(ctx, "billing.change-plan", idemKey, payload, tx);
      await audits.append({ ...ctx, actorId, principalType: "human" }, "billing.plan-changed", "subscription", subscriptionId, "success", sanitizeForAudit(payload) as Record<string, unknown>, tx);
      return { replayed: false as const, subscription: updated };
    });
  },

  async transitionSubscription(ctx: TenantContext, subscriptionId: string, version: number, to: string, actorId: string) {
    return withTransaction(async (tx) => {
      const current = await subs.findOwned(ctx, subscriptionId, tx);
      if (!current) throw new ConflictError("subscription not found");
      assertSubscriptionTransition(String(current.status), to);
      const updated = await subs.transition(ctx, subscriptionId, version, to, tx);
      await audits.append({ ...ctx, actorId, principalType: "human" }, "billing.subscription-transitioned", "subscription", subscriptionId, "success", { to }, tx);
      return updated;
    });
  },
};

async function grantPlanEntitlements(ctx: TenantContext, subscriptionId: string, features: unknown, tx: PoolClient): Promise<void> {
  const parsed = parseFeatures(typeof features === "string" ? JSON.parse(features as string) : features);
  for (const [feature, limit] of Object.entries(parsed)) {
    await ents.grant(ctx, subscriptionId, feature, limit, "granted", tx);
  }
}
export const billingUsageService = {
  async record(ctx: TenantContext, subscriptionId: string, featureKey: string, quantity: number, eventKeyRaw: string, actorId: string) {
    const eventKey = String(eventKeyRaw ?? "").trim();
    if (!eventKey || eventKey.length > 200) throw new ValidationError("eventKey required (1..200 chars)");
    if (!featureKey || featureKey.length > 120) throw new ValidationError("featureKey required (1..120 chars)");
    if (!Number.isInteger(quantity) || quantity <= 0) throw new ValidationError("quantity must be a positive integer");
    return withTransaction(async (tx) => {
      const sub = await subs.findOwned(ctx, subscriptionId, tx);
      if (!sub) throw new ConflictError("subscription not found");
      if (!["trialing", "active"].includes(String(sub.status))) throw new ConflictError(`usage not accepted in ${sub.status}`);
      const { row, duplicate } = await usage.recordOnce(ctx, subscriptionId, featureKey, quantity, eventKey, tx);
      if (!duplicate) {
        await audits.append({ ...ctx, actorId, principalType: "human" }, "billing.usage-recorded", "subscription", subscriptionId, "success", { featureKey, quantity }, tx);
      }
      return { row, duplicate };
    });
  },
  async check(ctx: TenantContext, subscriptionId: string, featureKey: string) {
    const sub = await subs.findOwned(ctx, subscriptionId);
    if (!sub) throw new ConflictError("subscription not found");
    const rows = await ents.listForOrg(ctx);
    const ent = rows.find((r) => String(r.subscription_id) === subscriptionId && String(r.feature_key) === featureKey);
    if (!ent) return { allowed: false, reason: "no-entitlement" };
    const used = await usage.usageFor(ctx, subscriptionId, featureKey);
    return { ...decideEntitlement({
      subscriptionStatus: String(sub.status),
      entitlementStatus: String(ent.status),
      limit: ent.limit_value === null ? null : Number(ent.limit_value),
      used,
    }), used, limit: ent.limit_value };
  },
};
export const billingInvoiceService = {
  async createDraft(ctx: TenantContext, subscriptionId: string, lines: { description: string; quantity: number; unitAmountMinor: number }[], taxMinor: number, periodStart: string, periodEnd: string, idemKeyRaw: string, actorId: string) {
    const idemKey = requireIdemKey(idemKeyRaw);
    if (!Array.isArray(lines) || lines.length === 0 || lines.length > 50) throw new ValidationError("lines required (1..50)");
    for (const l of lines) {
      if (!l || typeof l.description !== "string" || !l.description.trim() || l.description.length > 500) throw new ValidationError("each line needs a description (1..500)");
      lineTotal(Number(l.quantity), Number(l.unitAmountMinor));
    }
    const totals = invoiceTotal(lines.map((l) => ({ quantity: Number(l.quantity), unitAmountMinor: Number(l.unitAmountMinor) })), Number(taxMinor));
    if (new Date(periodEnd).getTime() <= new Date(periodStart).getTime()) throw new ValidationError("period end must be after start");
    return withTransaction(async (tx) => {
      const prior = await idem.check(ctx, "billing.invoice-create", idemKey, tx);
      if (prior) return { replayed: true as const, invoice: prior };
      const existing = await invoices.findByIdem(ctx, idemKey, tx);
      if (existing) return { replayed: true as const, invoice: existing };
      const sub = await subs.findOwned(ctx, subscriptionId, tx) as { plan_code: string; plan_version: number; currency: string } | null;
      if (!sub) throw new ConflictError("subscription not found");
      validateCurrency(String(sub.currency));
      const numRes = await tx.query(
        "SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)),0)+1 AS n FROM billing_invoices WHERE organization_id=$1 AND invoice_number LIKE 'INV-%'",
        [ctx.organizationId]);
      const invoiceNumber = `INV-${String(numRes.rows[0].n).padStart(6, "0")}`;
      const invRes = await tx.query(
        "INSERT INTO billing_invoices(organization_id, subscription_id, invoice_number, period_start, period_end, currency, plan_code, plan_version, subtotal_minor, tax_minor, total_minor, status, idempotency_key) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'draft',$12) RETURNING *",
        [ctx.organizationId, subscriptionId, invoiceNumber, periodStart, periodEnd, sub.currency, sub.plan_code, sub.plan_version, totals.subtotal, totals.tax, totals.total, idemKey]);
      const invoice = invRes.rows[0];
      for (const l of lines) {
        await tx.query(
          "INSERT INTO billing_invoice_lines(organization_id, invoice_id, description, quantity, unit_amount_minor, amount_minor) VALUES ($1,$2,$3,$4,$5,$6)",
          [ctx.organizationId, invoice.id, l.description.trim(), Number(l.quantity), Number(l.unitAmountMinor), lineTotal(Number(l.quantity), Number(l.unitAmountMinor))]);
      }
      const payload = { invoiceId: invoice.id, invoiceNumber, totalMinor: totals.total };
      await idem.save(ctx, "billing.invoice-create", idemKey, payload, tx);
      await audits.append({ ...ctx, actorId, principalType: "human" }, "billing.invoice-created", "invoice", String(invoice.id), "success", sanitizeForAudit(payload) as Record<string, unknown>, tx);
      return { replayed: false as const, invoice };
    });
  },
  async transition(ctx: TenantContext, invoiceId: string, version: number, to: string, actorId: string) {
    return withTransaction(async (tx) => {
      const current = await invoices.findOwned(ctx, invoiceId, tx);
      if (!current) throw new ConflictError("invoice not found");
      assertInvoiceTransition(String(current.status), to);
      const updated = await updateWithVersion("billing_invoices", invoiceId, version, { status: to }, tx);
      await audits.append({ ...ctx, actorId, principalType: "human" }, "billing.invoice-transitioned", "invoice", invoiceId, "success", { to }, tx);
      return updated;
    });
  },
};
export const billingPaymentService = {
  async charge(ctx: TenantContext, invoiceId: string, idemKeyRaw: string, actorId: string) {
    const idemKey = requireIdemKey(idemKeyRaw);
    const prior = await payments.findByIdem(ctx, idemKey);
    if (prior) return { replayed: true as const, payment: { id: prior.id, status: prior.status } };
    const invoice = await invoices.findOwned(ctx, invoiceId) as { status: string; total_minor: string; currency: string } | null;
    if (!invoice) throw new ConflictError("invoice not found");
    if (String(invoice.status) !== "open") throw new ConflictError(`invoice must be open to charge (is ${invoice.status})`);
    const provider = getBillingProvider("testpay");
    const created = await withTransaction(async (tx) => {
      const custRes = await tx.query("SELECT * FROM billing_customers WHERE organization_id=$1", [ctx.organizationId]);
      const customerId = custRes.rows[0]?.provider_customer_id ?? `cus_${ctx.organizationId.slice(0, 8)}`;
      const pRes = await tx.query(
        "INSERT INTO billing_payments(organization_id, invoice_id, provider, provider_payment_id, amount_minor, currency, status, idempotency_key) VALUES ($1,$2,'testpay','',$3,$4,'pending',$5) RETURNING *",
        [ctx.organizationId, invoiceId, Number(invoice.total_minor), invoice.currency, idemKey]);
      return { payment: pRes.rows[0], customerId };
    });
    const result = await provider.charge({
      amountMinor: Number(invoice.total_minor), currency: String(invoice.currency),
      providerCustomerId: String(created.customerId), invoiceId, idempotencyKey: idemKey,
    });
    return withTransaction(async (tx) => {
      const current = await payments.findOwned(ctx, String(created.payment.id), tx) as { status: string; version: number } | null;
      if (!current) throw new ConflictError("payment not found");
      if (String(current.status) !== "pending") return { replayed: true as const, payment: { id: created.payment.id, status: current.status } };
      await tx.query("UPDATE billing_payments SET provider_payment_id=$2, failure_code=$3, version=version+1, updated_at=now() WHERE id=$1",
        [created.payment.id, result.providerPaymentId, result.failureCode]);
      if (result.outcome === "succeeded") {
        assertPaymentTransition("pending", "succeeded");
        const pay = await updateWithVersion("billing_payments", String(created.payment.id), Number(current.version) + 1, { status: "succeeded" }, tx);
        const inv = await invoices.findOwned(ctx, invoiceId, tx) as { status: string; version: number } | null;
        if (inv && String(inv.status) === "open") {
          assertInvoiceTransition("open", "paid");
          await updateWithVersion("billing_invoices", invoiceId, Number(inv.version), { status: "paid" }, tx);
        }
        await audits.append({ ...ctx, actorId, principalType: "human" }, "billing.payment-succeeded", "payment", String(created.payment.id), "success", { invoiceId }, tx);
        return { replayed: false as const, payment: { id: pay.id, status: pay.status } };
      }
      assertPaymentTransition("pending", "failed");
      const pay = await updateWithVersion("billing_payments", String(created.payment.id), Number(current.version) + 1, { status: "failed", failure_code: result.failureCode }, tx);
      await audits.append({ ...ctx, actorId, principalType: "human" }, "billing.payment-failed", "payment", String(created.payment.id), "success", { invoiceId, failureCode: result.failureCode }, tx);
      return { replayed: false as const, payment: { id: pay.id, status: pay.status } };
    });
  },
};
export const billingWebhookService = {
  async process(providerName: string, rawBody: string, signature: string | null, secret: string) {
    const provider = getBillingProvider(providerName);
    if (!provider.verifyWebhookSignature({ rawBody, signatureHeader: signature, secret })) {
      throw new ValidationError("invalid webhook signature");
    }
    const { externalEventId, eventType, event } = provider.parseWebhook(rawBody);
    return withTransaction(async (tx) => {
      const seen = await tx.query("SELECT * FROM billing_webhook_events WHERE provider=$1 AND external_event_id=$2", [providerName, externalEventId]);
      if ((seen.rowCount ?? 0) > 0) return { duplicate: true as const, eventType };
      if (event.kind === "unknown") {
        await tx.query("INSERT INTO billing_webhook_events(provider, external_event_id, event_type, processed) VALUES ($1,$2,$3,TRUE)",
          [providerName, externalEventId, eventType]);
        return { duplicate: false as const, eventType, applied: "ignored" as const };
      }
      const pay = await payments.findByProviderRef(providerName, event.providerPaymentId, tx) as { id: string; organization_id: string; invoice_id: string; status: string; version: number } | null;
      if (!pay) {
        await tx.query("INSERT INTO billing_webhook_events(provider, external_event_id, event_type, processed) VALUES ($1,$2,$3,TRUE)",
          [providerName, externalEventId, eventType]);
        return { duplicate: false as const, eventType, applied: "unknown-payment" as const };
      }
      if (event.kind === "payment_succeeded" && String(pay.status) === "pending") {
        assertPaymentTransition("pending", "succeeded");
        await updateWithVersion("billing_payments", String(pay.id), Number(pay.version), { status: "succeeded" }, tx);
        const invRes = await tx.query("SELECT * FROM billing_invoices WHERE id=$1", [pay.invoice_id]);
        const inv = invRes.rows[0];
        if (inv && String(inv.status) === "open") {
          assertInvoiceTransition("open", "paid");
          await updateWithVersion("billing_invoices", String(inv.id), Number(inv.version), { status: "paid" }, tx);
        }
      } else if (event.kind === "payment_failed" && String(pay.status) === "pending") {
        assertPaymentTransition("pending", "failed");
        await updateWithVersion("billing_payments", String(pay.id), Number(pay.version), { status: "failed", failure_code: event.failureCode }, tx);
      }
      await tx.query("INSERT INTO billing_webhook_events(provider, external_event_id, event_type, organization_id, invoice_id, payment_id, processed) VALUES ($1,$2,$3,$4,$5,$6,TRUE)",
        [providerName, externalEventId, eventType, pay.organization_id, pay.invoice_id, pay.id]);
      const ctx = { organizationId: String(pay.organization_id), correlationId: externalEventId } as TenantContext;
      await audits.append(ctx, "billing.webhook-processed", "payment", String(pay.id), "success", { eventType, externalEventId }, tx);
      return { duplicate: false as const, eventType, applied: "processed" as const };
    });
  },
};
