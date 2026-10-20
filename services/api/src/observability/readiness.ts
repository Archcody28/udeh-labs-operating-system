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
import { getPool } from "../persistence/db.js";
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

/** Check every critical dependency and record per-dependency gauges. */
export async function checkReadiness(): Promise<ReadinessResult> {
  const deps: DependencyStatus[] = [];

  // Postgres — a single cheap query. Raw errors are swallowed; we only
  // record up/down so no connection details leak.
  let postgresUp = false;
  try {
    await getPool().query("SELECT 1");
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
