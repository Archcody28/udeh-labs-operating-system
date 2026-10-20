/**
 * Observability package (Phase 15).
 *
 * Provider-neutral, fail-open telemetry foundation:
 *   - logger.ts   structured JSON logging + AsyncLocalStorage request context
 *   - metrics.ts  bounded-cardinality metrics registry
 *   - vocabulary.ts bounded label vocabularies + route normalization
 *   - redaction.ts safe redaction (Phase 14)
 *   - health.ts   liveness probe
 *   - readiness.ts dependency-checked readiness probe
 *
 * All record fields pass through redaction before reaching any sink.
 */
export {
  LOG_LEVELS,
  type LogLevel,
  type LogRecord,
  type LogSink,
  type LoggerOptions,
  type RequestContext,
  consoleSink,
  logSinkFailureCount,
  runWithContext,
  currentContext,
  currentCorrelationId,
  Logger,
  logger,
  log,
  createLogger,
  newRequestId,
} from "./logger.js";

export {
  METRIC_PREFIX,
  type MetricType,
  type MetricDescriptor,
  type MetricSample,
  boundedValue,
  MetricsRegistry,
} from "./metrics.js";

export {
  HTTP_METHODS,
  STATUS_CLASSES,
  ERROR_CODES,
  CHANNELS,
  DELIVERY_RESULTS,
  ROUTES,
  ROUTE_TEMPLATES,
  DEFAULT_METRICS,
  normalizeRoute,
  statusClass,
  normalizeMethod,
  normalizeErrorCode,
  normalizeChannel,
  normalizeResult,
} from "./vocabulary.js";

export { redactFields, sanitizeString, MAX_MESSAGE_LENGTH } from "./redaction.js";

export { liveness, type LivenessResult } from "./health.js";
export { checkReadiness, type ReadinessResult } from "./readiness.js";
export { setupObservability } from "./setup.js";
export { normalizeError, type NormalizedError } from "./error.js";
