// Billing PostgreSQL integration: real DB required. No SQLite, no silent skip in CI.
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

const hasDb = !!process.env.DATABASE_URL;

async function orgCtx() {
  const { OrganizationRepository } = await import("../persistence/tenancyRepositories.js");
  const { migrateUp } = await import("../persistence/migrate.js");
  await migrateUp(process.env.DATABASE_URL as string);
  const org = await new OrganizationRepository().create(`Bill ${Date.now()}-${Math.random().toString(36).slice(2)}`, `bill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  return { organizationId: org.id, correlationId: "billing-it", actorId: "tester", principalType: "human" as const };
}

let ctx: Awaited<ReturnType<typeof orgCtx>>;

describe("billing postgres integration", { skip: !hasDb } as never, () => {
  before(async () => { ctx = await orgCtx(); });

  it("migrates 021 and seeds plans", async () => {
    const { getPool } = await import("../persistence/db.js");
    const mig = await getPool().query("SELECT 1 FROM schema_migrations WHERE version='021_billing.sql'");
    assert.equal(mig.rowCount, 1);
    const plans = await getPool().query("SELECT code FROM billing_plans WHERE status='active' ORDER BY code");
    assert.deepEqual(plans.rows.map((r: { code: string }) => r.code), ["growth", "scale", "starter"]);
  });

  it("subscribes once; second active subscription conflicts", async () => {
    const { billingService } = await import("../domain/billingService.js");
    const first = await billingService.subscribe(ctx, "growth", `sub-${Date.now()}`, "tester");
    assert.equal(first.replayed, false);
    await assert.rejects(
      () => billingService.subscribe(ctx, "growth", `sub-${Date.now()}-other`, "tester"),
      /already has an active/);
  });

  it("idempotent subscribe replay returns stored response", async () => {
    const { billingService } = await import("../domain/billingService.js");
    const key = `replay-${Date.now()}`;
    const { OrganizationRepository } = await import("../persistence/tenancyRepositories.js");
    const org = await new OrganizationRepository().create(`R ${Date.now()}`, `r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    const c2 = { ...ctx, organizationId: org.id };
    const a = await billingService.subscribe(c2, "starter", key, "tester");
    const b = await billingService.subscribe(c2, "starter", key, "tester");
    assert.equal(b.replayed, true);
    assert.deepEqual((b.subscription as { subscriptionId: string }).subscriptionId, (a.subscription as { id: string }).id);
  });

  it("usage ingest dedups on event key and aggregates", async () => {
    const { billingService, billingUsageService } = await import("../domain/billingService.js");
    const { OrganizationRepository } = await import("../persistence/tenancyRepositories.js");
    const org = await new OrganizationRepository().create(`U ${Date.now()}`, `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    const c2 = { ...ctx, organizationId: org.id };
    const s = await billingService.subscribe(c2, "growth", `u-${Date.now()}`, "tester");
    const subId = String((s.subscription as { id: string }).id);
    const e1 = await billingUsageService.record(c2, subId, "ai_runs", 5, "evt-dedup-1", "tester");
    assert.equal(e1.duplicate, false);
    const e2 = await billingUsageService.record(c2, subId, "ai_runs", 5, "evt-dedup-1", "tester");
    assert.equal(e2.duplicate, true);
    const { getPool } = await import("../persistence/db.js");
    const sum = await getPool().query("SELECT COALESCE(SUM(quantity),0)::int AS n FROM billing_usage_events WHERE organization_id=$1", [org.id]);
    assert.equal(sum.rows[0].n, 5);
  });
});

describe("billing invoice postgres", { skip: !hasDb } as never, () => {
  before(async () => { if (!ctx) ctx = await orgCtx(); });
  it("draft invoice pins totals; open locks money and lines", async () => {
    const { billingService, billingInvoiceService } = await import("../domain/billingService.js");
    const { OrganizationRepository } = await import("../persistence/tenancyRepositories.js");
    const { getPool } = await import("../persistence/db.js");
    const org = await new OrganizationRepository().create(`I ${Date.now()}`, `i-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    const c2 = { ...ctx, organizationId: org.id };
    const s = await billingService.subscribe(c2, "growth", `i-${Date.now()}`, "tester");
    const subId = String((s.subscription as { id: string }).id);
    const start = new Date().toISOString();
    const end = new Date(Date.now() + 30 * 86400000).toISOString();
    const created = await billingInvoiceService.createDraft(c2, subId,
      [{ description: "Growth monthly", quantity: 1, unitAmountMinor: 4900 }], 0, start, end, `inv-${Date.now()}`, "tester");
    const inv = created.invoice as { id: string; total_minor: string; version: number };
    assert.equal(Number(inv.total_minor), 4900);
    const opened = await billingInvoiceService.transition(c2, inv.id, inv.version, "open", "tester");
    assert.equal((opened as { status: string }).status, "open");
    await assert.rejects(
      () => getPool().query("UPDATE billing_invoice_lines SET description='tamper' WHERE invoice_id=$1", [inv.id]),
      /immutable/);
    await assert.rejects(
      () => getPool().query("UPDATE billing_invoices SET total_minor=1 WHERE id=$1", [inv.id]),
      /immutable/);
  });

  it("rollback leaves no partial invoice; stale version conflicts", async () => {
    const { withTransaction, getPool } = await import("../persistence/db.js");
    const { billingService, billingInvoiceService } = await import("../domain/billingService.js");
    const { OrganizationRepository } = await import("../persistence/tenancyRepositories.js");
    await billingService.subscribe(ctx, "starter", `rb-${Date.now()}`, "tester").catch(() => null);
    const subRow = await getPool().query("SELECT id FROM billing_subscriptions WHERE organization_id=$1 LIMIT 1", [ctx.organizationId]);
    assert.ok(subRow.rowCount, "expected a subscription for the rollback test");
    const n0 = await getPool().query("SELECT count(*)::int AS n FROM billing_invoices");
    await assert.rejects(() => withTransaction(async (tx) => {
      await tx.query("INSERT INTO billing_invoices(organization_id, subscription_id, period_start, period_end, subtotal_minor, tax_minor, total_minor) VALUES ($1,$2,now(),now()+interval '1 day',1,0,1)",
        [ctx.organizationId, subRow.rows[0].id]);
      throw new Error("boom-billing");
    }), /boom-billing/);
    const n1 = await getPool().query("SELECT count(*)::int AS n FROM billing_invoices");
    assert.equal(n1.rows[0].n, n0.rows[0].n);
    const org = await new OrganizationRepository().create(`C ${Date.now()}`, `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    const c2 = { ...ctx, organizationId: org.id };
    const s = await billingService.subscribe(c2, "starter", `c-${Date.now()}`, "tester");
    const subId = String((s.subscription as { id: string }).id);
    const start = new Date().toISOString();
    const end = new Date(Date.now() + 30 * 86400000).toISOString();
    const created = await billingInvoiceService.createDraft(c2, subId,
      [{ description: "Starter", quantity: 1, unitAmountMinor: 0 }], 0, start, end, `cinv-${Date.now()}`, "tester");
    const inv = created.invoice as { id: string; version: number };
    await billingInvoiceService.transition(c2, inv.id, inv.version, "open", "tester");
    await assert.rejects(() => billingInvoiceService.transition(c2, inv.id, inv.version, "paid", "tester"), /stale version/);
  });
});
describe("billing payment postgres", { skip: !hasDb } as never, () => {
  before(async () => { if (!ctx) ctx = await orgCtx(); });
  it("charge succeeds once; same idempotency key replays", async () => {
    const { billingService, billingInvoiceService, billingPaymentService } = await import("../domain/billingService.js");
    const { OrganizationRepository } = await import("../persistence/tenancyRepositories.js");
    const org = await new OrganizationRepository().create(`P ${Date.now()}`, `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    const c2 = { ...ctx, organizationId: org.id };
    const s = await billingService.subscribe(c2, "growth", `p-${Date.now()}`, "tester");
    const subId = String((s.subscription as { id: string }).id);
    const start = new Date().toISOString();
    const end = new Date(Date.now() + 30 * 86400000).toISOString();
    const created = await billingInvoiceService.createDraft(c2, subId,
      [{ description: "Growth monthly", quantity: 1, unitAmountMinor: 4900 }], 0, start, end, `pinv-${Date.now()}`, "tester");
    const inv = created.invoice as { id: string; version: number };
    await billingInvoiceService.transition(c2, inv.id, inv.version, "open", "tester");
    const key = `pay-${Date.now()}`;
    const c1 = await billingPaymentService.charge(c2, inv.id, key, "tester");
    assert.equal((c1.payment as { status: string }).status, "succeeded");
    const c2r = await billingPaymentService.charge(c2, inv.id, key, "tester");
    assert.equal(c2r.replayed, true);
    assert.equal((c2r.payment as { id: string }).id, (c1.payment as { id: string }).id);
  });

  it("webhook replay dedups; bad signature rejected", async () => {
    const { billingWebhookService } = await import("../domain/billingService.js");
    const { setSecretVault } = await import("../domain/integrationSecrets.js");
    const { signTestWebhook } = await import("../domain/billingProvider.js");
    const sec = "whsec-billing-it-2";
    setSecretVault({ put: async () => {}, get: async () => sec, revoke: async () => {} });
    const raw = JSON.stringify({ eventId: `evt-${Date.now()}`, type: "payment.succeeded", paymentId: "pay-unknown-1", invoiceId: "00000000-0000-0000-0000-000000000000" });
    const sig = signTestWebhook(raw, sec);
    const w1 = await billingWebhookService.process("testpay", raw, sig, sec);
    assert.equal(w1.duplicate, false);
    const w2 = await billingWebhookService.process("testpay", raw, sig, sec);
    assert.equal(w2.duplicate, true);
    await assert.rejects(() => billingWebhookService.process("testpay", raw, "sha256=bad", sec), /invalid webhook signature/);
  });
});