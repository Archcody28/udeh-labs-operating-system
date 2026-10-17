import { IncomingMessage, ServerResponse } from "node:http";
import { sendJson, readJsonBody } from "../api/http.js";
import { ValidationError } from "../domain/errors.js";
import { guardOrgRoute } from "../auth/guards.js";
import { assertProjectInHierarchy } from "../domain/tenant.js";
import { tasks, patches, reviews, deployments, engineeringService, diffHash } from "../domain/engineeringService.js";
import { AuditRepository } from "../persistence/auditRepository.js";
import { getPool } from "../persistence/db.js";

const audits = new AuditRepository();

async function scopeProject(orgId: string, projectId: string) {
  const r = await getPool().query("SELECT organization_id, workspace_id FROM projects WHERE id=$1", [projectId]);
  if (r.rowCount === 0) throw new ValidationError("project not found");
  assertProjectInHierarchy({ organization_id: r.rows[0].organization_id, workspace_id: r.rows[0].workspace_id }, orgId);
}

export async function handleEngineeringTxRoutes(
  req: IncomingMessage, res: ServerResponse, cid: string, url: URL, method: string
): Promise<boolean> {
  let m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/tasks\/([^/]+)\/transition$/);
  if (m && method === "POST") {
    const [, orgId, id] = m;
    const g = await guardOrgRoute(req, cid, orgId, "engineering.task.update");
    const body = await readJsonBody(req);
    if (!body.to || body.version === undefined) throw new ValidationError("to and version required");
    const row = await tasks.transition(g.ctx, id, Number(body.version), String(body.to));
    await audits.append({ ...g.ctx, actorId: g.principal.subjectId, principalType: "human" },
      "task.transitioned", "engineering_task", id, "success", { to: body.to });
    return sendJson(res, 200, { data: row, correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/projects\/([^/]+)\/patches$/);
  if (m && method === "POST") {
    const [, orgId, projectId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "engineering.patch.create");
    await scopeProject(orgId, projectId);
    const body = await readJsonBody(req);
    if (!body.diff) throw new ValidationError("diff required");
    const row = await patches.create(g.ctx, projectId, String(body.diff), diffHash(String(body.diff)));
    await audits.append({ ...g.ctx, projectId, actorId: g.principal.subjectId, principalType: "human" },
      "patch.created", "code_patch", row.id, "success", {});
    return sendJson(res, 201, { data: row, correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/projects\/([^/]+)\/reviews$/);
  if (m && method === "POST") {
    const [, orgId, projectId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "engineering.review.create");
    await scopeProject(orgId, projectId);
    const body = await readJsonBody(req);
    if (!body.patchId) throw new ValidationError("patchId required");
    const row = await reviews.create(g.ctx, projectId, String(body.patchId));
    await audits.append({ ...g.ctx, projectId, actorId: g.principal.subjectId, principalType: "human" },
      "review.requested", "review", row.id, "success", {});
    return sendJson(res, 201, { data: row, correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/reviews\/([^/]+)\/decide$/);
  if (m && method === "POST") {
    const [, orgId, id] = m;
    const g = await guardOrgRoute(req, cid, orgId, "engineering.review.decide");
    const body = await readJsonBody(req);
    if (body.patchVersion === undefined || body.reviewVersion === undefined || !body.patchId || !body.projectId) {
      throw new ValidationError("projectId, patchId, patchVersion, reviewVersion required");
    }
    await scopeProject(orgId, String(body.projectId));
    const out = await engineeringService.approvePatch(g.ctx, String(body.projectId), String(body.patchId),
      id, Number(body.patchVersion), Number(body.reviewVersion), String(body.note ?? ""), g.principal.subjectId);
    return sendJson(res, 200, { data: out, correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/projects\/([^/]+)\/deployments$/);
  if (m && method === "POST") {
    const [, orgId, projectId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "deployment.create", "deployment.create");
    await scopeProject(orgId, projectId);
    const body = await readJsonBody(req);
    const key = body.idempotencyKey ? String(body.idempotencyKey) : undefined;
    const row = await deployments.create(g.ctx, projectId, key);
    await audits.append({ ...g.ctx, projectId, actorId: g.principal.subjectId, principalType: "human" },
      "deployment.triggered", "deployment", row.id, "success", {});
    return sendJson(res, 201, { data: row, correlationId: cid }, cid), true;
  }
  return false;
}
