/**
 * Notification dispatcher (Phase 14). Two-stage, database-backed pipeline:
 *
 *   Stage 1 (route):  claim due outbox_events (FOR UPDATE SKIP LOCKED) →
 *                     resolve route → resolve+authorize recipients →
 *                     create notification + delivery rows (idempotent) →
 *                     mark outbox dispatched.
 *   Stage 2 (deliver): claim due notification_deliveries → call provider
 *                     OUTSIDE any DB transaction → record operation →
 *                     success or bounded backoff retry or dead-letter.
 *
 * Guarantees:
 * - At-least-once internal processing; provider-level idempotency via the
 *   deterministic delivery idempotency key. We never claim exactly-once.
 * - Two workers never double-deliver: claims use SKIP LOCKED + an ownership
 *   token, and every completion is guarded by `claimed_by = <token>`.
 * - No DB transaction is ever held open across a provider call.
 * - Cross-tenant / removed recipients are re-verified before delivery.
 */
import { createHash, randomUUID } from "node:crypto";
import { getPool, withTransaction } from "../persistence/db.js";
import {
  claimDueOutbox, completeOutbox, retryOutbox, deadLetterOutbox, OutboxRow,
} from "../persistence/notificationOutboxRepository.js";
import {
  DeliveryRepository, claimDueDeliveries, completeDelivery, retryDelivery,
  deadLetterDelivery, markNotificationDelivered,
} from "../persistence/notificationDeliveryRepository.js";
import { NotificationRepository } from "../persistence/notificationRepository.js";
import {
  PreferenceRepository, recordProviderOperation,
} from "../persistence/notificationPreferenceRepository.js";
import { routeFor, RouteSpec } from "./notificationRouting.js";
import { NotificationChannel } from "./notificationChannels.js";
import { resolveRecipients } from "./notificationRecipients.js";
import { renderNotification } from "./notificationTemplates.js";
import {
  NotifyProviderError, NotifyRequest, NotificationProvider, providerForChannel,
  isRetryableFailure,
} from "./notificationProvider.js";
import { DEFAULT_RETRY_POLICY, backoffDelayMs, shouldRetry } from "./notificationRetry.js";
import { AuditRepository } from "../persistence/auditRepository.js";
import { log } from "../observability/logger.js";
import { metrics } from "../observability/metrics.js";
import { normalizeChannel, normalizeResult } from "../observability/vocabulary.js";

const notifications = new NotificationRepository();
const deliveries = new DeliveryRepository();
const prefs = new PreferenceRepository();
const audits = new AuditRepository();

export interface DispatchOptions {
  workerId?: string;
  batchSize?: number;
  leaseMs?: number;
}

export interface DispatchResult {
  workerId: string;
  routed: number;
  delivered: number;
  retried: number;
  deadLettered: number;
  skipped: number;
}

/**
 * Stage 1 — route a single claimed outbox row into notifications + deliveries.
 * Runs inside ONE transaction so notification creation is atomic; the outbox
 * completion is a separate guarded statement (never across a provider call).
 */
