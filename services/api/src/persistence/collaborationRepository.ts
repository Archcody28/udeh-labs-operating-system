import { PoolClient } from "pg";
import { BaseRepository } from "./baseRepository.js";
import { TenantContext } from "../domain/tenancy.js";
import { ConflictError, NotFoundError, ValidationError } from "../domain/errors.js";

export type CommentTarget = "project" | "task" | "requirement" | "proposal" | "patch" | "review";

const TARGETS: Record<CommentTarget, { table: string; kind: "project" | "scoped" }> = {
  project: { table: "projects", kind: "project" },
  task: { table: "engineering_tasks", kind: "scoped" },
  requirement: { table: "requirements", kind: "scoped" },
  proposal: { table: "proposals", kind: "scoped" },
  patch: { table: "code_patches", kind: "scoped" },
  review: { table: "reviews", kind: "scoped" },
};

/** Decode keyset cursor {c, id} base64url. */
export function decodeCursor(cursor?: string | null): { c: string; id: string } | null {
  if (!cursor) return null;
  try {
    const raw = Buffer.from(cursor.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const v = JSON.parse(raw) as { c?: string; id?: string };
    if (typeof v.c === "string" && typeof v.id === "string") return { c: v.c, id: v.id };
    return null;
  } catch { return null; }
}

export function encodeCursor(c: string, id: string): string {
  return Buffer.from(JSON.stringify({ c, id })).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Resolve target org/project server-side. Throws on mismatch. */
export async function resolveTarget(
  q: (text: string, params: unknown[]) => Promise<{ rowCount: number; rows: Record<string, string>[] }>,
  target: CommentTarget, targetId: string, orgId: string, projectId: string
): Promise<{ organization_id: string; project_id: string }> {
  const t = TARGETS[target];
  if (!t) throw new ValidationError("invalid target_type");
  const res = await q(`SELECT organization_id, ${t.kind === "project" ? "id AS project_id" : "project_id"} FROM ${t.table} WHERE id=$1`, [targetId]);
  if (res.rowCount === 0) throw new NotFoundError(t.table);
  const row = res.rows[0];
  if (row.organization_id !== orgId) throw new ConflictError("cross-tenant comment target");
  if (row.project_id !== projectId) throw new ConflictError("target outside project");
  return { organization_id: row.organization_id, project_id: row.project_id };
}

/** Validate mentions resolve to active org members. Returns invalid ids. */
export async function invalidMentions(
  q: (text: string, params: unknown[]) => Promise<{ rows: { user_id: string }[] }>,
  orgId: string, mentions: string[]
): Promise<string[]> {
  const uniq = [...new Set(mentions.filter(Boolean))];
  if (uniq.length === 0) return [];
  if (uniq.length > 20) throw new ValidationError("too many mentions (max 20)");
  const res = await q(
    `SELECT user_id FROM memberships WHERE organization_id=$1 AND status='active' AND user_id = ANY($2)`,
    [orgId, uniq]);
  const ok = new Set(res.rows.map((r) => r.user_id));
  return uniq.filter((u) => !ok.has(u));
}

export function validateBody(body: string): string {
  const t = (body ?? "").trim();
  if (t.length < 1 || t.length > 4000) throw new ValidationError("body must be 1..4000 chars");
  return t;
}

export class CollaborationRepository extends BaseRepository {
  protected table = "comments";

  async assertParticipant(ctx: TenantContext, projectId: string, userId: string, tx?: PoolClient): Promise<void> {
    const mem = await this.query(
      "SELECT 1 FROM memberships WHERE organization_id=$1 AND user_id=$2 AND status='active'",
      [ctx.organizationId, userId], tx);
    if (mem.rowCount === 0) throw new ConflictError("assignee lacks active membership");
  }

  async listMembers(ctx: TenantContext, projectId: string, limit = 20, cursor?: string | null, tx?: PoolClient) {
    const safe = Math.min(Math.max(limit, 1), 100);
    const cur = decodeCursor(cursor);
    const args: unknown[] = [ctx.organizationId, projectId];
    let pred = "";
    if (cur) { pred = "AND (m.user_id > $3)"; args.push(cur.id); }
    args.push(safe + 1);
    const res = await this.query(
      `SELECT m.user_id, m.role, m.status,
         COALESCE(array_agg(DISTINCT g.permission) FILTER (WHERE g.status='active'), '{}') AS grants
       FROM memberships m LEFT JOIN project_grants g
         ON g.organization_id=m.organization_id AND g.user_id=m.user_id AND g.project_id=$2
       WHERE m.organization_id=$1 ${pred}
       GROUP BY m.user_id, m.role, m.status ORDER BY m.user_id LIMIT $${args.length}`,
      args, tx);
    const rows = res.rows.slice(0, safe);
    const next = res.rows.length > safe ? encodeCursor(new Date().toISOString(), String(rows[rows.length - 1].user_id)) : null;
    return { rows, nextCursor: next };
  }
}
