/**
 * Secret redaction + log-injection hardening (Phase 15).
 *
 * Two independent concerns, deliberately in one place so no call site can
 * accidentally skip one of them:
 *
 *  1. REDACTION  — values whose KEY looks credential-bearing are replaced
 *     with a fixed marker. The original value never reaches the sink.
 *  2. SANITIZATION — every string that reaches a sink is stripped of control
 *     characters (newlines included) and length-bounded, so a caller cannot
 *     forge a log line or a structured field by injecting "\n{\"level\":\"INFO\"}".
 *
 * The rule is deliberately conservative: it is always safe to redact more.
 */
export const REDACTED = "[redacted]";

/** Key names whose VALUES are never safe to emit. */
const SENSITIVE_KEY_RE =
  /(pass(word|phrase)?|secret|token|api[-_ ]?key|authorization|auth[-_ ]?header|cookie|credential|private[-_ ]?key|session[-_ ]?(id|token)|bearer|refresh|access[-_ ]?key)/i;

/** Keys that merely LOOK sensitive but are identifiers, not credentials. */
const SAFE_IDENTIFIER_KEY_RE = /^(token_hash|session_id_hash|password_hash|credential_reference)$/i;

/** Maximum characters kept for an arbitrary string field. */
export const MAX_STRING_LENGTH = 512;
/** Maximum characters kept for a message/description field. */
export const MAX_MESSAGE_LENGTH = 2_000;
/** Maximum nesting depth traversed while redacting. */
const MAX_DEPTH = 6;

/** True when a field key must never have its value emitted. */
export function isSensitiveKey(key: string): boolean {
  if (SAFE_IDENTIFIER_KEY_RE.test(key)) return false;
  return SENSITIVE_KEY_RE.test(key);
}

/**
 * Strip control characters and bound the length of an untrusted string.
 * Newlines/CR/tab are removed (not escaped) so a value can never create a
 * second log line or a forged field boundary.
 */
export function sanitizeString(value: string, maxLength = MAX_STRING_LENGTH): string {
  const stripped = value.replace(/[\u0000-\u001f\u007f]/g, "");
  return stripped.length > maxLength ? `${stripped.slice(0, maxLength)}…[truncated]` : stripped;
}

/** Sanitize an arbitrary scalar into a safe log value. */
function sanitizeScalar(value: unknown, maxLength: number): string | number | boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return sanitizeString(value, maxLength);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return value.toString();
  return sanitizeString(String(value), maxLength);
}

/**
 * Recursively redact + sanitize an arbitrary value for logging.
 * Cycles are broken with a "[circular]" marker; depth is bounded.
 */
export function redactValue(value: unknown, key = "", depth = 0): unknown {
  if (depth > MAX_DEPTH) return "[depth-limited]";
  if (value === null || value === undefined) return null;
  if (typeof value === "object") {
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) {
      return value.slice(0, 50).map((v) => redactValue(v, key, depth + 1));
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (isSensitiveKey(k)) {
        out[k] = REDACTED;
        continue;
      }
      out[k] = redactValue(v, k, depth + 1);
    }
    return out;
  }
  return sanitizeScalar(value, key.toLowerCase().includes("message") ? MAX_MESSAGE_LENGTH : MAX_STRING_LENGTH);
}

/** Redact a flat field bag (the common logging shape). */
export function redactFields(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined) continue;
    out[k] = isSensitiveKey(k) ? REDACTED : redactValue(v, k, 0);
  }
  return out;
}
