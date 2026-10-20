/**
 * Deterministic retry/backoff policy for notification delivery and outbox
 * dispatch (Phase 14). Bounded exponential backoff with deterministic jitter
 * derived from a seed — no Math.random, fully testable.
 */
import { createHash } from "node:crypto";

export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** 0..1 fraction of the computed delay used as +/- jitter. */
  jitterRatio: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 5,
  baseDelayMs: 1_000,
  maxDelayMs: 300_000, // 5 minutes cap
  jitterRatio: 0.2,
};

/** Deterministic jitter in [-jitterRatio, +jitterRatio] from seed+attempt. */
export function deterministicJitter(seed: string, attempt: number, ratio: number): number {
  if (ratio <= 0) return 0;
  const h = createHash("sha256").update(`${seed}:${attempt}`).digest();
  const u = h.readUInt32BE(0) / 0xffffffff; // [0,1]
  return (u * 2 - 1) * ratio;
}

/**
 * Delay before the next attempt. attempt is 1-based (attempt=1 → first retry).
 * Result is clamped to [0, maxDelayMs] and never negative.
 */
export function backoffDelayMs(policy: RetryPolicy, attempt: number, seed: string): number {
  const exp = Math.min(policy.baseDelayMs * 2 ** Math.max(attempt - 1, 0), policy.maxDelayMs);
  const jitter = 1 + deterministicJitter(seed, attempt, policy.jitterRatio);
  const ms = Math.round(exp * jitter);
  return Math.min(Math.max(ms, 0), policy.maxDelayMs);
}

export function shouldRetry(policy: RetryPolicy, attempt: number): boolean {
  return attempt < policy.maxAttempts;
}

export function nextAttemptAtMs(policy: RetryPolicy, attempt: number, seed: string, nowMs = Date.now()): number {
  return nowMs + backoffDelayMs(policy, attempt, seed);
}
