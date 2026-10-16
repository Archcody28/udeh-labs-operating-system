import { PoolClient } from "pg";
import { BaseRepository } from "./baseRepository.js";
import { TenantContext } from "../domain/tenancy.js";
import { normalizeRole } from "../domain/authorization.js";

export interface InvitationRow {
  id: string; organization_id: string; email: string; role: string; status: string;
  token_hash: string; expires_at: string; version: number;
}

/** Invitation lifecycle; tokens treated as secrets (hash-only storage). */
export class InvitationRepository extends BaseRepository {
  protected table = "invitations";

  async create(
    ctx: TenantContext, email: string, role: string, tokenHash: string,
    ttlHours = 72, createdBy?: string, tx?: PoolClient
  ): Promise<InvitationRow> {
    const canonical = normalizeRole(role);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 320) {
      throw new (await import("../domain/errors.js")).ValidationError("invalid email");
    }
    const res = await this.query(
      `INSERT INTO invitations(organization_id, email, role, status, token_hash, expires_at, created_by_user_id)
        VALUES ($1,$2,$3,'sent',$4, now() + ($5 || ' hours')::interval, $6) RETURNING *`,
      [ctx.organizationId, email.trim().toLowerCase(), canonical, tokenHash, String(ttlHours), createdBy ?? null], tx);
    return res.rows[0] as InvitationRow;
  }

  async findActiveByTokenHash(tokenHash: string, tx?: PoolClient): Promise<InvitationRow | null> {
    const res = await this.query(
      "SELECT * FROM invitations WHERE token_hash = $1 AND status = 'sent' AND expires_at > now()",
      [tokenHash], tx);
    return (res.rows[0] as InvitationRow) ?? null;
  }

  async accept(id: string, userId: string, version: number, tx?: PoolClient): Promise<InvitationRow> {
    const res = await this.query(
      `UPDATE invitations SET status = 'accepted', accepted_by_user_id = $2, accepted_at = now(),
        version = version + 1, updated_at = now()
        WHERE id = $1 AND version = $3 AND status = 'sent' AND expires_at > now() RETURNING *`,
      [id, userId, version], tx);
    if (res.rowCount === 0) throw new (await import("../domain/errors.js")).ConflictError("invitation no longer valid");
    return res.rows[0] as InvitationRow;
  }

  async revoke(ctx: TenantContext, id: string, tx?: PoolClient): Promise<InvitationRow> {
    const res = await this.query(
      `UPDATE invitations SET status = 'revoked', revoked_at = now(), version = version + 1, updated_at = now()
        WHERE id = $1 AND organization_id = $2 AND status = 'sent' RETURNING *`,
      [id, ctx.organizationId], tx);
    if (res.rowCount === 0) throw new (await import("../domain/errors.js")).NotFoundError("invitations");
    return res.rows[0] as InvitationRow;
  }

  async listForOrg(ctx: TenantContext, tx?: PoolClient): Promise<InvitationRow[]> {
    const res = await this.query(
      "SELECT id, organization_id, email, role, status, expires_at, version FROM invitations WHERE organization_id = $1 ORDER BY id",
      [ctx.organizationId], tx);
    return res.rows as InvitationRow[];
  }
}
