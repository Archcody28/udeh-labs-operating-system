/** AI failure taxonomy (Phase 10). Deterministic categories; never raw provider errors to clients. */
export const AI_FAILURES = [
  "provider_unavailable", "provider_timeout", "policy_denied", "unauthorized",
  "invalid_model_output", "tool_denied", "tool_failed", "budget_exceeded",
  "cancelled", "concurrency_conflict", "context_unavailable", "rate_limited",
] as const;
export type AiFailure = (typeof AI_FAILURES)[number];

export class AiError extends Error {
  readonly category: AiFailure;
  readonly retryable: boolean;
  readonly transient: boolean;
  constructor(category: AiFailure, message: string, opts: { retryable?: boolean; transient?: boolean } = {}) {
    super(message);
    this.category = category;
    this.retryable = opts.retryable ?? false;
    this.transient = opts.transient ?? false;
  }
}

/** Retry classification: only transient provider/timeout/rate-limit may retry; never side effects. */
export function classifyRetry(err: unknown, sideEffecting: boolean): { retry: boolean; backoffMs: number } {
  if (sideEffecting) return { retry: false, backoffMs: 0 };
  if (err instanceof AiError && err.transient) return { retry: true, backoffMs: 1000 };
  return { retry: false, backoffMs: 0 };
}

/** Prompt-injection guard: untrusted content must never carry authorization directives. */
const DIRECTIVE_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
  /you\s+are\s+now\s+(an?\s+)?(admin|owner|root|system)/i,
  /grant\s+(me\s+|yourself\s+)?(admin|owner|all\s+permissions?)/i,
  /bypass\s+(approval|policy|authorization|auth)/i,
  /approve\s+(this|yourself|your\s+own)/i,
  /disable\s+(safety|policy|guardrail|approval)/i,
];
export function containsAuthorizationDirective(content: string): boolean {
  return DIRECTIVE_PATTERNS.some((p) => p.test(content));
}
export function sanitizeUntrusted(content: string, maxLen = 8000): string {
  const t = String(content ?? "").slice(0, maxLen);
  if (containsAuthorizationDirective(t)) {
    throw new AiError("invalid_model_output", "untrusted content carries authorization directives", {});
  }
  return t;
}
