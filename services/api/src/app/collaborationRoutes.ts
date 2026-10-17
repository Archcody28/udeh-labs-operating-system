import { IncomingMessage, ServerResponse } from "node:http";
import { sendJson, readJsonBody } from "../api/http.js";
import { ValidationError } from "../domain/errors.js";
import { guardOrgRoute } from "../auth/guards.js";
import { canInOrg } from "../domain/authorization.js";
import { getPool, withTransaction } from "../persistence/db.js";
import { decodeCursor, encodeCursor } from "../persistence/collaborationRepository.js";
import { audits, collabRepos, recordActivity, scopeCollabProject, updateWithVersion } from "../domain/collaborationService.js";
import { collaborationOps } from "../domain/collaborationOps.js";
import { ConflictError, NotFoundError } from "../domain/errors.js";

function idemKey(req: IncomingMessage, body: Record<string, unknown>): string | undefined {
  const h = req.headers["idempotency-key"];
  const v = Array.isArray(h) ? h[0] : h;
  const k = (v ?? (body.idempotencyKey as string | undefined))?.trim();
  return k ? k.slice(0, 200) : undefined;
}
export async function handleCollaborationRoutes(
  req: IncomingMessage, res: ServerResponse, cid: string, url: URL, method: string
): Promise<boolean> {
  let m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/projects\/([^/]+)\/members$/);
  if (m && method === "GET") {
    const [, orgId, projectId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "project.read");
    await scopeCollabProject(g.ctx, projectId);
    const out = await collabRepos.listMembers(g.ctx, projectId,
      Number(url.searchParams.get("limit") ?? 20), url.searchParams.get("cursor"));
    return sendJson(res, 200, { data: out.rows, page: { nextCursor: out.nextCursor, limit: 20 }, correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/projects\/([^/]+)\/tasks\/([^/]+)\/assign$/);
  if (m && method === "POST") {
    const [, orgId, projectId, taskId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "engineering.task.assign");
    const body = await readJsonBody(req);
    const assignee = body.assigneeUserId === null || body.assigneeUserId === undefined ? null : String(body.assigneeUserId);
    const out = await collaborationOps.assignTask(g.ctx, projectId, taskId, assignee,
      g.principal.subjectId, idemKey(req, body),
      body.version === undefined ? undefined : Number(body.version));
    return sendJson(res, 200, { data: out, correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/projects\/([^/]+)\/comments$/);
  if (m && method === "POST") {
    const [, orgId, projectId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "collaboration.comment.create");
    const body = await readJsonBody(req);
    if (!body.targetType || !body.targetId || body.body === undefined) throw new ValidationError("targetType, targetId, body required");
    const allowed = ["project", "task", "requirement", "proposal", "patch", "review"];
    if (!allowed.includes(String(body.targetType))) throw new ValidationError("invalid targetType");
    const mentions = Array.isArray(body.mentions) ? body.mentions.map(String) : [];
    const out = await collaborationOps.createComment(g.ctx, projectId,
      String(body.targetType) as never, String(body.targetId), String(body.body),
      mentions, g.principal.subjectId, idemKey(req, body));
    return sendJson(res, 201, { data: out, correlationId: cid }, cid), true;
  }
  if (m && method === "GET") {
    const [, orgId, projectId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "collaboration.comment.read");
    await scopeCollabProject(g.ctx, projectId);
    const safe = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20), 1), 100);
    const cur = decodeCursor(url.searchParams.get("cursor"));
    const conds = ["organization_id=$1", "project_id=$2", "status <> 'archived'"];
    const args: unknown[] = [g.ctx.organizationId, projectId];
    const tt = url.searchParams.get("targetType");
    const ti = url.searchParams.get("targetId");
    if (tt) { conds.push(`target_type=$${args.length + 1}`); args.push(tt); }
    if (ti) { conds.push(`target_id=$${args.length + 1}`); args.push(ti); }
    if (cur) {
      conds.push(`(created_at, id) < (to_timestamp($${args.length + 1}), $${args.length + 2}::uuid)`);
      args.push(new Date(cur.c).getTime() / 1000, cur.id);
    }
    args.push(safe + 1);
    const r = await getPool().query(
      `SELECT * FROM comments WHERE ${conds.join(" AND ")} ORDER BY created_at DESC, id DESC LIMIT $${args.length}`, args);
    const rows = r.rows.slice(0, safe);
    const next = r.rows.length > safe
      ? encodeCursor(new Date(rows[rows.length - 1].created_at).toISOString(), String(rows[rows.length - 1].id)) : null;
    return sendJson(res, 200, { data: rows, page: { nextCursor: next, limit: safe }, correlationId: cid }, cid), true;
  }
  return false;
}

