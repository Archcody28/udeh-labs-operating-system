import { IncomingMessage, ServerResponse } from "node:http";
import { sendJson, readJsonBody, page } from "../api/http.js";
import { ValidationError } from "../domain/errors.js";
import { guardOrgRoute } from "../auth/guards.js";
import { assertProjectInHierarchy } from "../domain/tenant.js";
import { ProjectRepository } from "../persistence/projectRepository.js";
import { tasks, patches, reviews, deployments, engineeringService, diffHash } from "../domain/engineeringService.js";
import { AuditRepository } from "../persistence/auditRepository.js";
import { getPool } from "../persistence/db.js";

const projects = new ProjectRepository();
const audits = new AuditRepository();

async function scopeProject(orgId: string, projectId: string) {
  const pool = getPool();
  const r = await pool.query("SELECT organization_id, workspace_id FROM projects WHERE id=$1", [projectId]);
  if (r.rowCount === 0) throw new ValidationError("project not found");
  assertProjectInHierarchy({ organization_id: r.rows[0].organization_id, workspace_id: r.rows[0].workspace_id }, orgId);
}

export async function handleEngineeringRoutes(
  req: IncomingMessage, res: ServerResponse, cid: string, url: URL, method: string
): Promise<boolean> {
  let m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/projects\/([^/]+)\/tasks$/);
  if (m) {
    const [, orgId, projectId] = m;
    if (method === "POST") {
      const g = await guardOrgRoute(req, cid, orgId, "engineering.task.create");
      await scopeProject(orgId, projectId);
      const body = await readJsonBody(req);
      if (!body.title) throw new ValidationError("title required");
      const row = await tasks.create(g.ctx, projectId, String(body.title));
      await audits.append({ ...g.ctx, projectId, actorId: g.principal.subjectId, principalType: "human" },
        "task.created", "engineering_task", row.id, "success", {});
      return sendJson(res, 201, { data: row, correlationId: cid }, cid), true;
    }
    if (method === "GET") {
      const g = await guardOrgRoute(req, cid, orgId, "engineering.task.read");
      await scopeProject(orgId, projectId);
      return sendJson(res, 200, { ...page(await tasks.list(g.ctx, projectId), null, 50), correlationId: cid }, cid), true;
    }
    return false;
  }
  return false;
}
