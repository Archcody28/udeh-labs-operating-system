/**
 * Provider-neutral structured logger (Phase 15).
 *
 * Design constraints:
 * - PROVIDER NEUTRAL: the logger never imports a vendor SDK. It emits
 *   structured records to an injectable `LogSink`; the default sink writes
 *   one JSON object per line to stdout/stderr.
 * - FAIL OPEN: a broken sink must NEVER break the business operation that
 *   was being observed. Every sink call is wrapped; failures are swallowed
 *   (and counted internally) rather than propagated.
 * - SAFE BY DEFAULT: every field passes through redaction + sanitization,
 *   so a call site cannot accidentally log a token or forge a log line.
 * - CORRELATION: the ambient request context (correlation id, request id,
 *   tenant scope) is attached automatically to every record.
 */
import { randomUUID } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import { redactFields, sanitizeString, MAX_MESSAGE_LENGTH } from "./redaction.js";

export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

const LEVEL_RANK: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export interface LogRecord {
  /** ISO-8601 UTC timestamp. */
  time: string;
  level: LogLevel;
  /** Stable, low-cardinality event name (e.g. "http.request"). */
  event: string;
  message: string;
  /** Correlation id of the in-flight request, when there is one. */
  correlationId?: string;
  /** Per-request id (distinct from the caller-supplied correlation id). */
  requestId?: string;
  /** Opaque scope identifiers — never PII. */
  principalId?: string;
  principalType?: string;
  organizationId?: string;
  workspaceId?: string;
  projectId?: string;
  /** Free-form structured fields (already redacted + sanitized). */
  fields?: Record<string, unknown>;
}

/** A sink receives one already-redacted record. It must not throw. */
export type LogSink = (record: LogRecord) => void;

export interface LoggerOptions {
  level?: LogLevel;
  sink?: LogSink;
  /** Static fields merged into every record (already sanitized). */
  base?: Record<string, unknown>;
}

/** Ambient per-request context, propagated via AsyncLocalStorage. */
export interface RequestContext {
  correlationId: string;
  requestId: string;
  method: string;
  /** Normalized route template (bounded cardinality), e.g. "/api/v1/workspaces/:id". */
  route: string;
  startedAt: number;
  principalId?: string;
  principalType?: string;
  organizationId?: string;
  workspaceId?: string;
  projectId?: string;
}

const contextStorage = new AsyncLocalStorage<RequestContext>();

/** Run a function with an ambient request context. */
export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  return contextStorage.run(ctx, fn);
}

/** The ambient request context, if the current async scope has one. */
export function currentContext(): RequestContext | undefined {
  return contextStorage.getStore();
}

/** A single ambient correlation id, or undefined outside a request scope. */

export class Logger {
  private readonly level: LogLevel;
  private readonly sink: LogSink;
  private readonly base: Record<string, unknown>;
  private readonly bound: Record<string, unknown>;

  constructor(options: LoggerOptions = {}, bound: Record<string, unknown> = {}) {
    this.level = options.level ?? "info";
    this.sink = options.sink ?? consoleSink;
    this.base = options.base ? redactFields(options.base) : {};
    this.bound = redactFields(bound);
  }

  /** Derive a child logger with additional bound fields. */
  child(bound: Record<string, unknown>): Logger {
    return new Logger(
      { level: this.level, sink: this.sink, base: this.base },
      { ...this.bound, ...bound }
    );
  }

  debug(event: string, message: string, fields?: Record<string, unknown>): void {
    this.write("debug", event, message, fields);
  }
  info(event: string, message: string, fields?: Record<string, unknown>): void {
    this.write("info", event, message, fields);
  }
  warn(event: string, message: string, fields?: Record<string, unknown>): void {
    this.write("warn", event, message, fields);
  }
  error(event: string, message: string, fields?: Record<string, unknown>): void {
    this.write("error", event, message, fields);
  }

  private write(
    level: LogLevel,
    event: string,
    message: string,
    fields?: Record<string, unknown>
  ): void {
    if (LEVEL_RANK[level] < LEVEL_RANK[this.level]) return;
    const ctx = currentContext();
    const merged = { ...this.base, ...this.bound, ...(fields ?? {}) };
    const redacted = redactFields(merged);
    const record: LogRecord = {
      time: new Date().toISOString(),
      level,
      event: sanitizeString(event, 120),
      message: sanitizeString(message ?? "", MAX_MESSAGE_LENGTH),
    };
    if (ctx) {
      record.correlationId = ctx.correlationId;
      record.requestId = ctx.requestId;
      if (ctx.principalId) record.principalId = ctx.principalId;
      if (ctx.principalType) record.principalType = ctx.principalType;
      if (ctx.organizationId) record.organizationId = ctx.organizationId;
      if (ctx.workspaceId) record.workspaceId = ctx.workspaceId;
      if (ctx.projectId) record.projectId = ctx.projectId;
    }
    // Pull well-known scope fields out of `fields` when they were not
    // supplied by the ambient context (e.g. worker scope, no HTTP request).
    if (!record.principalId && typeof redacted.principalId === "string") {
      record.principalId = redacted.principalId;
    }
    if (!record.principalType && typeof redacted.principalType === "string") {
      record.principalType = redacted.principalType;
    }
    if (!record.organizationId && typeof redacted.organizationId === "string") {
      record.organizationId = redacted.organizationId;
    }
    if (Object.keys(redacted).length > 0) record.fields = redacted;

    try {
      this.sink(record);
    } catch {
      // FAIL OPEN: telemetry must never break the business operation.
      sinkCounter += 1;
    }
  }
}

/** Number of sink failures observed (diagnostic only; never thrown). */
export function logSinkFailureCount(): number {
  return sinkCounter;
}

/** Root logger. Replace the sink at composition time to route logs anywhere. */
export const logger = new Logger();

/** Convenience accessors bound to the root logger. */
export const log = {
  debug: (e: string, m: string, f?: Record<string, unknown>) => logger.debug(e, m, f),
  info: (e: string, m: string, f?: Record<string, unknown>) => logger.info(e, m, f),
  warn: (e: string, m: string, f?: Record<string, unknown>) => logger.warn(e, m, f),
  error: (e: string, m: string, f?: Record<string, unknown>) => logger.error(e, m, f),
  child: (f: Record<string, unknown>) => logger.child(f),
};

/** Create a logger with an explicit sink (tests, or a different backend). */
export function createLogger(options: LoggerOptions): Logger {
  return new Logger(options);
}

/** Build a fresh request id. */
export function newRequestId(): string {
  return randomUUID();
}

export function currentCorrelationId(): string | undefined {
  return contextStorage.getStore()?.correlationId;
}

/** Default sink: one JSON object per line. stdout for <= warn, stderr for error. */
export function consoleSink(record: LogRecord): void {
  const line = JSON.stringify(record);
  if (record.level === "error") process.stderr.write(line + "\n");
  else process.stdout.write(line + "\n");
}

let sinkCounter = 0;