async function routeOne(row: OutboxRow, workerId: string): Promise<"routed" | "skipped"> {
  const eventRes = await getPool().query("SELECT * FROM domain_events WHERE id=$1", [row.event_id]);
  if (!eventRes.rowCount) {
    // Event row vanished (should not happen: FK RESTRICT). Dead-letter safely.
    await deadLetterOutbox(row.id, workerId, "event_missing", "domain event row not found");
    return "skipped";
  }
  const event = eventRes.rows[0] as Record<string, unknown>;
  const route: RouteSpec | null = routeFor(String(event.event_type));
  if (!route) {
    // Explicit routing: an unroutable type is a terminal condition, not a retry.
    await deadLetterOutbox(row.id, workerId, "unroutable", `no route for ${event.event_type}`);
    return "skipped";
  }

  const outcome = await withTransaction(async (tx) => {
    const recipients = await resolveRecipients(tx, route, {
      organizationId: row.organization_id,
      payload: (event.payload ?? {}) as Record<string, unknown>,
      actorUserId: (event.actor_user_id as string | null) ?? null,
    });
    const ctx = templateContext(event);
    let created = 0;
    for (const r of recipients) {
      // Preference gate (mandatory routes bypass). Email for a recipient with
      // no address is skipped here — never a delivery to an unknown address.
      const allowed: NotificationChannel[] = [];
      for (const ch of route.channels) {
        if (ch === "email" && !r.address) continue;
        if (route.mandatory) { allowed.push(ch); continue; }
        const on = await prefs.enabledFor(row.organization_id, r.userId, String(event.event_type), ch, tx);
        if (on) allowed.push(ch);
      }
      if (allowed.length === 0) continue;
      const rendered = renderNotification(event.event_type as never, ctx);
      const { row: nrow, created: ncreated } = await notifications.createIfAbsent({
        organizationId: row.organization_id,
        workspaceId: (event.workspace_id as string | null) ?? null,
        projectId: (event.project_id as string | null) ?? null,
        eventId: row.event_id,
        eventType: String(event.event_type),
        recipientUserId: r.userId,
        title: rendered.subject,
        bodyText: rendered.bodyText,
        // Structured payload: only id/label primitives, never raw user blobs.
        payload: {
          eventId: row.event_id,
          aggregateType: event.aggregate_type,
          aggregateId: event.aggregate_id,
        },
        priority: route.priority,
      }, tx);
      if (!ncreated) continue; // idempotent replay: notifications already exist
      created += 1;
      for (const ch of allowed) {
        let provider: NotificationProvider;
        try {
          provider = providerForChannel(ch);
        } catch {
          // Unsupported channel configured at route time is terminal for this delivery.
          await deliveries.createIfAbsent({
            notificationId: String(nrow.id), organizationId: row.organization_id,
            channel: ch, provider: "unconfigured", maxAttempts: 1,
          }, tx);
          continue;
        }
        await deliveries.createIfAbsent({
          notificationId: String(nrow.id), organizationId: row.organization_id,
          channel: ch, provider: provider.name, maxAttempts: DEFAULT_RETRY_POLICY.maxAttempts,
        }, tx);
      }
    }
    return created;
  });

  const done = await completeOutbox(row.id, workerId);
  if (!done) {
    // Lost the lease; another worker owns it. Do not double-route.
    return "skipped";
  }
  return outcome > 0 ? "routed" : "skipped";
}

/** Fingerprint a request for the operation ledger (never the raw payload). */
function fingerprint(req: NotifyRequest): string {
  return createHash("sha256")
    .update(`${req.deliveryId}|${req.idempotencyKey}|${req.recipient.userId}|${req.subject}`)
    .digest("hex")
    .slice(0, 32);
}

function newWorkerId(): string {
  return `w-${randomUUID()}`;
}

/** Build the sanitized template context from an event row. */
function templateContext(event: Record<string, unknown>): Record<string, unknown> {
  const payload = (event.payload ?? {}) as Record<string, unknown>;
  return {
    ...payload,
    eventType: event.event_type,
    actorName: "Someone", // display name resolution is a follow-up; never trust payload for it
  };
}

/**
 * Stage 2 — deliver a single claimed delivery row through its provider.
 * The provider call happens OUTSIDE any transaction. Retryable failures back
 * off deterministically; terminal failures and exhausted attempts dead-letter.
 */
