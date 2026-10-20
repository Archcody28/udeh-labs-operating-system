// Billing adversarial security tests: real HTTP + real PostgreSQL.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app/server.js";
import { getPool } from "../persistence/db.js";
import { setSecretVault } from "../domain/integrationSecrets.js";

const hasDb = !!process.env.DATABASE_URL;
const SUFFIX = `${process.pid}-${Date.now().toString(36)}`;
const PW = "strong-password-123";

let base = "http://127.0.0.1:0";
let app: ReturnType<typeof createApp>;

async function api(path: string, call: { method?: string; body?: unknown; token?: string; headers?: Record<string, string> } = {}) {
  const headers: Record<string, string> = { ...(call.headers ?? {}) };
  if (call.token) headers["authorization"] = `Bearer ${call.token}`;
  const res = await fetch(`${base}${path}`, {
    method: call.method ?? "GET",
    headers: { "content-type": "application/json", ...headers },
    body: call.body ? JSON.stringify(call.body) : undefined,
  });
  let json: unknown = null;
  const text = await res.text();
  if (text) { try { json = JSON.parse(text); } catch { json = { raw: text }; } }
  return { status: res.status, json: json as Record<string, unknown>, raw: text, headers: res.headers };
}

async function register(email: string) {
  const r = await api("/api/v1/auth/register", { method: "POST", body: { email, password: PW, displayName: email } });
  assert.equal(r.status, 201, JSON.stringify(r.json));
}
async function login(email: string): Promise<string> {
  const r = await api("/api/v1/auth/login", { method: "POST", body: { email, password: PW } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  return (r.json.data as { token: string }).token;
}
async function elevateUser(userId: string): Promise<void> {
  const { SessionRepository } = await import("../persistence/sessionRepository.js");
  const rows = await getPool().query("SELECT id FROM sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", [userId]);
  assert.ok(rows.rowCount, "expected an active session");
  await new SessionRepository().elevate(rows.rows[0].id);
}
describe("billing security", { skip: !hasDb } as never, () => {
  let aliceToken = "";
  let aliceId = "";
  let aliceOrg = "";
  let bobToken = "";
  let bobOrg = "";
  let subId = "";
  let invId = "";
  let invVersion = 1;

  before(async () => {
    const { migrateUp } = await import("../persistence/migrate.js");
    await migrateUp(process.env.DATABASE_URL as string);
    app = createApp();
    await new Promise<void>((r) => app.listen(0, r));
    base = `http://127.0.0.1:${(app.address() as { port: number }).port}`;
    await register(`bsec-a-${SUFFIX}@example.com`);
    aliceToken = await login(`bsec-a-${SUFFIX}@example.com`);
    const me = await api("/api/v1/auth/me", { token: aliceToken });
    aliceId = (me.json.data as { subjectId: string }).subjectId;
    const org = await api("/api/v1/organizations", { method: "POST", token: aliceToken, body: { name: `BSec A ${SUFFIX}`, slug: `bsec-a-${SUFFIX}` } });
    assert.equal(org.status, 201, JSON.stringify(org.json));
    aliceOrg = (org.json.data as { organization: { id: string } }).organization.id;
    await elevateUser(aliceId);
    await register(`bsec-b-${SUFFIX}@example.com`);
    bobToken = await login(`bsec-b-${SUFFIX}@example.com`);
    const orgB = await api("/api/v1/organizations", { method: "POST", token: bobToken, body: { name: `BSec B ${SUFFIX}`, slug: `bsec-b-${SUFFIX}` } });
    bobOrg = (orgB.json.data as { organization: { id: string } }).organization.id;
    const meB = await api("/api/v1/auth/me", { token: bobToken });
    await elevateUser((meB.json.data as { subjectId: string }).subjectId);
  });

  after(async () => { await new Promise((r) => app.close(r)); });

  it("step-up required for subscribe; cross-org subscribe is 403", async () => {
    const noStep = await api(`/api/v1/organizations/${aliceOrg}/billing/subscriptions`, {
      method: "POST", token: bobToken, body: { planCode: "growth", idempotencyKey: `x-${SUFFIX}` },
    });
    assert.equal(noStep.status, 403, JSON.stringify(noStep.json));
    const sub = await api(`/api/v1/organizations/${aliceOrg}/billing/subscriptions`, {
      method: "POST", token: aliceToken, body: { planCode: "growth", idempotencyKey: `s-${SUFFIX}` },
    });
    assert.equal(sub.status, 201, JSON.stringify(sub.json));
    subId = (sub.json.data as { id: string }).id;
  });

  it("cross-tenant invoice and subscription reads are 403", async () => {
    const start = new Date().toISOString();
    const end = new Date(Date.now() + 30 * 86400000).toISOString();
    const inv = await api(`/api/v1/organizations/${aliceOrg}/billing/invoices`, {
      method: "POST", token: aliceToken,
      body: { subscriptionId: subId, lines: [{ description: "Growth", quantity: 1, unitAmountMinor: 4900 }], taxMinor: 0, periodStart: start, periodEnd: end, idempotencyKey: `i-${SUFFIX}` },
    });
    assert.equal(inv.status, 201, JSON.stringify(inv.json));
    invId = (inv.json.data as { id: string }).id;
    invVersion = (inv.json.data as { version: number }).version;
    const xOrg = await api(`/api/v1/organizations/${bobOrg}/billing/invoices/${invId}`, { token: bobToken });
    assert.equal(xOrg.status, 403, JSON.stringify(xOrg.json));
    const xSub = await api(`/api/v1/organizations/${bobOrg}/billing/subscriptions/${subId}/usage`, { token: bobToken });
    assert.equal(xSub.status, 403, JSON.stringify(xSub.json));
  });

  it("charge open invoice is idempotent; replay returns the same payment", async () => {
    const open = await api(`/api/v1/organizations/${aliceOrg}/billing/invoices/${invId}/transition`, {
      method: "POST", token: aliceToken, body: { to: "open", version: invVersion },
    });
    assert.equal(open.status, 200, JSON.stringify(open.json));
    invVersion = Number((open.json.data as { version: number }).version);
    const first = await api(`/api/v1/organizations/${aliceOrg}/billing/invoices/${invId}/payments`, {
      method: "POST", token: aliceToken, body: { idempotencyKey: `pay-${SUFFIX}` },
    });
    assert.equal(first.status, 201, JSON.stringify(first.json));
    const firstPay = first.json.data as { id: string; status: string };
    assert.equal(firstPay.status, "succeeded");
    const again = await api(`/api/v1/organizations/${aliceOrg}/billing/invoices/${invId}/payments`, {
      method: "POST", token: aliceToken, body: { idempotencyKey: `pay-${SUFFIX}` },
    });
    assert.equal(again.status, 200, JSON.stringify(again.json));
    assert.equal(again.json.replayed, true);
    assert.equal((again.json.data as { id: string }).id, firstPay.id);
    const paid = await api(`/api/v1/organizations/${aliceOrg}/billing/invoices/${invId}`, { token: aliceToken });
    assert.equal((paid.json.data as { status: string }).status, "paid");
  });

  it("webhook forgery rejected; forged tenant hint never moves state", async () => {
    const { signTestWebhook } = await import("../domain/billingProvider.js");
    setSecretVault({ put: async () => {}, get: async () => "whsec-bsec", revoke: async () => {} });
    const raw = JSON.stringify({
      eventId: `evt-${SUFFIX}`, type: "payment.succeeded",
      providerPaymentId: "pay-forged-ref", invoiceId: invId, organizationId: bobOrg,
    });
    const forged = await fetch(`${base}/api/v1/webhooks/billing/testpay`, {
      method: "POST", headers: { "content-type": "application/json", "x-testpay-signature": "sha256=deadbeef" },
      body: raw,
    });
    assert.equal(forged.status, 401, `forged signature must be rejected: ${await forged.text()}`);
    const sig = signTestWebhook(raw, "whsec-bsec");
    const applied = await fetch(`${base}/api/v1/webhooks/billing/testpay`, {
      method: "POST", headers: { "content-type": "application/json", "x-testpay-signature": sig },
      body: raw,
    });
    const appliedText = await applied.text();
    assert.equal(applied.status, 200, appliedText);
    const out = JSON.parse(appliedText) as { data: { duplicate: boolean; applied?: string } };
    assert.equal(out.data.duplicate, false);
    assert.equal(out.data.applied, "unknown-payment");
    const replay = await fetch(`${base}/api/v1/webhooks/billing/testpay`, {
      method: "POST", headers: { "content-type": "application/json", "x-testpay-signature": sig },
      body: raw,
    });
    const replayOut = await replay.json() as { data: { duplicate: boolean } };
    assert.equal(replayOut.data.duplicate, true);
    const inv = await api(`/api/v1/organizations/${aliceOrg}/billing/invoices/${invId}`, { token: aliceToken });
    assert.equal((inv.json.data as { organization_id: string }).organization_id, aliceOrg);
    assert.equal((inv.json.data as { status: string }).status, "paid");
    const ledger = await getPool().query(
      "SELECT organization_id FROM billing_webhook_events WHERE provider='testpay' AND external_event_id=$1", [`evt-${SUFFIX}`]);
    assert.equal(ledger.rows[0]?.organization_id ?? null, null, "unknown payment must not claim a tenant");
  });

  it("no credential leakage through billing responses or audit metadata", async () => {
    const list = await api(`/api/v1/organizations/${aliceOrg}/billing/invoices`, { token: aliceToken });
    assert.equal(list.status, 200);
    assert.ok(!/sk-|whsec|token_hash|password|webhook-secret/i.test(list.raw), "invoice list leaked a secret");
    const pays = await api(`/api/v1/organizations/${aliceOrg}/billing/invoices/${invId}/payments`, { token: aliceToken });
    assert.ok(!/sk-|whsec|token_hash|password|webhook-secret/i.test(pays.raw), "payment list leaked a secret");
    const audits = await getPool().query(
      "SELECT metadata::text AS m FROM audit_events WHERE organization_id=$1 AND action LIKE 'billing.%' ORDER BY id DESC LIMIT 50",
      [aliceOrg]);
    for (const r of audits.rows) {
      assert.ok(!/sk-|whsec|token_hash|password|webhook-secret/i.test(String(r.m)), `audit leak: ${r.m}`);
    }
  });
});
