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
  };
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
    },
  };
}
