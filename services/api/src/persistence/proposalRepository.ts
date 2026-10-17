import { PoolClient } from "pg";
import { BaseRepository, updateWithVersion } from "./baseRepository.js";
import { TenantContext } from "../domain/tenancy.js";
import { assertTransition } from "../domain/lifecycle.js";
import { ConflictError, NotFoundError, StateTransitionError } from "../domain/errors.js";

export class ProposalRepository extends BaseRepository {
  protected table = "proposals";
  async create(ctx: TenantContext, clientRequestId: string, idem?: string, tx?: PoolClient) {
    const req = await this.query("SELECT organization_id, workspace_id FROM client_requests WHERE id=$1", [clientRequestId], tx);
    if (req.rowCount === 0) throw new NotFoundError("client_requests");
    if (req.rows[0].organization_id !== ctx.organizationId) throw new ConflictError("cross-tenant proposal");
    if (idem) {
      const hit = await this.query("SELECT * FROM proposals WHERE organization_id=$1 AND idempotency_key=$2",
        [ctx.organizationId, idem], tx);
      if (hit.rowCount) return hit.rows[0];
    }
    const res = await this.query(
      "INSERT INTO proposals(organization_id, workspace_id, client_request_id, status, idempotency_key) VALUES ($1,$2,$3,'draft',$4) RETURNING *",
      [ctx.organizationId, req.rows[0].workspace_id, clientRequestId, idem ?? null], tx);
    return res.rows[0];
  }
  async find(ctx: TenantContext, id: string, tx?: PoolClient) { return this.findByIdInOrg(id, ctx.organizationId, tx); }
  async list(ctx: TenantContext, limit = 20, tx?: PoolClient) {
    const res = await this.query("SELECT * FROM proposals WHERE organization_id=$1 ORDER BY id LIMIT $2",
      [ctx.organizationId, Math.min(Math.max(limit, 1), 100)], tx);
    return res.rows;
  }
  async transition(ctx: TenantContext, id: string, version: number, to: string, tx?: PoolClient) {
    const cur = await this.find(ctx, id, tx) as { status: string };
    assertTransition("proposal", cur.status, to);
    return updateWithVersion("proposals", id, version, { status: to }, tx);
  }
  async pinAcceptedVersion(id: string, versionId: string, tx?: PoolClient) {
    const res = await this.query("UPDATE proposals SET accepted_version_id=$2, updated_at=now() WHERE id=$1 RETURNING *",
      [id, versionId], tx);
    return res.rows[0];
  }
}
