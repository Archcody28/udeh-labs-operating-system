import { PoolClient } from "pg";
import { BaseRepository } from "./baseRepository.js";

export interface SessionRow {
  id: string; user_id: string; token_hash: string; assurance: string;
  authenticated_at: string; last_activity_at: string; expires_at: string;
  absolute_expires_at: string; revoked_at: string | null; version: number;
}

const SESSION_TTL_HOURS = 24;
const SESSION_ABSOLUTE_DAYS = 7;

/**
 * Opaque server-side sessions. Only token SHA-256 is stored; the token
 * itself is never persisted, logged, or returned except once at creation.
 */
export class SessionRepository extends BaseRepository {
  protected table = "sessions";

  async create(
    userId: string, tokenHash: string, opts: { userAgent?: string; ipHash?: string } = {},
    tx?: PoolClient
  ): Promise<SessionRow> {
    const res = await this.query(
      `INSERT INTO sessions(user_id, token_hash, assurance, expires_at, absolute_expires_at, user_agent, ip_hash)
        VALUES ($1,$2,'password', now() + interval '${SESSION_TTL_HOURS} hours',
          now() + interval '${SESSION_ABSOLUTE_DAYS} days', $3, $4) RETURNING *`,
      [userId, tokenHash, opts.userAgent ?? null, opts.ipHash ?? null], tx);
    return res.rows[0] as SessionRow;
  }

  /** Lookup by token hash; enforces expiry + revocation server-side. */
  async findActiveByTokenHash(tokenHash: string, tx?: PoolClient): Promise<SessionRow | null> {
    const res = await this.query(
      `SELECT * FROM sessions WHERE token_hash = $1 AND revoked_at IS NULL
        AND expires_at > now() AND absolute_expires_at > now()`,
      [tokenHash], tx);
    return (res.rows[0] as SessionRow) ?? null;
  }

  /** Sliding expiration touch (no token change → no fixation vector). */
  async touch(id: string, tx?: PoolClient): Promise<void> {
    await this.query(
      `UPDATE sessions SET last_activity_at = now(),
        expires_at = least(expires_at + interval '1 hour', now() + interval '${SESSION_TTL_HOURS} hours'),
        updated_at = now() WHERE id = $1`,
      [id], tx);
  }

  /** Rotate: revoke old row, mint a replacement (fixation protection). */
  async rotate(oldId: string, newTokenHash: string, tx?: PoolClient): Promise<SessionRow> {
    const cur = await this.query("SELECT * FROM sessions WHERE id = $1", [oldId], tx);
    const row = cur.rows[0] as SessionRow;
    await this.query("UPDATE sessions SET revoked_at = now() WHERE id = $1", [oldId], tx);
    const res = await this.query(
      `INSERT INTO sessions(user_id, token_hash, assurance, authenticated_at, expires_at,
          absolute_expires_at, user_agent, ip_hash)
        VALUES ($1,$2,$3,$4, now() + interval '${SESSION_TTL_HOURS} hours', $5, $6, $7) RETURNING *`,
      [row.user_id, newTokenHash, row.assurance, row.authenticated_at,
        row.absolute_expires_at, null, null], tx);
    return res.rows[0] as SessionRow;
  }

  async revoke(id: string, tx?: PoolClient): Promise<void> {
    await this.query("UPDATE sessions SET revoked_at = now() WHERE id = $1", [id], tx);
  }

  async revokeAllForUser(userId: string, tx?: PoolClient): Promise<number> {
    const res = await this.query(
      "UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL",
      [userId], tx);
    return res.rowCount ?? 0;
  }

  async elevate(id: string, tx?: PoolClient): Promise<void> {
    await this.query("UPDATE sessions SET assurance = 'stepped-up' WHERE id = $1", [id], tx);
  }
}
