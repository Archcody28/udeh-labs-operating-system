/**
 * In-process rate-limit hook for security-sensitive endpoints.
 * Sliding-window counter per key. Single-instance only — production with
 * multiple replicas needs a shared store (documented gap; interface kept
 * narrow so it can be swapped without touching handlers).
 */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  constructor(private limit: number, private windowMs: number) {}

  /** Returns true when allowed; false when the caller must return 429. */
  attempt(key: string, now = Date.now()): boolean {
    const cutoff = now - this.windowMs;
    const prev = (this.hits.get(key) ?? []).filter((t) => t > cutoff);
    if (prev.length >= this.limit) {
      this.hits.set(key, prev);
      return false;
    }
    prev.push(now);
    this.hits.set(key, prev);
    return true;
  }

  resetForTests(): void {
    this.hits.clear();
  }
}

/** Classifications per api-security-contract; login-class is strictest. */
export const loginLimiter = new RateLimiter(5, 60_000);
export const sensitiveLimiter = new RateLimiter(20, 60_000);
