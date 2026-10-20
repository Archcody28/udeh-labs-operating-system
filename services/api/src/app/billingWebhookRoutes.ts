/** Billing provider webhook ingress: signature -> persisted-tenant -> idempotent apply. */
import { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../api/http.js";
import { UnauthorizedError, ForbiddenError } from "../domain/authorization.js";
import { getBillingProvider } from "../domain/billingProvider.js";
import { billingWebhookService } from "../domain/billingService.js";
import { secretVault } from "../domain/integrationSecrets.js";
import { AuditRepository } from "../persistence/auditRepository.js";
import { getPool } from "../persistence/db.js";

const audits = new AuditRepository();

export async function handleBillingWebhookRoutes(req: IncomingMessage, res: ServerResponse, cid: string, url: URL, method: string): Promise<boolean> {
  const m = url.pathname.match(/^\/api\/v1\/webhooks\/billing\/([^/]+)$/);
  if (!m || method !== "POST") return false;
  const providerName = m[1];
  const raw = await new Promise<string>((resolve, reject) => {
    let s = "";
    req.on("data", (c) => { s += c; if (s.length > 1_000_000) reject(new Error("body too large")); });
    req.on("end", () => resolve(s));
    req.on("error", reject);
  });
  // Provider allowlist: unknown providers fail closed before any processing.
  const provider = getBillingProvider(providerName);
  void provider;
  const secret = await secretVault().get(`billing:${providerName}:webhook-secret`);
  const sig = (req.headers["x-testpay-signature"] as string) ?? (req.headers["x-webhook-signature"] as string) ?? null;
  if (!secret || !sig) {
    await audits.append({ organizationId: "00000000-0000-0000-0000-000000000000", correlationId: cid } as never,
      "billing.webhook-rejected", "webhook", providerName, "denied", { reason: "missing-secret-or-signature" });
    throw new UnauthorizedError("invalid webhook signature");
  }
  const pool = getPool();
  const before = await pool.query("SELECT count(*)::int AS n FROM billing_webhook_events WHERE provider=$1", [providerName]);
  void before;
  try {
    const out = await billingWebhookService.process(providerName, raw, sig, secret);
    return sendJson(res, 200, { data: { accepted: true, ...out }, correlationId: cid }, cid), true;
  } catch (err) {
    const msg = (err as Error).message ?? "";
    if (/invalid webhook signature|missing event id/i.test(msg)) throw new UnauthorizedError(msg);
    if (/unknown|unsupported/i.test(msg)) throw new ForbiddenError(msg);
    throw err;
  }
}
