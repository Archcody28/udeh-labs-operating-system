/**
 * Error normalization (Phase 15).
 *
 * Maps any error (domain error, provider error, unexpected exception) to a
 * bounded error code from the observability vocabulary. The result is safe
 * to use as a label value in metrics and as a field in log records — no
 * raw stack traces, secrets, or provider internals escape.
 */
import { ERROR_CODES, normalizeErrorCode } from "./vocabulary.js";

/** Safe, bounded representation of an error for telemetry. */
export interface NormalizedError {
  /** Bounded error code from the ERROR_CODES vocabulary. */
  code: (typeof ERROR_CODES)[number] | "INTERNAL";
  /** Safe message — never contains raw provider internals or secrets. */
  message: string;
  /** Whether the error is retryable. */
  retryable: boolean;
}

const SAFE_MESSAGES: Record<string, string> = {
  VALIDATION_FAILED: "validation failed",
  UNAUTHORIZED: "unauthorized",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "not found",
  CONFLICT: "conflict",
  STATE_TRANSITION_FAILED: "state transition failed",
  RATE_LIMITED: "rate limited",
  INTERNAL: "internal error",
};

/**
 * Normalize any error into a bounded error code, safe message, and
 * retryability flag. Never throws.
 */
export function normalizeError(err: unknown): NormalizedError {
  // NotifyProviderError exposes a bounded failure taxonomy. Check this FIRST
  // because NotifyProviderError extends AppError (which carries code="INTERNAL")
  // and would otherwise be caught by the generic AppError branch below.
  if (err && typeof err === "object" && "failure" in err) {
    const failure = String((err as { failure?: unknown }).failure);
    return {
      code: normalizeErrorCode(failure) as (typeof ERROR_CODES)[number] | "INTERNAL",
      message: (err as { message?: string }).message ?? "provider error",
      retryable: Boolean((err as { retryable?: boolean }).retryable),
    };
  }

  // AppError carries a canonical code and safe message.
  if (err && typeof err === "object" && "code" in err) {
    const code = String((err as { code?: unknown }).code);
    if ((ERROR_CODES as readonly string[]).includes(code)) {
      return {
        code: code as (typeof ERROR_CODES)[number],
        message: (err as { message?: string }).message ?? SAFE_MESSAGES[code] ?? "error",
        retryable: Boolean((err as { retryable?: boolean }).retryable),
      };
    }
  }

  // Everything else is an untrusted, potentially leaking error.
  return {
    code: "INTERNAL",
    message: "internal error",
    retryable: false,
  };
}
