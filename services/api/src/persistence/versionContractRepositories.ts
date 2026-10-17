import { PoolClient } from "pg";
import { BaseRepository, updateWithVersion } from "./baseRepository.js";
import { TenantContext } from "../domain/tenancy.js";
import { assertTransition } from "../domain/lifecycle.js";
import { ConflictError, NotFoundError, StateTransitionError } from "../domain/errors.js";

export class ProposalVersionRepository extends BaseRepository {
  protected table = "proposal_versions";
  async createVersion(ctx: TenantContext, proposalId: string, body: unknown, hash: string, tx?: PoolClient) {
    const p = await this.query("SELECT organization_id FROM proposals WHERE id=$1", [proposalId], tx);
    if (p.rowCount === 0) throw new NotFoundError("proposals");
    if (p.rows[0].organization_id !== ctx.organizationId) throw new ConflictError("cross-tenant version");
    const n = await this.query("SELECT COALESCE(MAX(version_no),0)+1 AS n FROM proposal_versions WHERE proposal_id=$1", [proposalId], tx);
    const res = await this.query(
      "INSERT INTO proposal_versions(organization_id, proposal_id, version_no, content_hash, body, status) VALUES ($1,$2,$3,$4,$5,'draft') RETURNING *",
      [ctx.organizationId, proposalId, n.rows[0].n, hash, JSON.stringify(body ?? {})], tx);
    return res.rows[0];
  }
  async list(ctx: TenantContext, proposalId: string, tx?: PoolClient) {
    const res = await this.query("SELECT * FROM proposal_versions WHERE organization_id=$1 AND proposal_id=$2 ORDER BY version_no",
      [ctx.organizationId, proposalId], tx);
    return res.rows;
  }
  async find(ctx: TenantContext, id: string, tx?: PoolClient) { return this.findByIdInOrg(id, ctx.organizationId, tx); }
  async send(ctx: TenantContext, id: string, version: number, tx?: PoolClient) {
    const cur = await this.find(ctx, id, tx) as { status: string };
    assertTransition("proposal_version", cur.status, "sent");
    return updateWithVersion("proposal_versions", id, version, { status: "sent" }, tx);
  }
  async markSuperseded(ctx: TenantContext, proposalId: string, exceptId: string, tx?: PoolClient) {
    await this.query("UPDATE proposal_versions SET status='superseded', updated_at=now() WHERE organization_id=$1 AND proposal_id=$2 AND id<>$3 AND status IN ('draft','sent')",
      [ctx.organizationId, proposalId, exceptId], tx);
  }
  async approve(ctx: TenantContext, id: string, version: number, tx?: PoolClient) {
    const cur = await this.find(ctx, id, tx) as { status: string };
    if (cur.status !== "sent") throw new StateTransitionError(cur.status, ["sent->approved"]);
    return updateWithVersion("proposal_versions", id, version, { status: "approved" }, tx);
  }
}

export class ContractRepository extends BaseRepository {
  protected table = "contracts";
  async find(ctx: TenantContext, id: string, tx?: PoolClient) { return this.findByIdInOrg(id, ctx.organizationId, tx); }
  async list(ctx: TenantContext, limit = 20, tx?: PoolClient) {
    const res = await this.query("SELECT * FROM contracts WHERE organization_id=$1 ORDER BY id LIMIT $2",
      [ctx.organizationId, Math.min(Math.max(limit, 1), 100)], tx);
    return res.rows;
  }
  async transition(ctx: TenantContext, id: string, version: number, to: string, tx?: PoolClient) {
    const cur = await this.find(ctx, id, tx) as { status: string };
    assertTransition("contract", cur.status, to);
    return updateWithVersion("contracts", id, version, { status: to }, tx);
  }
}
