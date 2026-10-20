/** Billing routes: plans, subscriptions, invoices, payments, usage, entitlements. */
import { IncomingMessage, ServerResponse } from "node:http";
import { sendJson, readJsonBody, page } from "../api/http.js";
import { ValidationError } from "../domain/errors.js";
import { ForbiddenError } from "../domain/authorization.js";
import { guardOrgRoute } from "../auth/guards.js";
import {
  billingService, billingUsageService, billingInvoiceService, billingPaymentService,
} from "../domain/billingService.js";
import {
  BillingPlanRepository, BillingSubscriptionRepository, BillingEntitlementRepository,
  BillingUsageRepository, BillingInvoiceRepository, BillingPaymentRepository,
} from "../persistence/billingRepository.js";
import { AuditRepository } from "../persistence/auditRepository.js";

const plans = new BillingPlanRepository();
const subs = new BillingSubscriptionRepository();
const ents = new BillingEntitlementRepository();
const usageRepo = new BillingUsageRepository();
const invoicesRepo = new BillingInvoiceRepository();
const paymentsRepo = new BillingPaymentRepository();
const audits = new AuditRepository();

function sanitize(row: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...row };
  delete copy.provider_customer_id;
  return copy;
}

export async function handleBillingRoutes(
  req: IncomingMessage, res: ServerResponse, cid: string, url: URL, method: string
): Promise<boolean> {
  let m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/billing\/plans$/);
  if (m && method === "GET") {
    const [, orgId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "billing.subscription.read");
    void g;
    return sendJson(res, 200, { ...page(await plans.listActive(), null, 20), correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/billing\/subscriptions$/);
  if (m && method === "POST") {
    const [, orgId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "billing.subscription.manage", "billing.subscription.manage");
    const body = await readJsonBody(req);
    if (!body.planCode || !body.idempotencyKey) throw new ValidationError("planCode and idempotencyKey required");
    const out = await billingService.subscribe(g.ctx, String(body.planCode), String(body.idempotencyKey), g.principal.subjectId);
    return sendJson(res, out.replayed ? 200 : 201, { data: sanitize(out.subscription as Record<string, unknown>), replayed: out.replayed, correlationId: cid }, cid), true;
  }
  if (m && method === "GET") {
    const [, orgId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "billing.subscription.read");
    const rows = await subs.list(g.ctx);
    return sendJson(res, 200, { ...page(rows.map(sanitize), null, 20), correlationId: cid }, cid), true;
  }
  return false;
}
export async function handleBillingTxRoutes(
  req: IncomingMessage, res: ServerResponse, cid: string, url: URL, method: string
): Promise<boolean> {
  let m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/billing\/subscriptions\/([^/]+)\/plan$/);
  if (m && method === "POST") {
    const [, orgId, subId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "billing.subscription.manage", "billing.subscription.manage");
    const body = await readJsonBody(req);
    if (!body.planCode || body.version === undefined || !body.idempotencyKey) throw new ValidationError("planCode, version, idempotencyKey required");
    const out = await billingService.changePlan(g.ctx, subId, Number(body.version), String(body.planCode), String(body.idempotencyKey), g.principal.subjectId);
    return sendJson(res, 200, { data: sanitize(out.subscription as Record<string, unknown>), replayed: out.replayed, correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/billing\/subscriptions\/([^/]+)\/transition$/);
  if (m && method === "POST") {
    const [, orgId, subId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "billing.subscription.manage", "billing.subscription.manage");
    const body = await readJsonBody(req);
    if (!body.to || body.version === undefined) throw new ValidationError("to and version required");
    const row = await billingService.transitionSubscription(g.ctx, subId, Number(body.version), String(body.to), g.principal.subjectId);
    return sendJson(res, 200, { data: sanitize(row as Record<string, unknown>), correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/billing\/subscriptions\/([^/]+)\/usage$/);
  if (m && method === "POST") {
    const [, orgId, subId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "billing.usage.record");
    const body = await readJsonBody(req);
    if (!body.featureKey || body.quantity === undefined || !body.eventKey) throw new ValidationError("featureKey, quantity, eventKey required");
    const out = await billingUsageService.record(g.ctx, subId, String(body.featureKey), Number(body.quantity), String(body.eventKey), g.principal.subjectId);
    return sendJson(res, out.duplicate ? 200 : 201, { data: out.row, duplicate: out.duplicate, correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/billing\/subscriptions\/([^/]+)\/usage$/);
  if (m && method === "GET") {
    const [, orgId, subId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "billing.subscription.read");
    const sub = await subs.findOwned(g.ctx, subId);
    if (!sub) throw new ForbiddenError("subscription not found");
    const agg = await usageRepo.aggregate(g.ctx, subId);
    return sendJson(res, 200, { data: agg, correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/billing\/entitlements$/);
  if (m && method === "GET") {
    const [, orgId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "billing.subscription.read");
    const rows = await ents.listForOrg(g.ctx);
    return sendJson(res, 200, { ...page(rows, null, 50), correlationId: cid }, cid), true;
  }
  void audits;
  return false;
}
export async function handleBillingInvoiceRoutes(
  req: IncomingMessage, res: ServerResponse, cid: string, url: URL, method: string
): Promise<boolean> {
  let m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/billing\/invoices$/);
  if (m && method === "POST") {
    const [, orgId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "billing.invoice.manage", "billing.invoice.manage");
    const body = await readJsonBody(req);
    if (!body.subscriptionId || !body.lines || body.taxMinor === undefined || !body.periodStart || !body.periodEnd || !body.idempotencyKey) {
      throw new ValidationError("subscriptionId, lines, taxMinor, periodStart, periodEnd, idempotencyKey required");
    }
    const out = await billingInvoiceService.createDraft(g.ctx, String(body.subscriptionId),
      body.lines as { description: string; quantity: number; unitAmountMinor: number }[],
      Number(body.taxMinor), String(body.periodStart), String(body.periodEnd), String(body.idempotencyKey), g.principal.subjectId);
    return sendJson(res, out.replayed ? 200 : 201, { data: out.invoice, replayed: out.replayed, correlationId: cid }, cid), true;
  }
  if (m && method === "GET") {
    const [, orgId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "billing.invoice.read");
    return sendJson(res, 200, { ...page(await invoicesRepo.list(g.ctx), null, 50), correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/billing\/invoices\/([^/]+)$/);
  if (m && method === "GET") {
    const [, orgId, invId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "billing.invoice.read");
    const inv = await invoicesRepo.findOwned(g.ctx, invId);
    if (!inv) throw new ForbiddenError("invoice not found");
    const lines = await invoicesRepo.lines(g.ctx, invId);
    return sendJson(res, 200, { data: { ...inv, lines }, correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/billing\/invoices\/([^/]+)\/transition$/);
  if (m && method === "POST") {
    const [, orgId, invId] = m;
    const body = await readJsonBody(req);
    if (!body.to || body.version === undefined) throw new ValidationError("to and version required");
    if (String(body.to) === "refunded") {
      const g2 = await guardOrgRoute(req, cid, orgId, "billing.invoice.refund", "billing.invoice.refund");
      const row = await billingInvoiceService.transition(g2.ctx, invId, Number(body.version), "refunded", g2.principal.subjectId);
      return sendJson(res, 200, { data: row, correlationId: cid }, cid), true;
    }
    const g = await guardOrgRoute(req, cid, orgId, "billing.invoice.manage", "billing.invoice.manage");
    const row = await billingInvoiceService.transition(g.ctx, invId, Number(body.version), String(body.to), g.principal.subjectId);
    return sendJson(res, 200, { data: row, correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/billing\/invoices\/([^/]+)\/payments$/);
  if (m && method === "POST") {
    const [, orgId, invId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "billing.payment.manage", "billing.payment.manage");
    const body = await readJsonBody(req);
    if (!body.idempotencyKey) throw new ValidationError("idempotencyKey required");
    const out = await billingPaymentService.charge(g.ctx, invId, String(body.idempotencyKey), g.principal.subjectId);
    return sendJson(res, out.replayed ? 200 : 201, { data: out.payment, replayed: out.replayed, correlationId: cid }, cid), true;
  }
  if (m && method === "GET") {
    const [, orgId, invId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "billing.invoice.read");
    const inv = await invoicesRepo.findOwned(g.ctx, invId);
    if (!inv) throw new ForbiddenError("invoice not found");
    return sendJson(res, 200, { ...page(await paymentsRepo.listForInvoice(g.ctx, invId), null, 20), correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/billing\/payments\/([^/]+)$/);
  if (m && method === "GET") {
    const [, orgId, payId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "billing.invoice.read");
    const pay = await paymentsRepo.findOwned(g.ctx, payId);
    if (!pay) throw new ForbiddenError("payment not found");
    return sendJson(res, 200, { data: pay, correlationId: cid }, cid), true;
  }
  return false;
}
