/**
 * Notification + delivery persistence (Phase 14). Notifications are unique
 * per (org, event, recipient); deliveries unique per (notification, channel)
 * — the idempotency backbone that makes retried routing harmless.
 */
import { PoolClient } from "pg";
import { BaseRepository } from "./baseRepository.js";
import { getPool } from "./db.js";
import { DeliveryRow } from "./notificationOutboxRepository.js";

export class NotificationRepository extends BaseRepository {
  protected table = "notifications";

  /** Idempotent insert: a replayed route yields the existing row. */
  async createIfAbsent(args: {
    organizationId: string; workspaceId: string | null; projectId: string | null;
    eventId: string; eventType: string; recipientUserId: string;
    title: string; bodyText: string; payload: Record<string, unknown>; priority: string;
  }, tx?: PoolClient): Promise<{ row: Record<string, unknown>; created: boolean }> {
    const res = await this.query(
      `INSERT INTO notifications
         (organization_id, workspace_id, project_id, event_id, event_type, recipient_user_id,
          title, body, payload, priority)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (organization_id, event_id, recipient_user_id) DO NOTHING
       RETURNING *`,
      [args.organizationId, args.workspaceId, args.projectId, args.eventId, args.eventType,
        args.recipientUserId, args.title, args.bodyText, JSON.stringify(args.payload), args.priority],
      tx
    );
    if (res.rowCount) return { row: res.rows[0], created: true };
    const existing = await this.query(
      "SELECT * FROM notifications WHERE organization_id=$1 AND event_id=$2 AND recipient_user_id=$3",
      [args.organizationId, args.eventId, args.recipientUserId], tx);
    return { row: existing.rows[0], created: false };
  }

  /** Tenant- and recipient-scoped read (INV-TEN-*: never cross-recipient). */
  async listForRecipient(args: {
    organizationId: string; recipientUserId: string; limit: number;
    cursor?: { c: string; id: string } | null; unreadOnly?: boolean;
  }, tx?: PoolClient) {
    const conds = ["organization_id=$1", "recipient_user_id=$2"];
    const p: unknown[] = [args.organizationId, args.recipientUserId];
    if (args.unreadOnly) conds.push("read_at IS NULL");
    if (args.cursor) {
      conds.push(`(created_at, id) < (to_timestamp($3::double precision), $4::uuid)`);
      p.push(new Date(args.cursor.c).getTime() / 1000, args.cursor.id);
    }
    p.push(args.limit);
    const res = await this.query(
      `SELECT id, event_id, event_type, title, body, payload, priority, status, read_at, version, created_at
       FROM notifications WHERE ${conds.join(" AND ")}
       ORDER BY created_at DESC, id DESC LIMIT $${p.length}`, p, tx);
    return res.rows;
  }

  async findForRecipient(id: string, organizationId: string, recipientUserId: string, tx?: PoolClient) {
    const res = await this.query(
      "SELECT * FROM notifications WHERE id=$1 AND organization_id=$2 AND recipient_user_id=$3",
      [id, organizationId, recipientUserId], tx);
    return res.rowCount ? res.rows[0] : null;
  }

  /** Mark read. Ownership enforced by the recipient predicate. */
  async markRead(id: string, organizationId: string, recipientUserId: string, tx?: PoolClient) {
    const res = await this.query(
      `UPDATE notifications SET read_at=now(), version=version+1, updated_at=now()
       WHERE id=$1 AND organization_id=$2 AND recipient_user_id=$3 AND read_at IS NULL
       RETURNING *`,
      [id, organizationId, recipientUserId], tx);
    if (res.rowCount) return res.rows[0];
    return this.findForRecipient(id, organizationId, recipientUserId, tx);
  }

  async markAllRead(organizationId: string, recipientUserId: string, tx?: PoolClient): Promise<number> {
    const res = await this.query(
      `UPDATE notifications SET read_at=now(), version=version+1, updated_at=now()
       WHERE organization_id=$1 AND recipient_user_id=$2 AND read_at IS NULL`,
      [organizationId, recipientUserId], tx);
    return res.rowCount ?? 0;
  }

  async get(id: string, tx?: PoolClient): Promise<Record<string, unknown> | null> {
    const res = await this.query("SELECT * FROM notifications WHERE id=$1", [id], tx);
    return res.rowCount ? res.rows[0] : null;
  }
}
