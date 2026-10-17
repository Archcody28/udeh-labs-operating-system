import { PoolClient } from "pg";
import { BaseRepository } from "./baseRepository.js";
import { TenantContext } from "../domain/tenancy.js";

/** Idempotency ledger for transactional commercial transitions. */
export class IdempotencyRepository extends BaseRepository {
  protected table = "domain_idempotency";
  async check(ctx: TenantContext, scope: string, key: string, tx?: PoolClient) {
    const res = await this.query("SELECT response FROM domain_idempotency WHERE organization_id=$1 AND scope=$2 AND key=$3",
      [ctx.organizationId, scope, key], tx);
    return res.rowCount ? res.rows[0].response : null;
  }
  async save(ctx: TenantContext, scope: string, key: string, response: unknown, tx?: PoolClient) {
    await this.query("INSERT INTO domain_idempotency(organization_id, scope, key, response) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING",
      [ctx.organizationId, scope, key, JSON.stringify(response)], tx);
  }
}
