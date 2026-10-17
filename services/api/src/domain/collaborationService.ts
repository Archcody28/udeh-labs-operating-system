import { PoolClient } from "pg";
import { TenantContext } from "../domain/tenancy.js";
import { updateWithVersion } from "../persistence/baseRepository.js";
import { getPool, withTransaction } from "../persistence/db.js";
import { CollaborationRepository, CommentTarget, decodeCursor, encodeCursor } from "../persistence/collaborationRepository.js";
import { AuditRepository } from "../persistence/auditRepository.js";
import { IdempotencyRepository } from "../persistence/idempotencyRepository.js";
import { ConflictError, NotFoundError } from "./errors.js";
import { assertProjectInHierarchy } from "./tenant.js";

export const collabRepos = new CollaborationRepository();
const audits = new AuditRepository();
const idem = new IdempotencyRepository();

export async function scopeCollabProject(ctx: TenantContext, projectId: string, tx?: PoolClient) {
  const r = await (tx ?? getPool()).query("SELECT organization_id, workspace_id FROM projects WHERE id=$1", [projectId]);
  if (r.rowCount === 0) throw new NotFoundError("projects");
  assertProjectInHierarchy({ organization_id: r.rows[0].organization_id, workspace_id: r.rows[0].workspace_id }, ctx.organizationId);
}

export async function recordActivity(ctx: TenantContext, projectId: string, type: string,
  targetType: string, targetId: string | null, summary: Record<string, unknown>, tx: PoolClient) {
  await tx.query(
    "INSERT INTO activity_events(organization_id, project_id, actor_user_id, event_type, target_type, target_id, summary) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [ctx.organizationId, projectId, ctx.actorId ?? null, type, targetType, targetId, JSON.stringify(summary)]);
}

export { decodeCursor, encodeCursor, audits, idem, updateWithVersion };
export type { CommentTarget };
void ConflictError;
