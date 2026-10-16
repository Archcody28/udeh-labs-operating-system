import { PoolClient } from "pg";
import { BaseRepository } from "./baseRepository.js";
import { TenantContext } from "../domain/tenancy.js";

/** Append-only audit writer. No update/delete methods by design (INV-AUD-02). */
export class AuditRepository extends BaseRepository {
  protected table = "audit_events";

  async append(
    ctx: TenantContext,
    action: string,
    targetType: string,
    targetId: string,
    result: "success" | "denied" | "failed" = "success",
    metadata: Record<string, unknown> = {},
    tx?: PoolClient
  ) {
    const res = await this.query(
      `INSERT INTO audit_events(organization_id, workspace_id, project_id, correlation_id,
        actor_id, principal_type, action, target_type, target_id, result, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [ctx.organizationId, ctx.workspaceId ?? null, ctx.projectId ?? null, ctx.correlationId,
        ctx.actorId ?? null, ctx.principalType ?? "system", action, targetType, targetId, result,
        JSON.stringify(metadata)], tx);
    return res.rows[0];
  }

  async list(ctx: TenantContext, limit = 20) {
    const safe = Math.min(Math.max(limit, 1), 100);
    const res = await this.query(
      "SELECT id, correlation_id, actor_id, principal_type, action, target_type, target_id, result, created_at FROM audit_events WHERE organization_id = $1 ORDER BY created_at DESC LIMIT $2",
      [ctx.organizationId, safe]);
    return res.rows;
  }
}
