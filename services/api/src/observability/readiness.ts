/**
 * Readiness probe (Phase 15).
 *
 * Readiness answers "can the process serve traffic?" — it checks critical
 * dependencies (currently postgres) and reports an aggregated status.
 *
 * Design constraints:
 * - The HTTP response is intentionally coarse: `{ status, correlationId }`.
 *   Dependency-level detail is recorded in metrics/logs only, never leaked
 *   to the client, so an attacker cannot probe internal infrastructure.
 * - Fails closed: if any critical dependency is down, status is "not_ready".
 * - Fail open on telemetry: a broken metrics/log sink never affects the
 *   readiness result.
 */
import { getPool, withDbRetry } from "../persistence/db.js";
import { withTimeout } from "../domain/timeout.js";
import { metrics } from "./metrics.js";
import { log } from "./logger.js";

export interface DependencyStatus {
  name: string;
  up: boolean;
}

export interface ReadinessResult {
  status: "ready" | "not_ready";
  dependencies: DependencyStatus[];
  allUp: boolean;
}

const CRITICAL_DEPS = ["postgres"] as const;

/** Default deadline for the dependency check. A hung probe fails closed. */
const DEFAULT_READINESS_TIMEOUT_MS = 2_000;

/**
 * Check every critical dependency and record per-dependency gauges.
 *
 * Each check is bounded by a deadline: a probe that hangs forever is
 * indistinguishable from a down dependency, and an orchestrator that waits
 * on a hanging probe will eventually kill a healthy process. A timed-out
 * dependency is reported as DOWN (fail closed), never as up.
 */
export async function checkReadiness(
  opts: { timeoutMs?: number } = {}
): Promise<ReadinessResult> {
  const deps: DependencyStatus[] = [];
  const timeoutMs = Math.max(opts.timeoutMs ?? DEFAULT_READINESS_TIMEOUT_MS, 100);

  // Postgres - a single cheap query. Raw errors are swallowed; we only
  // record up/down so no connection details leak. A transient connection
  // failure is retried briefly (a read is safe to repeat); a terminal
  // failure or a deadline overrun is reported as down.
  let postgresUp = false;
  try {
    await withTimeout(
      () => withDbRetry(() => getPool().query("SELECT 1"), { attempts: 2, baseDelayMs: 25 }),
      timeoutMs,
      "readiness:postgres"
    );
    postgresUp = true;
  } catch {
    postgresUp = false;
  }
  deps.push({ name: "postgres", up: postgresUp });

  try {
    metrics.set(
      "udehlabs_readiness_dependency_up",
      postgresUp ? 1 : 0,
      { dependency: "postgres" }
    );
  } catch {
    // FAIL OPEN: telemetry must not change the readiness outcome.
  }

  const allUp = deps.every((d) => d.up);

  try {
    log.warn("readiness.check", allUp ? "all dependencies up" : "some dependencies down", {
      dependencies: Object.fromEntries(deps.map((d) => [d.name, d.up])),
    });
  } catch {
    // FAIL OPEN
  }

  return {
    status: allUp ? "ready" : "not_ready",
    dependencies: deps,
    allUp,
  };
}
