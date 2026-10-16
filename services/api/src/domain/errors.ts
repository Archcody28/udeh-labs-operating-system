/** Canonical error model (docs/api/error-contract.md). No secrets/PII in messages. */
export type ErrorCode =
  | "VALIDATION_FAILED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "STATE_TRANSITION_FAILED"
  | "RATE_LIMITED"
  | "INTERNAL";

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public httpStatus: number,
    public retryable = false,
    public fields?: { field: string; issue: string }[]
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super("NOT_FOUND", `${resource} not found`, 404, false);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super("CONFLICT", message, 409, false);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, fields?: { field: string; issue: string }[]) {
    super("VALIDATION_FAILED", message, 422, false, fields);
  }
}

export class StateTransitionError extends AppError {
  constructor(current: string, allowed: string[]) {
    super(
      "STATE_TRANSITION_FAILED",
      `invalid transition from ${current}; allowed: ${allowed.join(", ") || "none"}`,
      422,
      false
    );
  }
}

export interface ErrorEnvelope {
  code: ErrorCode;
  message: string;
  correlationId: string;
  retryable: boolean;
  fields?: { field: string; issue: string }[];
}

export function toEnvelope(err: unknown, correlationId: string): { status: number; body: ErrorEnvelope } {
  if (err instanceof AppError) {
    return {
      status: err.httpStatus,
      body: { code: err.code, message: err.message, correlationId, retryable: err.retryable, fields: err.fields }
    };
  }
  return {
    status: 500,
    body: { code: "INTERNAL", message: "internal error", correlationId, retryable: false }
  };
}
