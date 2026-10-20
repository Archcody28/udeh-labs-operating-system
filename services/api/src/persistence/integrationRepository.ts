/** Integration persistence: tenant-scoped, optimistic concurrency. */
import { PoolClient } from "pg";
import { BaseRepository, updateWithVersion } from "./baseRepository.js";
import { TenantContext } from "../domain/tenancy.js";
import { assertIntegrationTransition } from "../domain/integration.js";

export class IntegrationRepository extends BaseRepository {
  protected table = "integrations";
  async create(ctx: TenantContext, kind: string, config: Record<string, unknown>, tx?: PoolClient) {
    const res = await this.query(
      "INSERT INTO integrations(organization_id, kind, config, status) VALUES ($1,$2,$3,'pending') RETURNING *",
      [ctx.organizationId, kind, JSON.stringify(config ?? {})], tx);
    return res.rows[0];
  }
  async list(ctx: TenantContext, tx?: PoolClient) {
    const res = await this.query("SELECT id, organization_id, kind, config, status, version FROM integrations WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 100", [ctx.organizationId], tx);
    return res.rows;
  }
  async find(ctx: TenantContext, id: string, tx?: PoolClient) {
    const res = await this.query("SELECT * FROM integrations WHERE id=$1 AND organization_id=$2", [id, ctx.organizationId], tx);
    return res.rows[0] ?? null;
  }
  async transition(ctx: TenantContext, id: string, version: number, to: string, tx?: PoolClient) {
    const cur = await this.find(ctx, id, tx);
    if (!cur) return null;
    assertIntegrationTransition(cur.status, to as never);
    return (await updateWithVersion("integrations", id, version, { status: to }, tx));
  }
  async revokeCredentials(integrationId: string, tx?: PoolClient) {
    await this.query("UPDATE integration_credentials SET status='revoked', updated_at=now() WHERE integration_id=$1", [integrationId], tx);
  }
  async insertEventOnce(integrationId: string, provider: string, extId: string, type: string, payload: Record<string, unknown>, cid: string, tx?: PoolClient) {
    const res = await this.query(
      "INSERT INTO integration_events(integration_id, provider, external_event_id, event_type, payload, delivered, correlation_id) VALUES ($1,$2,$3,$4,$5,true,$6) ON CONFLICT DO NOTHING RETURNING *",
      [integrationId, provider, extId, type, JSON.stringify(payload), cid], tx);
    if (res.rowCount) return { row: res.rows[0], duplicate: false };
    return { row: null, duplicate: true };
  }
}
export const integrationRepository = new IntegrationRepository();
