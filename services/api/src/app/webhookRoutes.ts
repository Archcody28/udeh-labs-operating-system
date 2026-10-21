/** Provider webhook ingress: signature -> tenant-from-integration -> idempotent store. */
import { IncomingMessage, ServerResponse } from "node:http";
import { sendJson } from "../api/http.js";
import { ForbiddenError, UnauthorizedError } from "../domain/authorization.js";
import { getProvider } from "../domain/integrationProvider.js";
import { integrationRepository } from "../persistence/integrationRepository.js";
import { getPool } from "../persistence/db.js";
import { AuditRepository } from "../persistence/auditRepository.js";
import { secretVault } from "../domain/integrationSecrets.js";

const audits = new AuditRepository();

export async function handleWebhookRoutes(req: IncomingMessage, res: ServerResponse, cid: string, url: URL, method: string): Promise<boolean> {
  const m = url.pathname.match(/^\/api\/v1\/webhooks\/([^/]+)$/);
  if (!m || method !== "POST") return false;
  const integrationId = m[1];
  const raw = await new Promise<string>((resolve, reject) => {
    let s = "";
    // Stop accumulating once the limit is exceeded: an inert reader keeps a
    // hostile client from streaming unbounded data into memory even though
    // the promise has already been rejected.
    let done = false;
    req.on("data", (c) => {
      if (done) return;
      s += c;
      if (s.length > 1_000_000) {
        done = true;
        s = "";
        reject(new Error("body too large"));
      }
    });
    req.on("end", () => { if (!done) { done = true; resolve(s); } });
    req.on("error", (e) => { if (!done) { done = true; reject(e); } });
  });
  const pool = getPool();
  const integ = (await pool.query("SELECT * FROM integrations WHERE id=$1", [integrationId])).rows[0] as { id: string; kind: string; status: string; organization_id: string } | undefined;
  if (!integ) return sendJson(res, 404, { code: "NOT_FOUND", message: "not found", correlationId: cid, retryable: false }, cid), true;
  const orgCtx = { organizationId: integ.organization_id, correlationId: cid } as never;
  if (integ.status === "revoked" || integ.status === "disconnected") {
    await audits.append(orgCtx, "webhook.rejected", "integration", integrationId, "denied", { reason: "integration-terminal" });
    throw new ForbiddenError("integration is not active");
  }
  const secret = await secretVault().get(`webhook:${integrationId}:secret`);
  const provider = getProvider(integ.kind);
  const sig = (req.headers["x-hub-signature-256"] as string) ?? null;
  if (!secret || !provider.verifyWebhookSignature({ rawBody: raw, signatureHeader: sig, secret })) {
    await audits.append(orgCtx, "webhook.rejected", "integration", integrationId, "denied", { reason: "bad-signature" });
    throw new UnauthorizedError("invalid webhook signature");
  }
  const env = provider.normalizeWebhook({
    rawBody: raw,
    eventHeader: (req.headers["x-github-event"] as string) ?? null,
    deliveryHeader: (req.headers["x-github-delivery"] as string) ?? null,
  });
  const { duplicate } = await integrationRepository.insertEventOnce(integrationId, env.provider, env.deliveryId, env.eventType, { eventId: env.eventId }, cid);
  await audits.append(orgCtx, duplicate ? "webhook.duplicate" : "webhook.accepted", "integration", integrationId, "success",
    { provider: env.provider, eventType: env.eventType, deliveryId: env.deliveryId });
  return sendJson(res, 200, { data: { accepted: true, duplicate, eventType: env.eventType }, correlationId: cid }, cid), true;
}
