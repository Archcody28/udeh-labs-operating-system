import { IncomingMessage, ServerResponse } from "node:http";
import { getPool } from "../persistence/db.js";
import { OrganizationRepository } from "../persistence/tenancyRepositories.js";
import { WorkspaceRepository } from "../persistence/tenancyRepositories.js";
import { ProjectRepository } from "../persistence/projectRepository.js";
import { sendJson, readJsonBody, page } from "../api/http.js";
import { ValidationError } from "../domain/errors.js";
import { authService, authenticate, guardOrgRoute } from "../auth/guards.js";
import { isAuthenticated } from "../domain/principal.js";
import { UnauthorizedError } from "../domain/authorization.js";
import { AuditRepository } from "../persistence/auditRepository.js";
import { assertWorkspaceInOrg } from "../domain/tenant.js";

const orgs = new OrganizationRepository();
const workspaces = new WorkspaceRepository();
const projects = new ProjectRepository();
const audits = new AuditRepository();

function slugify(v: unknown): string {
  return String(v ?? "").trim().toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}

export async function handleOrgRoutes(
  req: IncomingMessage, res: ServerResponse, cid: string, url: URL, method: string
): Promise<boolean> {
  if (method === "POST" && url.pathname === "/api/v1/organizations") {
    const principal = await authenticate(req, cid);
    const body = await readJsonBody(req);
    if (!body.name || !body.slug) throw new ValidationError("name and slug required",
      [{ field: "name", issue: "required" }, { field: "slug", issue: "required" }]);
    const created = await authService.createOrganization(principal, String(body.name), slugify(body.slug), cid);
    return sendJson(res, 201, {
      data: { organization: created.org, primaryWorkspace: created.workspace }, correlationId: cid
    }, cid), true;
  }
  if (method === "GET" && url.pathname === "/api/v1/organizations") {
    const principal = await authenticate(req, cid);
    if (!isAuthenticated(principal)) throw new UnauthorizedError();
    const rows = await getPool().query(
      `SELECT o.* FROM organizations o JOIN memberships m ON m.organization_id = o.id
        WHERE m.user_id = $1 AND m.status = 'active' ORDER BY o.id LIMIT 100`, [principal.subjectId]);
    return sendJson(res, 200, { ...page(rows.rows, null, 100), correlationId: cid }, cid), true;
  }
  const m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/(workspaces|projects)$/);
  if (!m) return false;
  const [, orgId, child] = m;
  if (method === "POST" && child === "workspaces") {
    const g = await guardOrgRoute(req, cid, orgId, "workspace.create");
    const body = await readJsonBody(req);
    if (!body.name) throw new ValidationError("name required", [{ field: "name", issue: "required" }]);
    const ws = await workspaces.create(g.ctx, String(body.name), slugify(body.slug ?? body.name));
    await audits.append({ ...g.ctx, actorId: g.principal.subjectId, principalType: "human" },
      "workspace.created", "workspace", ws.id, "success", {});
    return sendJson(res, 201, { data: ws, correlationId: cid }, cid), true;
  }
  if (method === "GET" && child === "workspaces") {
    const g = await guardOrgRoute(req, cid, orgId, "workspace.read");
    return sendJson(res, 200, { ...page(await workspaces.list(g.ctx), null, 20), correlationId: cid }, cid), true;
  }
  if (method === "POST" && child === "projects") {
    const g = await guardOrgRoute(req, cid, orgId, "project.create");
    const body = await readJsonBody(req);
    if (!body.name || !body.workspaceId) throw new ValidationError("name and workspaceId required");
    const ws = await workspaces.findById(g.ctx, String(body.workspaceId));
    assertWorkspaceInOrg(ws.organization_id, orgId);
    const p = await projects.create(g.ctx, String(body.workspaceId), String(body.name), slugify(body.slug ?? body.name));
    await audits.append({ ...g.ctx, workspaceId: ws.id, actorId: g.principal.subjectId, principalType: "human" },
      "project.created", "project", p.id, "success", {});
    return sendJson(res, 201, { data: p, correlationId: cid }, cid), true;
  }
  if (method === "GET" && child === "projects") {
    const g = await guardOrgRoute(req, cid, orgId, "project.read");
    return sendJson(res, 200, { ...page(await projects.list(g.ctx), null, 20), correlationId: cid }, cid), true;
  }
  void orgs;
  return false;
}
