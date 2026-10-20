/** Integration routes under /api/v1. Tenant-scoped, permission-gated. */
import { IncomingMessage, ServerResponse } from "node:http";
import { sendJson, readJsonBody, page } from "../api/http.js";
import { ValidationError } from "../domain/errors.js";
import { guardOrgRoute } from "../auth/guards.js";
import { ForbiddenError } from "../domain/authorization.js";
import { integrationService } from "../domain/integrationService.js";
import { integrationLifecycle } from "../domain/integrationLifecycle.js";

function orgOf(req: IncomingMessage, body?: Record<string, unknown>): string | null {
  const q = req.url ? new URL(req.url, "http://localhost").searchParams.get("organizationId") : null;
  if (q) return q;
  return body?.organizationId ? String(body.organizationId) : null;
}

export async function handleIntegrationRoutes(req: IncomingMessage, res: ServerResponse, cid: string, url: URL, method: string): Promise<boolean> {
  if (method === "POST" && url.pathname === "/api/v1/integrations") {
    const body = await readJsonBody(req);
    const orgId = orgOf(req, body);
    if (!orgId) throw new ForbiddenError("organization context required");
    const g = await guardOrgRoute(req, cid, orgId, "integration.connect");
    if (!body.kind) throw new ValidationError("kind required");
    const row = await integrationService.create(g.ctx, String(body.kind), body.config ?? {});
    return sendJson(res, 201, { data: row, correlationId: cid }, cid), true;
  }
  if (method === "GET" && url.pathname === "/api/v1/integrations") {
    const orgId = orgOf(req);
    if (!orgId) throw new ForbiddenError("organization context required");
    const g = await guardOrgRoute(req, cid, orgId, "integration.read");
    return sendJson(res, 200, { ...page(await integrationService.list(g.ctx), null, 100), correlationId: cid }, cid), true;
  }
  const m = url.pathname.match(/^\/api\/v1\/integrations\/([^/]+)(\/(connect|disconnect|accounts|repositories|repository-links))?$/);
  if (!m) return false;
  const [, id, suffix] = m;
  if (method === "GET" && !suffix) {
    const orgId = orgOf(req);
    if (!orgId) throw new ForbiddenError("organization context required");
    const g = await guardOrgRoute(req, cid, orgId, "integration.read");
    return sendJson(res, 200, { data: await integrationService.get(g.ctx, id), correlationId: cid }, cid), true;
  }
  if (method === "GET" && suffix === "/accounts") {
    const orgId = orgOf(req);
    if (!orgId) throw new ForbiddenError("organization context required");
    const g = await guardOrgRoute(req, cid, orgId, "integration.read");
    return sendJson(res, 200, { ...page(await integrationLifecycle.accounts(g.ctx, id), null, 100), correlationId: cid }, cid), true;
  }
  if (method === "GET" && suffix === "/repositories") {
    const orgId = orgOf(req);
    if (!orgId) throw new ForbiddenError("organization context required");
    const g = await guardOrgRoute(req, cid, orgId, "integration.read");
    const inst = url.searchParams.get("installationId");
    if (!inst) throw new ValidationError("installationId required");
    return sendJson(res, 200, { ...page(await integrationLifecycle.repositories(g.ctx, id, inst), null, 30), correlationId: cid }, cid), true;
  }
  if (method === "POST" && suffix === "/connect") {
    const body = await readJsonBody(req);
    const orgId = orgOf(req, body);
    if (!orgId) throw new ForbiddenError("organization context required");
    const g = await guardOrgRoute(req, cid, orgId, "integration.connect");
    if (body.version == null || !body.installationId) throw new ValidationError("version and installationId required");
    const row = await integrationLifecycle.connect(g.ctx, id, Number(body.version), String(body.installationId));
    return sendJson(res, 200, { data: row, correlationId: cid }, cid), true;
  }
  if (method === "POST" && suffix === "/disconnect") {
    const body = await readJsonBody(req);
    const orgId = orgOf(req, body);
    if (!orgId) throw new ForbiddenError("organization context required");
    const g = await guardOrgRoute(req, cid, orgId, "integration.disconnect");
    if (body.version == null) throw new ValidationError("version required");
    const to = String(body.status ?? "disconnected") === "revoked" ? "revoked" : "disconnected";
    const row = await integrationLifecycle.disconnect(g.ctx, id, Number(body.version), to as never);
    return sendJson(res, 200, { data: row, correlationId: cid }, cid), true;
  }
  if (method === "POST" && suffix === "/repository-links") {
    const body = await readJsonBody(req);
    const orgId = orgOf(req, body);
    if (!orgId) throw new ForbiddenError("organization context required");
    const g = await guardOrgRoute(req, cid, orgId, "repository.link");
    if (!body.projectId || !body.providerResourceId) throw new ValidationError("projectId and providerResourceId required");
    const out = await integrationLifecycle.linkRepository(g.ctx, String(body.projectId), id, {
      provider: "github", pid: String(body.providerResourceId),
      owner: String(body.owner ?? ""), name: String(body.name ?? ""),
    });
    return sendJson(res, 201, { data: out.link, correlationId: cid }, cid), true;
  }
  return false;
}
