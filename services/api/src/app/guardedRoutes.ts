import { IncomingMessage, ServerResponse } from "node:http";
import { AuditRepository } from "../persistence/auditRepository.js";
import { MembershipRepository } from "../persistence/membershipRepository.js";
import { InvitationRepository } from "../persistence/invitationRepository.js";
import { SessionRepository } from "../persistence/sessionRepository.js";
import { sendJson, readJsonBody, page } from "../api/http.js";
import { ValidationError } from "../domain/errors.js";
import { authService, authenticate, guardOrgRoute } from "../auth/guards.js";
import { checkRateLimit, rateLimitKey, sensitiveLimiter } from "../auth/guards.js";
import { isAuthenticated } from "../domain/principal.js";
import { resolveTenantContext, assertWorkspaceInOrg } from "../domain/tenant.js";
import { assertProjectInHierarchy } from "../domain/tenant.js";
import { ForbiddenError, UnauthorizedError } from "../domain/authorization.js";
import { WorkspaceRepository } from "../persistence/tenancyRepositories.js";
import { ProjectRepository } from "../persistence/projectRepository.js";

const audits = new AuditRepository();
const memberships = new MembershipRepository();
const invitations = new InvitationRepository();
const sessions = new SessionRepository();
const workspaces = new WorkspaceRepository();
const projects = new ProjectRepository();

export async function handleGuardedRoutes(
  req: IncomingMessage, res: ServerResponse, cid: string, url: URL, method: string
): Promise<boolean> {
  const m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/(audit-events|members|invitations)$/);
  if (m) {
    const [, orgId, child] = m;
    if (method === "GET" && child === "audit-events") {
      const g = await guardOrgRoute(req, cid, orgId, "audit.read");
      return sendJson(res, 200, { ...page(await audits.list(g.ctx), null, 20), correlationId: cid }, cid), true;
    }
    if (method === "GET" && child === "members") {
      const g = await guardOrgRoute(req, cid, orgId, "member.read");
      return sendJson(res, 200, { ...page(await memberships.listForOrg(g.ctx), null, 100), correlationId: cid }, cid), true;
    }
    if (method === "POST" && child === "invitations") {
      const principal = await authenticate(req, cid);
      if (!isAuthenticated(principal)) throw new UnauthorizedError();
      resolveTenantContext(principal, orgId, cid);
      checkRateLimit(sensitiveLimiter, rateLimitKey(req, "invite"));
      const body = await readJsonBody(req);
      if (!body.email || !body.role) throw new ValidationError("email and role required");
      const out = await authService.invite(principal, orgId, String(body.email), String(body.role), cid);
      return sendJson(res, 201, { data: { invitationId: out.invitationId, token: out.token }, correlationId: cid }, cid), true;
    }
    if (method === "GET" && child === "invitations") {
      const g = await guardOrgRoute(req, cid, orgId, "member.read");
      const rows = (await invitations.listForOrg(g.ctx)).map((r) => ({
        id: r.id, email: r.email, role: r.role, status: r.status, expiresAt: r.expires_at
      }));
      return sendJson(res, 200, { ...page(rows, null, 100), correlationId: cid }, cid), true;
    }
    return false;
  }
  const mm = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/members\/([^/]+)$/);
  if (mm && method === "PATCH") {
    const [, orgId, memberId] = mm;
    const g = await guardOrgRoute(req, cid, orgId, "member.manage", "member.manage");
    const body = await readJsonBody(req);
    const target = (await memberships.listForOrg(g.ctx)).find((r) => r.user_id === memberId);
    if (!target) throw new ForbiddenError("member not found");
    let updated = target;
    if (body.role) updated = await memberships.setRole(g.ctx, memberId, String(body.role), g.principal.subjectId);
    if (body.status) {
      updated = await memberships.setStatus(g.ctx, memberId,
        updated.version as number, String(body.status), g.principal.subjectId);
    }
    if (body.role || body.status) await sessions.revokeAllForUser(memberId);
    await audits.append({ ...g.ctx, actorId: g.principal.subjectId, principalType: "human" },
      "member.updated", "membership", memberId, "success", { role: updated.role, status: updated.status });
    return sendJson(res, 200, { data: updated, correlationId: cid }, cid), true;
  }
  const wm = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/workspaces\/([^/]+)$/);
  if (wm && method === "GET") {
    const [, orgId, wsId] = wm;
    const g = await guardOrgRoute(req, cid, orgId, "workspace.read");
    const ws = await workspaces.findById(g.ctx, wsId).catch(() => null);
    if (!ws) throw new ForbiddenError("workspace not found");
    assertWorkspaceInOrg(ws.organization_id, orgId);
    return sendJson(res, 200, { data: ws, correlationId: cid }, cid), true;
  }
  const pm = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/projects\/([^/]+)$/);
  if (pm && method === "GET") {
    const [, orgId, projectId] = pm;
    const g = await guardOrgRoute(req, cid, orgId, "project.read");
    const workspaceId = url.searchParams.get("workspaceId") ?? undefined;
    const found = await projects.findById(g.ctx, projectId).catch(() => null);
    if (!found) throw new ForbiddenError("project not found");
    assertProjectInHierarchy(
      { organization_id: found.organization_id, workspace_id: found.workspace_id }, orgId, workspaceId);
    return sendJson(res, 200, { data: found, correlationId: cid }, cid), true;
  }
  return false;
}
