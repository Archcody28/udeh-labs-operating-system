import { Pool, PoolClient, QueryResult } from "pg";
import { log } from "../observability/logger.ts";
import { metrics } from "../observability/metrics.ts";

/** Single pooled entry point. No raw client leaks outside repositories. */
let pool: Pool | null = null;

/**
 * Statement timeout applied to every pooled connection (milliseconds).
 *
 * Without it a single pathological query can pin a pool slot forever, which
 * turns one slow statement into a total outage (pool exhaustion). The
 * migration runner uses its own Pool and is therefore unaffected.
 */
function statementTimeoutMs(): number {
  const raw = process.env.PG_STATEMENT_TIMEOUT_MS;
  const n = raw === undefined || raw === "" ? 15_000 : Number(raw);
  if (!Number.isFinite(n)) return 15_000;
  return Math.min(Math.max(Math.trunc(n), 1_000), 600_000);
}

export function getPool(databaseUrl?: string): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl ?? process.env.DATABASE_URL,
      max: Number(process.env.PGPOOL_MAX ?? "10"),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      statement_timeout: statementTimeoutMs(),
      application_name: "udehlabs-api"
    });
    // An idle client that dies (server restart, network reset, admin
    // termination) emits an `error` event on the Pool. With no listener
    // Node treats it as an unhandled 'error' event and CRASHES the process.
    // The pool is designed to recover by discarding the client, so the
    // error must be observed, logged, and swallowed.
    pool.on("error", (err: unknown) => {
      try {
        log.error("db.pool_error", "idle postgres client failed", {
          error_code: (err as { code?: string } | null)?.code ?? "unknown"
        });
      } catch {
        // FAIL OPEN: telemetry must never crash the process.
      }
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export type TxClient = PoolClient;

/** PostgreSQL error codes that indicate a transient/retriable database failure. */
const RETRYABLE_DB_CODES = new Set([
  "08001", // unable to connect
  "08003", // connection does not exist
  "08006", // connection failure
  "53300", // too many connections
  "54000", // program limit exceeded
  "57014", // query canceled (statement timeout)
  "57P01", // admin shutdown
  "57P02", // shutdown
  "57P03", // cannot connect now
]);

const RETRYABLE_DB_MESSAGE = [
  /connection (is not available|refused|lost|terminated|closed)/i,
  /timeout/i,
  /server closed the connection/i,
  /ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i,
];

/**
 * Classify a database error as retryable (transient) vs terminal.
 * Never throws. Raw driver errors are treated as terminal unless they match
 * a known transient pattern, so a corrupt response is never blindly retried.
 */
export function isRetryableDbError(err: unknown): boolean {
  const e = err as { code?: string | undefined; message?: string | undefined } | null;
  if (!e) return false;
  if (e.code && RETRYABLE_DB_CODES.has(String(e.code))) return true;
  const msg = String(e.message ?? "");
  return RETRYABLE_DB_MESSAGE.some((re) => re.test(msg));
}

/**
 * Run a query with a bounded timeout. On timeout the query is cancelled
 * (best-effort) and the promise rejects. The caller must NOT retry a
 * transaction that performed external side effects; this helper is for
 * read/idempotent write operations where the timeout leaves no partial state.
 */
export async function queryWithTimeout(
  runner: Pool | PoolClient,
  text: string,
  params: unknown[],
  ms: number
): Promise<QueryResult<any>> {
  return new Promise((resolve, reject) => {
    const query = runner.query(text, params);
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      // Best-effort: ask the server to stop work; do not wait for it.
      try {
        (query as { cancel?: () => void }).cancel?.();
      } catch {
        /* best effort */
      }
      reject(new Error(`database query cancelled: timeout after ${ms}ms`));
    }, ms);
    // NOTE: the deadline timer is deliberately NOT unref'd. The pending
    // query promise is the only thing keeping the event loop alive while we
    // wait; unref'ing the timer would let Node conclude the loop is empty
    // and resolve the process without ever observing the timeout.
    query.then(
      (res) => { if (!settled) { settled = true; clearTimeout(timer); resolve(res); } },
      (err) => { if (!settled) { settled = true; clearTimeout(timer); reject(err); } }
    );
  });
}

/**
 * Retry a database operation that is safe to repeat (reads, idempotent
 * writes, single-statement UPDATEs).
 *
 * Only errors classified as transient by `isRetryableDbError` are retried,
 * and the delay is bounded exponential backoff. Operations with external
 * side effects MUST NOT use this helper: a timed-out statement may still
 * have committed, so replaying it could duplicate an effect. Use the
 * idempotency ledger instead for those.
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  opts: { attempts?: number; baseDelayMs?: number; maxDelayMs?: number } = {}
): Promise<T> {
  const attempts = Math.min(Math.max(opts.attempts ?? 3, 1), 10);
  const base = Math.max(opts.baseDelayMs ?? 50, 0);
  const max = Math.max(opts.maxDelayMs ?? 1_000, 0);
  let lastErr: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryableDbError(err) || attempt === attempts) throw err;
      try {
        metrics.increment("udehlabs_db_retries_total", { operation: "read" });
      } catch {
        // FAIL OPEN: telemetry must never affect the retry decision.
      }
      const delay = Math.min(base * 2 ** (attempt - 1), max);
      await new Promise<void>((resolve) => {
        // NOT unref'd: the backoff gates the next attempt, so the timer must
        // keep the event loop alive until the attempt actually runs.
        setTimeout(resolve, delay);
      });
    }
  }
  throw lastErr;
}

/** Explicit transaction boundary. Caller owns the semantics; see transaction-conventions.md. */
export async function withTransaction<T>(fn: (tx: TxClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* best effort */
    }
    throw err;
  } finally {
    client.release();
  }
}
