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
import { withTimeout, TimeoutError } from "./timeout.js";
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
  /**
   * Deadline for a single provider call. A provider that never answers must
   * not hold the worker slot (and the delivery lease) forever.
   */
  providerTimeoutMs?: number;
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
async function deliverOne(
  row: Awaited<ReturnType<typeof claimDueDeliveries>>[number],
  workerId: string,
  providerTimeoutMs: number
): Promise<"delivered" | "retried" | "dead_letter" | "lost"> {
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
    // The provider call is bounded: a hung provider must not pin the worker
    // slot (and the delivery lease) indefinitely. The delivery id is the
    // provider idempotency key, so a timed-out call that lands later is
    // deduplicated by the provider rather than double-delivered.
    const result = await withTimeout(
      () => provider!.send(req),
      providerTimeoutMs,
      `notification_provider:${provider!.name}`
    ); // outside any DB transaction
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
    // A deadline overrun is a transient transport condition, not a terminal
    // rejection: it is classified as `timeout` (a retryable failure) so the
    // delivery is retried with backoff instead of being dead-lettered.
    const timedOut = err instanceof TimeoutError;
    const retryable = timedOut
      ? true
      : e instanceof NotifyProviderError
        ? isRetryableFailure(e.failure)
        : false;
    const code = timedOut ? "timeout" : e.failure ?? "provider_error";
    if (timedOut) {
      try {
        metrics.increment(
          "udehlabs_notification_provider_timeouts_total",
          { channel: normalizeChannel(row.channel) }
        );
      } catch {
        // FAIL OPEN
      }
    }
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
  const leaseMs = Math.max(opts.leaseMs ?? 60_000, 1_000);
  // The provider deadline must fit INSIDE the lease. If a provider call
  // outlives the lease, the row is reclaimed by another worker while the
  // first call is still in flight, and the notification is delivered twice.
  // The lease is therefore stretched to at least twice the provider deadline.
  const providerTimeoutMs = Math.max(opts.providerTimeoutMs ?? 10_000, 100);
  const effectiveLeaseMs = Math.max(leaseMs, providerTimeoutMs * 2);
  const effectiveProviderTimeoutMs = Math.min(providerTimeoutMs, effectiveLeaseMs - 1);
  const result: DispatchResult = { workerId, routed: 0, delivered: 0, retried: 0, deadLettered: 0, skipped: 0 };

  let tickFailed = false;
  let tickError: unknown;
  try {
    const outbox = await claimDueOutbox(batchSize, workerId, effectiveLeaseMs);
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

    const dels = await claimDueDeliveries(batchSize, workerId, effectiveLeaseMs);
    for (const row of dels) {
      try {
        const r = await deliverOne(row, workerId, effectiveProviderTimeoutMs);
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
 * Startup recovery: reset outbox and delivery rows that are stuck in
 * `processing` with an expired claim so they are reclaimed on the next tick.
 *
 * Deterministic rules:
 * - A row in `processing` whose `claim_expires_at` is in the past represents
 *   work interrupted by a crash or shutdown. It is safe to retry: claim
 *   ownership is single-writer, completions are guarded by `claimed_by`, and
 *   notification creation/delivery are idempotent (unique per notification +
 *   channel, provider idempotency key = delivery id).
 * - Rows with a live claim are left alone: another worker may legitimately be
 *   mid-flight. Never blindly reset every `processing` row.
 * - The reset status is `retryable_failure` with `next_attempt_at = now()` so
 *   the row becomes immediately eligible for reclaim without being marked
 *   complete (durable state stays recoverable, never falsely successful).
 */
export async function recoverStaleClaims(): Promise<{
  outboxRecovered: number; deliveriesRecovered: number;
}> {
  const outboxRes = await getPool().query(
    `UPDATE outbox_events o
       SET status='retryable_failure', claimed_by=NULL, claim_expires_at=NULL,
           next_attempt_at=now(), last_error_code='stale_claim',
           last_error_message='interrupted claim recovered at startup',
           version=version+1, updated_at=now()
     WHERE o.status='processing'
       AND o.claim_expires_at IS NOT NULL
       AND o.claim_expires_at <= now()`
  );
  const deliveryRes = await getPool().query(
    `UPDATE notification_deliveries d
       SET status='retryable_failure', claimed_by=NULL, claim_expires_at=NULL,
           next_attempt_at=now(), last_error_code='stale_claim',
           last_error_message='interrupted claim recovered at startup',
           version=version+1, updated_at=now()
     WHERE d.status='processing'
       AND d.claim_expires_at IS NOT NULL
       AND d.claim_expires_at <= now()`
  );

  const result = {
    outboxRecovered: outboxRes.rowCount ?? 0,
    deliveriesRecovered: deliveryRes.rowCount ?? 0,
  };
  try {
    log.info("notification.startup_recovery", "stale claims recovered at startup", result);
    // The metric label vocabulary is closed: `recovery` is a declared
    // outcome, so the counter is actually recorded rather than folded to
    // "unknown".
    metrics.increment("udehlabs_notification_worker_ticks_total", { result: "recovery" });
    if (result.outboxRecovered > 0) {
      metrics.increment("udehlabs_notification_recovered_claims_total", { kind: "outbox" });
    }
    if (result.deliveriesRecovered > 0) {
      metrics.increment("udehlabs_notification_recovered_claims_total", { kind: "delivery" });
    }
  } catch {
    // FAIL OPEN: telemetry must not block recovery.
  }
  return result;
}

/**
 * Long-running dispatcher loop. Each tick claims a bounded batch; a failing
 * tick never kills the loop (errors are logged and the next tick retries).
 * Multiple processes may run this concurrently — claiming is atomic.
 */
export function startDispatchWorker(opts: DispatchOptions & { intervalMs?: number } = {}): {
  stop: () => Promise<void>;
} {
  const intervalMs = Math.max(opts.intervalMs ?? 1_000, 50);
  const workerId = opts.workerId ?? newWorkerId();
  let stopped = false;
  let currentTick: Promise<unknown> | null = null;
  let timer: NodeJS.Timeout | undefined;

  // Consecutive tick failures escalate the wait between attempts so a
  // database outage does not produce a hot retry loop that starves the API
  // of pool connections. The delay resets as soon as a tick succeeds.
  // This counter MUST live outside `tick`: a counter scoped to the tick
  // would always be 1 and the backoff would never escalate.
  let consecutiveFailures = 0;
  const maxBackoffMs = Math.max(intervalMs * 30, 30_000);

  const schedule = (delayMs: number): void => {
    if (stopped) return;
    timer = setTimeout(() => { void tick(); }, delayMs);
    if (typeof timer.unref === "function") timer.unref();
  };

  const tick = async (): Promise<void> => {
    if (stopped) return;
    const run = dispatchOnce({ ...opts, workerId });
    currentTick = run;
    try {
      await run;
      consecutiveFailures = 0;
    } catch (err) {
      // Never crash the process on a transient DB/provider error.
      consecutiveFailures += 1;
      try {
        log.error("notification.worker_tick_failed", "dispatch tick failed", {
          workerId,
          error_code: (err as { code?: string } | null)?.code ?? "unknown",
          consecutive_failures: consecutiveFailures
        });
      } catch {
        // FAIL OPEN: telemetry must never kill the worker loop.
      }
    }
    const backoff = Math.min(intervalMs * 2 ** consecutiveFailures, maxBackoffMs);
    schedule(consecutiveFailures > 0 ? backoff : intervalMs);
  };

  schedule(intervalMs);
  return {
    stop: async () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      // Let the in-flight tick finish so no claim is abandoned mid-processing.
      // Claims are lease-bounded, so even a crash mid-tick is recoverable.
      if (currentTick) {
        try {
          await currentTick;
        } catch {
          // The tick already logged its own failure. Shutdown must not fail
          // because the last tick failed: the lease makes the work recoverable.
        }
      }
    },
  };
}