async function deliverOne(row: Awaited<ReturnType<typeof claimDueDeliveries>>[number], workerId: string):
  Promise<"delivered" | "retried" | "dead_letter" | "lost"> {
  const nrow = await notifications.get(row.notification_id);
  if (!nrow) {
    await deadLetterDelivery(row.id, "notification_missing", "parent notification not found", workerId);
    try {
      const channel = normalizeChannel(row.channel);
      metrics.increment(
        "udehlabs_notification_dispatch_total",
        { channel, result: "dead_letter" }
      );
    } catch {
      // FAIL OPEN
    }
    return "dead_letter";
  }

  // Re-verify the recipient at delivery time (INV-TEN-*): a member removed or
  // suspended between routing and delivery must not receive the notification.
  // The email address is resolved here server-side, never from the payload.
  const memberRes = await getPool().query(
    `SELECT m.status AS ms, u.status AS us, u.email AS email FROM memberships m JOIN users u ON u.id=m.user_id
     WHERE m.organization_id=$1 AND m.user_id=$2`,
    [row.organization_id, nrow.recipient_user_id]);
  if (!memberRes.rowCount || memberRes.rows[0].ms !== "active" || memberRes.rows[0].us !== "active") {
    await deadLetterDelivery(row.id, "recipient_unavailable", "recipient no longer active", workerId);
    await audits.append(
      { organizationId: row.organization_id, correlationId: `notify:${row.id}` },
      "notification.recipient_unavailable", "notification", String(nrow.id), "denied", {});
    try {
      const channel = normalizeChannel(row.channel);
      metrics.increment(
        "udehlabs_notification_dispatch_total",
        { channel, result: "dead_letter" }
      );
    } catch {
      // FAIL OPEN
    }
    return "dead_letter";
  }
  const recipientEmail = (memberRes.rows[0].email as string | null) ?? null;

  const deliveryStartedAt = Date.now();
  let provider;
  try {
    provider = providerForChannel(row.channel as never);
  } catch (err) {
    const e = err as NotifyProviderError;
    await recordProviderOperation({
      deliveryId: row.id, organizationId: row.organization_id, provider: row.provider,
      channel: row.channel, attempt: row.attempt_count, idempotencyKey: row.id,
      requestFingerprint: "", result: "terminal_failure", errorCode: e.failure ?? "provider_unavailable",
      providerMessageId: null,
    });
    try {
      const channel = normalizeChannel(row.channel);
      const durationSec = (Date.now() - deliveryStartedAt) / 1000;
      metrics.increment(
        "udehlabs_notification_provider_operations_total",
        { provider: row.provider, channel, result: "dead_letter" }
      );
      metrics.increment(
        "udehlabs_notification_dispatch_total",
        { channel, result: "dead_letter" }
      );
      metrics.observe(
        "udehlabs_notification_delivery_duration_seconds",
        durationSec,
        { channel }
      );
    } catch {
      // FAIL OPEN
    }
    await deadLetterDelivery(row.id, e.failure ?? "provider_unavailable", e.message ?? "provider unavailable", workerId);
    return "dead_letter";
  }

  const req: NotifyRequest = {
    deliveryId: row.id,
    organizationId: row.organization_id,
    channel: row.channel as never,
    recipient: { userId: String(nrow.recipient_user_id), address: recipientEmail },
    subject: String(nrow.title),
    bodyText: String(nrow.body ?? ""),
    payload: (nrow.payload ?? {}) as Record<string, unknown>,
    priority: (nrow.priority as "low" | "normal" | "high" | "critical") ?? "normal",
    idempotencyKey: row.id, // deterministic: the delivery id IS the idempotency key
  };

  try {
    const result = await provider.send(req); // outside any DB transaction
    const durationSec = (Date.now() - deliveryStartedAt) / 1000;
    const channel = normalizeChannel(row.channel);
    await recordProviderOperation({
      deliveryId: row.id, organizationId: row.organization_id, provider: provider.name,
      channel: row.channel, attempt: row.attempt_count, idempotencyKey: row.id,
      requestFingerprint: fingerprint(req), result: "accepted", errorCode: null,
      providerMessageId: result.providerMessageId,
    });
    try {
      metrics.increment(
        "udehlabs_notification_provider_operations_total",
        { provider: provider.name, channel, result: "delivered" }
      );
      metrics.increment(
        "udehlabs_notification_dispatch_total",
        { channel, result: "delivered" }
      );
      metrics.observe(
        "udehlabs_notification_delivery_duration_seconds",
        durationSec,
        { channel }
      );
    } catch {
      // FAIL OPEN
    }
    const ok = await completeDelivery(row.id, workerId);
    if (ok && row.channel === "in_app") await markNotificationDelivered(row.notification_id);
    // `ok === false` means the lease was lost — another worker owns the row
    // now, so this attempt must NOT dead-letter it.
    return ok ? "delivered" : "lost";
  } catch (err) {
    const e = err as NotifyProviderError;
    const retryable = e instanceof NotifyProviderError ? isRetryableFailure(e.failure) : false;
    const code = e.failure ?? "provider_error";
    await recordProviderOperation({
      deliveryId: row.id, organizationId: row.organization_id, provider: provider.name,
      channel: row.channel, attempt: row.attempt_count, idempotencyKey: row.id,
      requestFingerprint: fingerprint(req),
      result: retryable ? "retryable_failure" : "terminal_failure",
      errorCode: code, providerMessageId: null,
    });
    try {
      const channel = normalizeChannel(row.channel);
      const durationSec = (Date.now() - deliveryStartedAt) / 1000;
      const opResult = retryable ? "retried" : "dead_letter";
      const dispatchResult = retryable ? "retried" : "dead_letter";
      metrics.increment(
        "udehlabs_notification_provider_operations_total",
        { provider: provider.name, channel, result: opResult }
      );
      metrics.increment(
        "udehlabs_notification_dispatch_total",
        { channel, result: dispatchResult }
      );
      metrics.observe(
        "udehlabs_notification_delivery_duration_seconds",
        durationSec,
        { channel }
      );
    } catch {
      // FAIL OPEN
    }
    if (retryable && shouldRetry(DEFAULT_RETRY_POLICY, row.attempt_count)) {
      const delay = backoffDelayMs(DEFAULT_RETRY_POLICY, row.attempt_count, row.id);
      await retryDelivery(row.id, workerId, Date.now() + delay, code, e.message ?? "retryable failure");
      return "retried";
    }
    await deadLetterDelivery(row.id, code, e.message ?? "terminal failure", workerId);
    await audits.append(
      { organizationId: row.organization_id, correlationId: `notify:${row.id}` },
      "notification.delivery_dead_lettered", "notification", String(nrow.id), "failed",
      { deliveryId: row.id, errorCode: code, attempts: row.attempt_count });
    return "dead_letter";
  }
}


