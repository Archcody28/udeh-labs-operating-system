import { PoolClient } from "pg";
import { BaseRepository, updateWithVersion } from "./baseRepository.js";
import { TenantContext } from "../domain/tenancy.js";
import { assertTransition, validateName } from "../domain/lifecycle.js";
import { assertProjectInHierarchy } from "../domain/tenant.js";
import { ConflictError, NotFoundError, StateTransitionError } from "../domain/errors.js";

/** D-04 engineering part 1: tasks. */
export class EngineeringTaskRepository extends BaseRepository {
  protected table = "engineering_tasks";
  async create(ctx: TenantContext, projectId: string, title: string, tx?: PoolClient) {
    validateName(title, "title");
    const p = await this.query("SELECT organization_id, workspace_id FROM projects WHERE id=$1", [projectId], tx);
    if (p.rowCount === 0) throw new NotFoundError("projects");
    assertProjectInHierarchy({ organization_id: p.rows[0].organization_id, workspace_id: p.rows[0].workspace_id }, ctx.organizationId);
    const res = await this.query(
      "INSERT INTO engineering_tasks(organization_id, project_id, title, status) VALUES ($1,$2,$3,'planned') RETURNING *",
      [ctx.organizationId, projectId, title.trim()], tx);
    return res.rows[0];
  }
  async find(ctx: TenantContext, id: string, tx?: PoolClient) { return this.findByIdInOrg(id, ctx.organizationId, tx); }
  async list(ctx: TenantContext, projectId: string, limit = 50, tx?: PoolClient) {
    const res = await this.query("SELECT * FROM engineering_tasks WHERE organization_id=$1 AND project_id=$2 ORDER BY id LIMIT $3",
      [ctx.organizationId, projectId, Math.min(Math.max(limit, 1), 100)], tx);
    return res.rows;
  }
  async transition(ctx: TenantContext, id: string, version: number, to: string, tx?: PoolClient) {
    const cur = await this.find(ctx, id, tx) as { status: string };
    assertTransition("engineering_task", cur.status, to);
    return updateWithVersion("engineering_tasks", id, version, { status: to }, tx);
  }
}
