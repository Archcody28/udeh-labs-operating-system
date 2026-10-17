import { PoolClient } from "pg";
import { BaseRepository, updateWithVersion } from "./baseRepository.js";
import { TenantContext } from "../domain/tenancy.js";
import { assertProjectInHierarchy } from "../domain/tenant.js";
import { ConflictError, NotFoundError, StateTransitionError, ValidationError } from "../domain/errors.js";

/** D-04 engineering part 2: patch + review + deployment records. */
function scopeProject(projectId: string, orgId: string, row: { organization_id: string; workspace_id: string }) {
  assertProjectInHierarchy({ organization_id: row.organization_id, workspace_id: row.workspace_id }, orgId);
  void projectId;
}

export class PatchRepository extends BaseRepository {
  protected table = "code_patches";
  async create(ctx: TenantContext, projectId: string, diff: string, hash: string, tx?: PoolClient) {
    const p = await this.query("SELECT organization_id, workspace_id FROM projects WHERE id=$1", [projectId], tx);
    if (p.rowCount === 0) throw new NotFoundError("projects");
    scopeProject(projectId, ctx.organizationId, p.rows[0]);
    if (!diff || !diff.trim()) throw new ValidationError("diff required");
    const res = await this.query(
      "INSERT INTO code_patches(organization_id, project_id, diff_hash, diff, status) VALUES ($1,$2,$3,$4,'proposed') RETURNING *",
      [ctx.organizationId, projectId, hash, diff], tx);
    return res.rows[0];
  }
  async find(ctx: TenantContext, id: string, tx?: PoolClient) { return this.findByIdInOrg(id, ctx.organizationId, tx); }
  async transition(ctx: TenantContext, id: string, version: number, to: string, tx?: PoolClient) {
    const cur = await this.find(ctx, id, tx) as { status: string };
    const ok: Record<string, string[]> = { proposed: ["approved", "superseded"], approved: ["applied"], applied: [], superseded: [] };
    if (!(ok[cur.status] ?? []).includes(to)) throw new StateTransitionError(cur.status, ok[cur.status] ?? []);
    return updateWithVersion("code_patches", id, version, { status: to }, tx);
  }
}

export class ReviewRepository extends BaseRepository {
  protected table = "reviews";
  async create(ctx: TenantContext, projectId: string, patchId: string, tx?: PoolClient) {
    const patch = await this.query("SELECT organization_id, project_id FROM code_patches WHERE id=$1", [patchId], tx);
    if (patch.rowCount === 0) throw new NotFoundError("code_patches");
    if (patch.rows[0].organization_id !== ctx.organizationId) throw new ConflictError("cross-tenant review");
    if (patch.rows[0].project_id !== projectId) throw new ConflictError("patch outside project");
    const res = await this.query(
      "INSERT INTO reviews(organization_id, project_id, code_patch_id, status) VALUES ($1,$2,$3,'requested') RETURNING *",
      [ctx.organizationId, projectId, patchId], tx);
    return res.rows[0];
  }
  async find(ctx: TenantContext, id: string, tx?: PoolClient) { return this.findByIdInOrg(id, ctx.organizationId, tx); }
  async decide(ctx: TenantContext, id: string, version: number, to: string, note: string, actorId: string, tx?: PoolClient) {
    const cur = await this.find(ctx, id, tx) as { status: string };
    const ok: Record<string, string[]> = { requested: ["approved", "changes_requested"], approved: [], changes_requested: [] };
    if (!(ok[cur.status] ?? []).includes(to)) throw new StateTransitionError(cur.status, ok[cur.status] ?? []);
    return updateWithVersion("reviews", id, version, { status: to, decided_by_user_id: actorId, decided_at: new Date().toISOString(), note: note ?? "" }, tx);
  }
}

export class DeploymentRepository extends BaseRepository {
  protected table = "deployments";
  async create(ctx: TenantContext, projectId: string, idem: string | undefined, tx?: PoolClient) {
    const p = await this.query("SELECT organization_id, workspace_id FROM projects WHERE id=$1", [projectId], tx);
    if (p.rowCount === 0) throw new NotFoundError("projects");
    assertProjectInHierarchy({ organization_id: p.rows[0].organization_id, workspace_id: p.rows[0].workspace_id }, ctx.organizationId);
    if (idem) {
      const hit = await this.query("SELECT * FROM deployments WHERE organization_id=$1 AND idempotency_key=$2",
        [ctx.organizationId, idem], tx);
      if (hit.rowCount) return hit.rows[0];
    }
    const res = await this.query(
      "INSERT INTO deployments(organization_id, project_id, status, idempotency_key) VALUES ($1,$2,'triggered',$3) RETURNING *",
      [ctx.organizationId, projectId, idem ?? null], tx);
    return res.rows[0];
  }
  async find(ctx: TenantContext, id: string, tx?: PoolClient) { return this.findByIdInOrg(id, ctx.organizationId, tx); }
}