/**
 * Run one dispatch cycle: route due outbox rows, then deliver due deliveries.
 * Safe to call from many workers concurrently — all claiming is atomic.
 */
export async function dispatchOnce(opts: DispatchOptions = {}): Promise<DispatchResult> {
  const workerId = opts.workerId ?? newWorkerId();
  const batchSize = Math.min(Math.max(opts.batchSize ?? 25, 1), 100);
  const leaseMs = opts.leaseMs ?? 30_000;
  const result: DispatchResult = { workerId, routed: 0, delivered: 0, retried: 0, deadLettered: 0, skipped: 0 };

  let tickFailed = false;
  let tickError: unknown;
  try {
    const outbox = await claimDueOutbox(batchSize, workerId, leaseMs);
    for (const row of outbox) {
      try {
        const r = await routeOne(row, workerId);
        if (r === "routed") result.routed += 1;
        else result.skipped += 1;
      } catch {
        // Unexpected routing error: retryable at the outbox level.
        const delay = backoffDelayMs(DEFAULT_RETRY_POLICY, row.attempt_count, row.id);
        await retryOutbox(row.id, workerId, Date.now() + delay, "routing_error", "routing failed");
        result.retried += 1;
      }
    }

    const dels = await claimDueDeliveries(batchSize, workerId, leaseMs);
    for (const row of dels) {
      try {
        const r = await deliverOne(row, workerId);
        if (r === "delivered") result.delivered += 1;
        else if (r === "retried") result.retried += 1;
        else if (r === "dead_letter") result.deadLettered += 1;
        else result.skipped += 1; // lease lost to another worker
      } catch {
        const delay = backoffDelayMs(DEFAULT_RETRY_POLICY, row.attempt_count, row.id);
        await retryDelivery(row.id, workerId, Date.now() + delay, "delivery_error", "delivery failed");
        result.retried += 1;
      }
    }
  } catch (err) {
    tickFailed = true;
    tickError = err;
  } finally {
    try {
      metrics.increment(
        "udehlabs_notification_worker_ticks_total",
        { result: tickFailed ? "error" : "ok" }
      );
      log.info("notification.worker_tick", "dispatch tick complete", {
        workerId,
        routed: result.routed,
        delivered: result.delivered,
        retried: result.retried,
        deadLettered: result.deadLettered,
        skipped: result.skipped,
      });
    } catch {
      // FAIL OPEN: telemetry must not affect the dispatch loop.
    }
  }
  if (tickError !== undefined) throw tickError;
  return result;
}

export { newWorkerId };

/**
 * Long-running dispatcher loop. Each tick claims a bounded batch; a failing
 * tick never kills the loop (errors are logged and the next tick retries).
 * Multiple processes may run this concurrently — claiming is atomic.
 */
export function startDispatchWorker(opts: DispatchOptions & { intervalMs?: number } = {}): {
  stop: () => void;
} {
  const intervalMs = Math.max(opts.intervalMs ?? 1_000, 50);
  const workerId = opts.workerId ?? newWorkerId();
  let stopped = false;
  const timer = setInterval(() => {
    if (stopped) return;
    void dispatchOnce({ ...opts, workerId }).catch((err: unknown) => {
      // Never crash the process on a transient DB/provider error.
      console.error("notification dispatch tick failed", { workerId, error: String(err) });
    });
  }, intervalMs);
  // Do not hold the event loop open on shutdown.
  if (typeof timer.unref === "function") timer.unref();
  return {
    stop: () => { stopped = true; clearInterval(timer); },
  };
}


