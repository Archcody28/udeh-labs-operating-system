import { PoolClient } from "pg";
import { BaseRepository } from "./baseRepository.js";
import { TenantContext } from "../domain/tenancy.js";
import { assertTransition } from "../domain/lifecycle.js";
import { normalizeRole } from "../domain/authorization.js";

export interface MembershipRow {
  id: string; organization_id: string; user_id: string; role: string; status: string; version: number;
}

/** Org membership — the ONLY org authorization relationship (ENT-003). */
export class MembershipRepository extends BaseRepository {
  protected table = "memberships";

  async upsertActive(
    ctx: TenantContext, userId: string, role: string, actorId?: string, tx?: PoolClient
  ): Promise<MembershipRow> {
    const canonical = normalizeRole(role);
    const res = await this.query(
      `INSERT INTO memberships(organization_id, user_id, role, status, updated_by_user_id)
        VALUES ($1,$2,$3,'active',$4)
        ON CONFLICT (organization_id, user_id) DO UPDATE
          SET role = EXCLUDED.role, status = 'active', updated_by_user_id = EXCLUDED.updated_by_user_id,
              suspended_at = NULL, updated_at = now()
        RETURNING *`,
      [ctx.organizationId, userId, canonical, actorId ?? null], tx);
    return res.rows[0] as MembershipRow;
  }

  async listForUser(userId: string, tx?: PoolClient): Promise<MembershipRow[]> {
    const res = await this.query(
      "SELECT * FROM memberships WHERE user_id = $1 ORDER BY organization_id",
      [userId], tx);
    return res.rows as MembershipRow[];
  }

  async listForOrg(ctx: TenantContext, tx?: PoolClient): Promise<MembershipRow[]> {
    const res = await this.query(
      "SELECT id, organization_id, user_id, role, status, version FROM memberships WHERE organization_id = $1 ORDER BY user_id",
      [ctx.organizationId], tx);
    return res.rows as MembershipRow[];
  }

  async setStatus(ctx: TenantContext, userId: string, version: number, to: string, actorId?: string, tx?: PoolClient) {
    const cur = await this.query(
      "SELECT * FROM memberships WHERE organization_id = $1 AND user_id = $2",
      [ctx.organizationId, userId], tx);
    if (cur.rowCount === 0) throw new (await import("../domain/errors.js")).NotFoundError("memberships");
    assertTransition("membership", (cur.rows[0] as MembershipRow).status, to);
    const res = await this.query(
      `UPDATE memberships SET status = $3, suspended_at = CASE WHEN $3 = 'suspended' THEN now() ELSE suspended_at END,
        updated_by_user_id = $4, version = version + 1, updated_at = now()
        WHERE organization_id = $1 AND user_id = $2 AND version = $5 RETURNING *`,
      [ctx.organizationId, userId, to, actorId ?? null, version], tx);
    if (res.rowCount === 0) throw new (await import("../domain/errors.js")).ConflictError("memberships: stale version");
    return res.rows[0] as MembershipRow;
  }

  async setRole(ctx: TenantContext, userId: string, role: string, actorId?: string, tx?: PoolClient) {
    const canonical = normalizeRole(role);
    const res = await this.query(
      `UPDATE memberships SET role = $3, updated_by_user_id = $4, version = version + 1, updated_at = now()
        WHERE organization_id = $1 AND user_id = $2 AND status = 'active' RETURNING *`,
      [ctx.organizationId, userId, canonical, actorId ?? null], tx);
    if (res.rowCount === 0) throw new (await import("../domain/errors.js")).NotFoundError("memberships");
    return res.rows[0] as MembershipRow;
  }
}
