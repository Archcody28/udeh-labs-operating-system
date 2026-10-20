/**
 * Notification preferences + append-only provider-operation ledger (Phase 14).
 * Preferences are per (org, user, type, channel). Mandatory routes bypass
 * preferences entirely. Provider operations store fingerprints + safe error
 * codes only — never raw credentials or unredacted provider responses.
 */
import { PoolClient } from "pg";
import { BaseRepository } from "./baseRepository.js";
import { getPool } from "./db.js";

export class PreferenceRepository extends BaseRepository {
  protected table = "notification_preferences";

  async listForUser(organizationId: string, userId: string, tx?: PoolClient) {
    const res = await this.query(
      "SELECT notification_type, channel, enabled, version FROM notification_preferences WHERE organization_id=$1 AND user_id=$2",
      [organizationId, userId], tx);
    return res.rows;
  }

  /** Effective enablement: unset → enabled (opt-out model). Mandatory is applied by the caller. */
  async enabledFor(organizationId: string, userId: string, notificationType: string, channel: string, tx?: PoolClient): Promise<boolean> {
    const res = await this.query(
      "SELECT enabled FROM notification_preferences WHERE organization_id=$1 AND user_id=$2 AND notification_type=$3 AND channel=$4",
      [organizationId, userId, notificationType, channel], tx);
    if (!res.rowCount) return true;
    return Boolean(res.rows[0].enabled);
  }

  async upsert(args: { organizationId: string; userId: string; notificationType: string; channel: string; enabled: boolean }, tx?: PoolClient) {
    const res = await this.query(
      `INSERT INTO notification_preferences (organization_id, user_id, notification_type, channel, enabled)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (organization_id, user_id, notification_type, channel)
       DO UPDATE SET enabled=$5, version=notification_preferences.version+1, updated_at=now()
       RETURNING *`,
      [args.organizationId, args.userId, args.notificationType, args.channel, args.enabled], tx);
    return res.rows[0];
  }
}

/** Append-only provider operation ledger. */
export async function recordProviderOperation(args: {
  deliveryId: string; organizationId: string; provider: string; channel: string;
  attempt: number; idempotencyKey: string; requestFingerprint: string;
  result: "accepted" | "retryable_failure" | "terminal_failure";
  errorCode: string | null; providerMessageId: string | null;
}, tx?: PoolClient): Promise<void> {
  const runner = tx ?? getPool();
  await runner.query(
    `INSERT INTO notification_provider_operations
       (delivery_id, organization_id, provider, channel, attempt, idempotency_key,
        request_fingerprint, result, error_code, provider_message_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [args.deliveryId, args.organizationId, args.provider, args.channel, args.attempt,
      args.idempotencyKey, args.requestFingerprint, args.result, args.errorCode, args.providerMessageId]
  );
}
