/**
 * Bounded-execution helpers (Phase 16 reliability).
 *
 * A promise that never settles is indistinguishable from an outage: it pins
 * a worker slot, a connection, or an HTTP request forever. These helpers give
 * every external await a deadline and a deterministic failure mode.
 *
 * The timeout REJECTS; it never resolves with a fabricated value, so a
 * caller can never mistake "timed out" for "succeeded".
 */

/** Error thrown when an operation exceeds its deadline. */
export class TimeoutError extends Error {
  readonly operation: string;
  readonly timeoutMs: number;
  constructor(operation: string, timeoutMs: number) {
    super(`operation timed out after ${timeoutMs}ms: ${operation}`);
    this.name = "TimeoutError";
    this.operation = operation;
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Run `fn` with a deadline.
 *
 * The underlying promise is NOT cancelled — JavaScript cannot cancel a
 * generic promise — but the caller is released at the deadline so a hung
 * dependency cannot pin the caller forever. Side effects of the abandoned
 * operation may still land later, so `fn` must be idempotent, or must be
 * safe to abandon (e.g. a provider call guarded by a deterministic
 * idempotency key).
 */
export async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  operation = "operation"
): Promise<T> {
  const ms = Math.max(Math.trunc(timeoutMs), 1);
  const controller = new AbortController();
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      fn(controller.signal),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new TimeoutError(operation, ms));
        }, ms);
        // NOTE: the deadline timer is deliberately NOT unref'd. It is the
        // only thing keeping the event loop alive while a hung operation is
        // awaited; unref'ing it would let the process exit before the
        // deadline fires, so the timeout would never be observed.
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Retry an operation that is safe to repeat.
 *
 * `isRetryable` decides whether a failure is transient. The delay is
 * bounded exponential backoff. Operations with non-idempotent external side
 * effects MUST NOT use this helper without a provider-level idempotency key.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: {
    attempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    isRetryable?: (err: unknown) => boolean;
  } = {}
): Promise<T> {
  const attempts = Math.min(Math.max(opts.attempts ?? 3, 1), 10);
  const base = Math.max(opts.baseDelayMs ?? 100, 0);
  const max = Math.max(opts.maxDelayMs ?? 2_000, 0);
  const isRetryable = opts.isRetryable ?? (() => true);
  let lastErr: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === attempts) throw err;
      const delay = Math.min(base * 2 ** (attempt - 1), max);
      await new Promise<void>((resolve) => {
        // Not unref'd: the backoff gates the retry, so the timer must keep
        // the event loop alive until the next attempt runs.
        setTimeout(resolve, delay);
      });
    }
  }
  throw lastErr;
}
