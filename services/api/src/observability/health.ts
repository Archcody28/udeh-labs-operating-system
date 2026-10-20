/**
 * Liveness probe (Phase 15).
 *
 * Liveness answers "is the process alive?" — fast, dependency-free, and
 * never fails. It must not touch the database or any external dependency,
 * so an orchestrator can restart a hung process without cascading failures.
 */
export interface LivenessResult {
  status: "ok";
  checkedAt: string;
}

/** Always returns ok. No infrastructure is consulted. */
export function liveness(): LivenessResult {
  return {
    status: "ok",
    checkedAt: new Date().toISOString(),
  };
}
