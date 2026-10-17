import { PoolClient } from "pg";
import { BaseRepository } from "./baseRepository.js";
import { TenantContext } from "../domain/tenancy.js";

export interface ProjectGrantRow {
  id: string; organization_id: string; project_id: string; user_id: string;
  permission: string; status: string; version: number;
}

/**
 * Narrow project grants (Phase 7). Grants never cross organizations
 * (DB trigger + server check), never bypass membership (callers must hold
 * active membership; evaluation joins memberships), revoke atomically.
 */
export class ProjectGrantRepository extends BaseRepository {
  protected table = "project_grants";

  async grant(ctx: TenantContext, projectId: string, userId: string, permission: string, actorId?: string, tx?: PoolClient): Promise<ProjectGrantRow> {
    const proj = await this.query("SELECT organization_id FROM projects WHERE id = $1", [projectId], tx);
    if (proj.rowCount === 0) throw new (await import("../domain/errors.js")).NotFoundError("projects");
    if (proj.rows[0].organization_id !== ctx.organizationId) {
      throw new (await import("../domain/errors.js")).ConflictError("cross-tenant grant prohibited");
    }
    const mem = await this.query(
      "SELECT 1 FROM memberships WHERE organization_id = $1 AND user_id = $2 AND status = 'active'",
      [ctx.organizationId, userId], tx);
    if (mem.rowCount === 0) throw new (await import("../domain/errors.js")).ConflictError("grant requires active membership");
    const res = await this.query(
      `INSERT INTO project_grants(organization_id, project_id, user_id, permission, status, created_by_user_id)
        VALUES ($1,$2,$3,$4,'active',$5)
        ON CONFLICT (project_id, user_id, permission) DO UPDATE
          SET status = 'active', updated_at = now() RETURNING *`,
      [ctx.organizationId, projectId, userId, permission, actorId ?? null], tx);
    return res.rows[0] as ProjectGrantRow;
  }

  async revoke(ctx: TenantContext, projectId: string, userId: string, permission: string, tx?: PoolClient): Promise<void> {
    const res = await this.query(
      `UPDATE project_grants SET status = 'revoked', version = version + 1, updated_at = now()
        WHERE organization_id = $1 AND project_id = $2 AND user_id = $3 AND permission = $4 AND status = 'active'`,
      [ctx.organizationId, projectId, userId, permission], tx);
    if (res.rowCount === 0) throw new (await import("../domain/errors.js")).NotFoundError("project_grants");
  }

  async listActiveForUser(ctx: TenantContext, userId: string, tx?: PoolClient): Promise<ProjectGrantRow[]> {
    const res = await this.query(
      `SELECT g.* FROM project_grants g JOIN memberships m
         ON m.organization_id = g.organization_id AND m.user_id = g.user_id AND m.status = 'active'
        WHERE g.organization_id = $1 AND g.user_id = $2 AND g.status = 'active'`,
      [ctx.organizationId, userId], tx);
    return res.rows as ProjectGrantRow[];
  }
}
