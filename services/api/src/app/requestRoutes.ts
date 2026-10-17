import { IncomingMessage, ServerResponse } from "node:http";
import { sendJson, readJsonBody, page } from "../api/http.js";
import { ValidationError } from "../domain/errors.js";
import { guardOrgRoute } from "../auth/guards.js";
import { assertWorkspaceInOrg } from "../domain/tenant.js";
import { WorkspaceRepository } from "../persistence/tenancyRepositories.js";
import { ClientRequestRepository, RequirementRepository } from "../persistence/commercialRepositories.js";
import { AuditRepository } from "../persistence/auditRepository.js";

const workspaces = new WorkspaceRepository();
const requests = new ClientRequestRepository();
const requirements = new RequirementRepository();
const audits = new AuditRepository();

export function idemOf(url: URL, body: Record<string, unknown>): string | undefined {
  const h = url.searchParams.get("idempotencyKey") ?? (body.idempotencyKey as string | undefined);
  return h && String(h).trim() ? String(h).trim().slice(0, 200) : undefined;
}

export async function handleRequestRoutes(
  req: IncomingMessage, res: ServerResponse, cid: string, url: URL, method: string
): Promise<boolean> {
  let m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/client-requests$/);
  if (m) {
    const [, orgId] = m;
    if (method === "POST") {
      const g = await guardOrgRoute(req, cid, orgId, "commercial.request.create");
      const body = await readJsonBody(req);
      if (!body.title || !body.workspaceId) throw new ValidationError("title and workspaceId required");
      const ws = await workspaces.findById(g.ctx, String(body.workspaceId));
      assertWorkspaceInOrg(ws.organization_id, orgId);
      const row = await requests.create(g.ctx, ws.id, String(body.title), idemOf(url, body));
      await audits.append({ ...g.ctx, workspaceId: ws.id, actorId: g.principal.subjectId, principalType: "human" },
        "request.created", "client_request", row.id, "success", {});
      return sendJson(res, 201, { data: row, correlationId: cid }, cid), true;
    }
    if (method === "GET") {
      const g = await guardOrgRoute(req, cid, orgId, "commercial.request.read");
      const rows = await requests.list(g.ctx, url.searchParams.get("workspaceId") ?? undefined,
        url.searchParams.get("status") ?? undefined, 20);
      return sendJson(res, 200, { ...page(rows, null, 20), correlationId: cid }, cid), true;
    }
    return false;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/client-requests\/([^/]+)$/);
  if (m && method === "GET") {
    const [, orgId, id] = m;
    const g = await guardOrgRoute(req, cid, orgId, "commercial.request.read");
    return sendJson(res, 200, { data: await requests.find(g.ctx, id), correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/client-requests\/([^/]+)\/transition$/);
  if (m && method === "POST") {
    const [, orgId, id] = m;
    const g = await guardOrgRoute(req, cid, orgId, "commercial.request.update");
    const body = await readJsonBody(req);
    if (!body.to || body.version === undefined) throw new ValidationError("to and version required");
    const row = await requests.transition(g.ctx, id, Number(body.version), String(body.to));
    await audits.append({ ...g.ctx, actorId: g.principal.subjectId, principalType: "human" },
      "request.transitioned", "client_request", id, "success", { to: body.to });
    return sendJson(res, 200, { data: row, correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/requirements$/);
  if (m) {
    const [, orgId] = m;
    if (method === "POST") {
      const g = await guardOrgRoute(req, cid, orgId, "commercial.requirement.create");
      const body = await readJsonBody(req);
      if (!body.title || !body.clientRequestId || !body.workspaceId) throw new ValidationError("title, clientRequestId, workspaceId required");
      const ws = await workspaces.findById(g.ctx, String(body.workspaceId));
      assertWorkspaceInOrg(ws.organization_id, orgId);
      const row = await requirements.create(g.ctx, ws.id, String(body.clientRequestId),
        String(body.title), String(body.body ?? ""), String(body.priority ?? "medium"));
      await audits.append({ ...g.ctx, workspaceId: ws.id, actorId: g.principal.subjectId, principalType: "human" },
        "requirement.created", "requirement", row.id, "success", {});
      return sendJson(res, 201, { data: row, correlationId: cid }, cid), true;
    }
    if (method === "GET") {
      const g = await guardOrgRoute(req, cid, orgId, "commercial.requirement.read");
      const cr = url.searchParams.get("clientRequestId");
      if (!cr) throw new ValidationError("clientRequestId required");
      return sendJson(res, 200, { ...page(await requirements.list(g.ctx, cr), null, 50), correlationId: cid }, cid), true;
    }
    return false;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/requirements\/([^/]+)\/accept$/);
  if (m && method === "POST") {
    const [, orgId, id] = m;
    const g = await guardOrgRoute(req, cid, orgId, "commercial.requirement.update");
    const body = await readJsonBody(req);
    if (body.version === undefined) throw new ValidationError("version required");
    const row = await requirements.accept(g.ctx, id, Number(body.version));
    await audits.append({ ...g.ctx, actorId: g.principal.subjectId, principalType: "human" },
      "requirement.accepted", "requirement", id, "success", {});
    return sendJson(res, 200, { data: row, correlationId: cid }, cid), true;
  }
  return false;
}
