/**
 * Delivery claiming + preference + provider-operation persistence (Phase 14).
 * Deliveries are unique per (notification, channel); claiming uses
 * FOR UPDATE SKIP LOCKED with an ownership token so concurrent workers never
 * double-deliver, and completions are guarded by `claimed_by`.
 */
import { PoolClient } from "pg";
import { BaseRepository } from "./baseRepository.js";
import { getPool } from "./db.js";
import { DeliveryRow } from "./notificationOutboxRepository.js";

export class DeliveryRepository extends BaseRepository {
  protected table = "notification_deliveries";

  /** Idempotent per (notification, channel). */
  async createIfAbsent(args: {
    notificationId: string; organizationId: string; channel: string; provider: string;
    maxAttempts: number;
  }, tx?: PoolClient): Promise<{ row: DeliveryRow; created: boolean }> {
    const res = await this.query(
      `INSERT INTO notification_deliveries (notification_id, organization_id, channel, provider, max_attempts)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (notification_id, channel) DO NOTHING RETURNING *`,
      [args.notificationId, args.organizationId, args.channel, args.provider, args.maxAttempts], tx);
    if (res.rowCount) return { row: res.rows[0] as DeliveryRow, created: true };
    const existing = await this.query(
      "SELECT * FROM notification_deliveries WHERE notification_id=$1 AND channel=$2",
      [args.notificationId, args.channel], tx);
    return { row: existing.rows[0] as DeliveryRow, created: false };
  }

  async get(id: string, tx?: PoolClient): Promise<DeliveryRow | null> {
    const res = await this.query("SELECT * FROM notification_deliveries WHERE id=$1", [id], tx);
    return res.rowCount ? (res.rows[0] as DeliveryRow) : null;
  }
}

/** Claim due delivery rows atomically (same lease model as the outbox). */
export async function claimDueDeliveries(limit: number, workerId: string, leaseMs: number): Promise<DeliveryRow[]> {
  const res = await getPool().query(
    `UPDATE notification_deliveries d SET
       status='processing', claimed_by=$1, claim_expires_at = now() + make_interval(secs => $2::double precision),
       attempt_count = d.attempt_count + 1, version = d.version + 1, updated_at=now()
     WHERE d.id IN (
       SELECT id FROM notification_deliveries
       WHERE (status='pending' AND next_attempt_at <= now())
          OR (status='retryable_failure' AND next_attempt_at <= now())
          OR (status='processing' AND claim_expires_at IS NOT NULL AND claim_expires_at <= now())
       ORDER BY next_attempt_at ASC, id ASC
       LIMIT $3
       FOR UPDATE SKIP LOCKED
     )
     RETURNING *`,
    [workerId, leaseMs / 1000, limit]);
  return res.rows as DeliveryRow[];
}

export async function completeDelivery(deliveryId: string, workerId: string): Promise<boolean> {
  const res = await getPool().query(
    `UPDATE notification_deliveries SET status='delivered', delivered_at=now(), claimed_by=NULL,
       claim_expires_at=NULL, last_error_code=NULL, last_error_message='', version=version+1, updated_at=now()
     WHERE id=$1 AND claimed_by=$2 AND status='processing'`,
    [deliveryId, workerId]);
  return (res.rowCount ?? 0) > 0;
}

export async function retryDelivery(deliveryId: string, workerId: string, nextAttemptAtMs: number, errorCode: string, errorMessage: string): Promise<boolean> {
  const res = await getPool().query(
    `UPDATE notification_deliveries SET status='retryable_failure', claimed_by=NULL, claim_expires_at=NULL,
       next_attempt_at=to_timestamp($3::double precision / 1000.0), last_error_code=$4, last_error_message=$5,
       version=version+1, updated_at=now()
     WHERE id=$1 AND claimed_by=$2 AND status='processing'`,
    [deliveryId, workerId, nextAttemptAtMs, errorCode, errorMessage.slice(0, 500)]);
  return (res.rowCount ?? 0) > 0;
}

/**
 * Move a delivery to dead-letter (terminal). When a workerId is supplied the
 * update is guarded by the ownership token, so a worker that lost its lease
 * cannot clobber the row a newer worker is processing.
 */
export async function deadLetterDelivery(
  deliveryId: string, errorCode: string, errorMessage: string, workerId?: string
): Promise<boolean> {
  const res = await getPool().query(
    `UPDATE notification_deliveries SET status='dead_letter', claimed_by=NULL, claim_expires_at=NULL,
       dead_lettered_at=now(), last_error_code=$2, last_error_message=$3, version=version+1, updated_at=now()
     WHERE id=$1 AND status IN ('processing','retryable_failure','pending')
       AND ($4::text IS NULL OR claimed_by=$4)`,
    [deliveryId, errorCode, errorMessage.slice(0, 500), workerId ?? null]);
  return (res.rowCount ?? 0) > 0;
}

/** Flip the parent notification to delivered once its delivery lands. */
export async function markNotificationDelivered(notificationId: string): Promise<void> {
  await getPool().query(
    `UPDATE notifications SET status='delivered', version=version+1, updated_at=now()
     WHERE id=$1 AND status='pending'`, [notificationId]);
}
