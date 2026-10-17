import { PoolClient } from "pg";
import { BaseRepository, updateWithVersion } from "./baseRepository.js";
import { TenantContext } from "../domain/tenancy.js";
import { assertTransition, validateName } from "../domain/lifecycle.js";
import { assertWorkspaceInOrg } from "../domain/tenant.js";
import { ConflictError, NotFoundError, StateTransitionError } from "../domain/errors.js";

/** D-03 commercial part 1: ClientRequest + Requirement. */
export class ClientRequestRepository extends BaseRepository {
  protected table = "client_requests";
  async create(ctx: TenantContext, workspaceId: string, title: string, idem?: string, tx?: PoolClient) {
    validateName(title, "title");
    const ws = await this.query("SELECT organization_id FROM workspaces WHERE id=$1", [workspaceId], tx);
    if (ws.rowCount === 0) throw new NotFoundError("workspaces");
    assertWorkspaceInOrg(ws.rows[0].organization_id, ctx.organizationId);
    if (idem) {
      const hit = await this.query("SELECT * FROM client_requests WHERE organization_id=$1 AND idempotency_key=$2",
        [ctx.organizationId, idem], tx);
      if (hit.rowCount) return hit.rows[0];
    }
    const res = await this.query(
      "INSERT INTO client_requests(organization_id, workspace_id, title, status, requester_user_id, idempotency_key) VALUES ($1,$2,$3,'submitted',$4,$5) RETURNING *",
      [ctx.organizationId, workspaceId, title.trim(), ctx.actorId ?? null, idem ?? null], tx);
    return res.rows[0];
  }
  async find(ctx: TenantContext, id: string, tx?: PoolClient) {
    return this.findByIdInOrg(id, ctx.organizationId, tx);
  }
  async list(ctx: TenantContext, workspaceId?: string, status?: string, limit = 20, tx?: PoolClient) {
    const conds = ["organization_id=$1"]; const args: unknown[] = [ctx.organizationId];
    if (workspaceId) { conds.push(`workspace_id=$${args.length + 1}`); args.push(workspaceId); }
    if (status) { conds.push(`status=$${args.length + 1}`); args.push(status); }
    args.push(Math.min(Math.max(limit, 1), 100));
    const res = await this.query(`SELECT * FROM client_requests WHERE ${conds.join(" AND ")} ORDER BY id LIMIT $${args.length}`, args, tx);
    return res.rows;
  }
  async transition(ctx: TenantContext, id: string, version: number, to: string, tx?: PoolClient) {
    const cur = await this.find(ctx, id, tx) as { status: string };
    assertTransition("client_request", cur.status, to);
    return updateWithVersion("client_requests", id, version, { status: to }, tx);
  }
}

export class RequirementRepository extends BaseRepository {
  protected table = "requirements";
  async create(ctx: TenantContext, workspaceId: string, clientRequestId: string, title: string, body = "", priority = "medium", tx?: PoolClient) {
    validateName(title, "title");
    const req = await this.query("SELECT organization_id FROM client_requests WHERE id=$1", [clientRequestId], tx);
    if (req.rowCount === 0) throw new NotFoundError("client_requests");
    if (req.rows[0].organization_id !== ctx.organizationId) throw new ConflictError("cross-tenant requirement");
    const res = await this.query(
      "INSERT INTO requirements(organization_id, workspace_id, client_request_id, title, body, priority, status) VALUES ($1,$2,$3,$4,$5,$6,'draft') RETURNING *",
      [ctx.organizationId, workspaceId, clientRequestId, title.trim(), body, priority], tx);
    return res.rows[0];
  }
  async find(ctx: TenantContext, id: string, tx?: PoolClient) { return this.findByIdInOrg(id, ctx.organizationId, tx); }
  async list(ctx: TenantContext, clientRequestId: string, limit = 50, tx?: PoolClient) {
    const res = await this.query("SELECT * FROM requirements WHERE organization_id=$1 AND client_request_id=$2 ORDER BY id LIMIT $3",
      [ctx.organizationId, clientRequestId, Math.min(Math.max(limit, 1), 100)], tx);
    return res.rows;
  }
  async accept(ctx: TenantContext, id: string, version: number, tx?: PoolClient) {
    const cur = await this.find(ctx, id, tx) as { status: string };
    assertTransition("requirement", cur.status, "accepted");
    return updateWithVersion("requirements", id, version, { status: "accepted" }, tx);
  }
}