export async function handleCollaborationTx(
  req: IncomingMessage, res: ServerResponse, cid: string, url: URL, method: string
): Promise<boolean> {
  let m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/projects\/([^/]+)\/comments\/([^/]+)$/);
  if (m && (method === "PATCH" || method === "DELETE")) {
    const [, orgId, projectId, id] = m;
    const g = await guardOrgRoute(req, cid, orgId, "collaboration.comment.update");
    const body = method === "PATCH" ? await readJsonBody(req) : {};
    if (body.version === undefined) throw new ValidationError("version required");
    if (method === "PATCH") {
      if (body.body === undefined) throw new ValidationError("body required");
      const privileged = canInOrg(g.principal, orgId, "member.update");
      const out = await collaborationOps.editComment(g.ctx, projectId, id, Number(body.version),
        String(body.body), g.principal.subjectId, privileged);
      return sendJson(res, 200, { data: out, correlationId: cid }, cid), true;
    }
    const out = await withTransaction(async (tx) => {
      const cur = await tx.query("SELECT * FROM comments WHERE id=$1 AND organization_id=$2", [id, g.ctx.organizationId]);
      if (cur.rowCount === 0) throw new NotFoundError("comments");
      if (cur.rows[0].project_id !== projectId) throw new ConflictError("comment outside project");
      const row = await updateWithVersion("comments", id, Number(body.version), { status: "archived" }, tx);
      await recordActivity(g.ctx, projectId, "comment.archived", "comment", id, {}, tx);
      await audits.append({ ...g.ctx, projectId, actorId: g.principal.subjectId, principalType: "human" },
        "comment.archived", "comment", id, "success", {}, tx);
      return row;
    });
    return sendJson(res, 200, { data: out, correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/projects\/([^/]+)\/activity$/);
  if (m && method === "GET") {
    const [, orgId, projectId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "collaboration.activity.read");
    await scopeCollabProject(g.ctx, projectId);
    const safe = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20), 1), 100);
    const cur = decodeCursor(url.searchParams.get("cursor"));
    const conds = ["organization_id=$1", "project_id=$2"];
    const args: unknown[] = [g.ctx.organizationId, projectId];
    const t = url.searchParams.get("type");
    if (t) { conds.push(`event_type=$${args.length + 1}`); args.push(t); }
    if (cur) {
      conds.push(`(created_at, id) < (to_timestamp($${args.length + 1}), $${args.length + 2}::uuid)`);
      args.push(new Date(cur.c).getTime() / 1000, cur.id);
    }
    args.push(safe + 1);
    const r = await getPool().query(
      `SELECT id, event_type, target_type, target_id, actor_user_id, summary, created_at FROM activity_events WHERE ${conds.join(" AND ")} ORDER BY created_at DESC, id DESC LIMIT $${args.length}`, args);
    const rows = r.rows.slice(0, safe);
    const next = r.rows.length > safe
      ? encodeCursor(new Date(rows[rows.length - 1].created_at).toISOString(), String(rows[rows.length - 1].id)) : null;
    return sendJson(res, 200, { data: rows, page: { nextCursor: next, limit: safe }, correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/projects\/([^/]+)\/delivery-summary$/);
  if (m && method === "GET") {
    const [, orgId, projectId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "project.read");
    await scopeCollabProject(g.ctx, projectId);
    const r = await getPool().query(
      "SELECT id, status, assignee_user_id, updated_at FROM engineering_tasks WHERE organization_id=$1 AND project_id=$2 ORDER BY updated_at DESC LIMIT 200",
      [g.ctx.organizationId, projectId]);
    const by = (s: string) => r.rows.filter((x: { status: string }) => x.status === s).length;
    return sendJson(res, 200, {
      data: {
        projectId,
        totals: { planned: by("planned"), inProgress: by("in_progress"), inReview: by("in_review"), done: by("done") },
        assignedToMe: r.rows.filter((x: { assignee_user_id: string }) => x.assignee_user_id === g.principal.subjectId).length,
        unassigned: r.rows.filter((x: { assignee_user_id: string }) => !x.assignee_user_id).length,
        recentlyUpdated: r.rows.slice(0, 10),
      }, correlationId: cid,
    }, cid), true;
  }
  return false;
}

