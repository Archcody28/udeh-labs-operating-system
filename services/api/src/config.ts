/** Runtime configuration. Env-only secrets; placeholders live in .env.example. */
export interface ApiConfig {
  port: number;
  databaseUrl: string;
  nodeEnv: string;
  cookieSecure: boolean;
  /**
   * Phase 14 notification dispatch worker.
   * - enabled: run the in-process dispatcher (disable to run workers separately).
   * - intervalMs: tick period of a dispatch cycle.
   * - batchSize: max rows claimed per stage per tick.
   */
  notificationWorker: {
    enabled: boolean;
    intervalMs: number;
    batchSize: number;
    /**
     * Deadline for a single provider call. A provider that never answers
     * must not hold the worker slot (and the delivery lease) forever.
     */
    providerTimeoutMs: number;
    /**
     * Duration of the claim lease held on an outbox / delivery row while it
     * is being processed.
     */
    leaseMs: number;
  };
  /**
   * Phase 16 graceful shutdown: the hard deadline for draining in-flight
   * work on SIGINT/SIGTERM. Exceeding it forces the exit.
   */
  shutdownTimeoutMs: number;
  /**
   * Phase 16 readiness probe: the deadline for the dependency check. A
   * probe that hangs is indistinguishable from a down dependency, so the
   * check is bounded and fails closed.
   */
  readinessTimeoutMs: number;
}

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`missing required env ${name}`);
  return v;
}

function intEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

function boolEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  return raw === "true" || raw === "1";
}

export function loadConfig(): ApiConfig {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  // The provider deadline must be STRICTLY SHORTER than the claim lease.
  //
  // A delivery row is leased for `leaseMs`. If a provider call could still
  // be in flight after the lease expired, a second worker would re-claim the
  // same row and send the notification a second time. The delivery id is the
  // provider idempotency key, so a duplicate provider call is deduplicated
  // only by providers that honour the key - the platform must not depend on
  // that to avoid double delivery.
  //
  // The lease is therefore derived from the provider deadline (with headroom
  // for the database work around the call), not the other way round.
  const providerTimeoutMs = intEnv("NOTIFICATION_PROVIDER_TIMEOUT_MS", 10_000, 100, 600_000);
  const leaseMs = intEnv("NOTIFICATION_LEASE_MS", 60_000, 1_000, 3_600_000);
  const effectiveLeaseMs = Math.max(leaseMs, providerTimeoutMs * 2);
  const effectiveProviderTimeoutMs = Math.min(providerTimeoutMs, effectiveLeaseMs - 1);
  return {
    port: Number(process.env.PORT ?? "3001"),
    databaseUrl: required(
      "DATABASE_URL",
      "postgresql://udehlabs:udehlabs_dev@localhost:5432/udehlabs_dev"
    ),
    nodeEnv,
    cookieSecure: (process.env.COOKIE_SECURE ?? (nodeEnv === "production" ? "true" : "false")) === "true",
    notificationWorker: {
      enabled: boolEnv("NOTIFICATION_WORKER_ENABLED", true),
      intervalMs: intEnv("NOTIFICATION_WORKER_INTERVAL_MS", 1_000, 50, 600_000),
      batchSize: intEnv("NOTIFICATION_WORKER_BATCH_SIZE", 25, 1, 100),
      providerTimeoutMs: effectiveProviderTimeoutMs,
      leaseMs: effectiveLeaseMs,
    },
    shutdownTimeoutMs: intEnv("SHUTDOWN_TIMEOUT_MS", 10_000, 100, 300_000),
    readinessTimeoutMs: intEnv("READINESS_TIMEOUT_MS", 2_000, 100, 60_000),
  };
}
