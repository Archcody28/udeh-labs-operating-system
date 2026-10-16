import { PoolClient } from "pg";
import { BaseRepository } from "./baseRepository.js";
import { validateName } from "../domain/lifecycle.js";
import { TenantContext } from "../domain/tenancy.js";

export interface Project { id: string; organization_id: string; workspace_id: string; name: string; slug: string; status: string; version: number; }

export class ProjectRepository extends BaseRepository {
  protected table = "projects";

  async create(ctx: TenantContext, workspaceId: string, name: string, slug: string, tx?: PoolClient): Promise<Project> {
    validateName(name);
    const ws = await this.query("SELECT organization_id FROM workspaces WHERE id = $1", [workspaceId], tx);
    if (ws.rowCount === 0) throw new (await import("../domain/errors.js")).NotFoundError("workspaces");
    if (ws.rows[0].organization_id !== ctx.organizationId) {
      throw new (await import("../domain/errors.js")).ConflictError("cross-tenant project creation prohibited (INV-TEN-02)");
    }
    const res = await this.query(
      "INSERT INTO projects(organization_id, workspace_id, name, slug) VALUES ($1,$2,$3,$4) RETURNING *",
      [ctx.organizationId, workspaceId, name.trim(), slug.trim().toLowerCase()], tx);
    return res.rows[0] as Project;
  }

  async findById(ctx: TenantContext, id: string, tx?: PoolClient): Promise<Project> {
    return this.findByIdInOrg<Project>(id, ctx.organizationId, tx);
  }

  async list(ctx: TenantContext, limit = 20): Promise<Project[]> {
    const safe = Math.min(Math.max(limit, 1), 100);
    const res = await this.query("SELECT * FROM projects WHERE organization_id = $1 ORDER BY id LIMIT $2",
      [ctx.organizationId, safe]);
    return res.rows as Project[];
  }
}
