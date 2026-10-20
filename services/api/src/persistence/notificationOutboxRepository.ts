/**
 * Persistence for the notification subsystem (Phase 14): outbox claiming,
 * notification/delivery rows, preferences, provider operations.
 *
 * Claiming uses FOR UPDATE SKIP LOCKED with an ownership token so multiple
 * workers never process the same row. Completions are guarded by
 * `claimed_by = <token>` so a worker that lost its lease cannot clobber a
 * newer claim.
 */
import { PoolClient } from "pg";
import { BaseRepository } from "./baseRepository.js";
import { getPool } from "./db.js";

export interface OutboxRow {
  id: string;
  event_id: string;
  organization_id: string;
  status: string;
  attempt_count: number;
  max_attempts: number;
  next_attempt_at: string;
  claimed_by: string | null;
  [k: string]: unknown;
}

export interface DeliveryRow {
  id: string;
  notification_id: string;
  organization_id: string;
  channel: string;
  provider: string;
  status: string;
  attempt_count: number;
  max_attempts: number;
  [k: string]: unknown;
}

/** Claim due outbox rows atomically. Single-statement claim; no long tx. */
export async function claimDueOutbox(limit: number, workerId: string, leaseMs: number): Promise<OutboxRow[]> {
  const res = await getPool().query(
    `UPDATE outbox_events o SET
       status = 'processing', claimed_by = $1, claim_expires_at = now() + make_interval(secs => $2::double precision),
       attempt_count = o.attempt_count + 1, version = o.version + 1, updated_at = now()
     WHERE o.id IN (
       SELECT id FROM outbox_events
       WHERE (status = 'pending' AND next_attempt_at <= now())
          OR (status = 'retryable_failure' AND next_attempt_at <= now())
          OR (status = 'processing' AND claim_expires_at IS NOT NULL AND claim_expires_at <= now())
       ORDER BY next_attempt_at ASC, id ASC
       LIMIT $3
       FOR UPDATE SKIP LOCKED
     )
     RETURNING *`,
    [workerId, leaseMs / 1000, limit]
  );
  return res.rows as OutboxRow[];
}

/** Complete an outbox dispatch. Guarded by ownership token. */
export async function completeOutbox(outboxId: string, workerId: string, tx?: PoolClient): Promise<boolean> {
  const res = await (tx ?? getPool()).query(
    `UPDATE outbox_events SET status='dispatched', dispatched_at=now(), claimed_by=NULL,
       claim_expires_at=NULL, last_error_code=NULL, last_error_message='', version=version+1, updated_at=now()
     WHERE id=$1 AND claimed_by=$2 AND status='processing'`,
    [outboxId, workerId]
  );
  return (res.rowCount ?? 0) > 0;
}

/** Reschedule a retryable outbox failure with a backoff timestamp. */
export async function retryOutbox(outboxId: string, workerId: string, nextAttemptAtMs: number, errorCode: string, errorMessage: string): Promise<boolean> {
  const res = await getPool().query(
    `UPDATE outbox_events SET status='retryable_failure', claimed_by=NULL, claim_expires_at=NULL,
       next_attempt_at=to_timestamp($3::double precision / 1000.0), last_error_code=$4, last_error_message=$5,
       version=version+1, updated_at=now()
     WHERE id=$1 AND claimed_by=$2 AND status='processing'`,
    [outboxId, workerId, nextAttemptAtMs, errorCode, errorMessage.slice(0, 500)]
  );
  return (res.rowCount ?? 0) > 0;
}

/** Move an outbox row to dead-letter (terminal). */
export async function deadLetterOutbox(outboxId: string, workerId: string | null, errorCode: string, errorMessage: string): Promise<boolean> {
  const res = await getPool().query(
    `UPDATE outbox_events SET status='dead_letter', claimed_by=NULL, claim_expires_at=NULL,
       dead_lettered_at=now(), last_error_code=$3, last_error_message=$4, version=version+1, updated_at=now()
     WHERE id=$1 AND status IN ('processing','retryable_failure','pending') AND ($2::text IS NULL OR claimed_by=$2)`,
    [outboxId, workerId, errorCode, errorMessage.slice(0, 500)]
  );
  return (res.rowCount ?? 0) > 0;
}
