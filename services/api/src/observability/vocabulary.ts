/**
 * Metric vocabulary + route normalization (Phase 15).
 *
 * Every label VALUE that the API can emit is enumerated here. A value that
 * is not in its vocabulary is bucketed to "other"/"unknown" by the registry.
 * This file is the cardinality contract for the whole system: if a label is
 * not declared here, it must not be used.
 */
import { METRIC_PREFIX, MetricDescriptor } from "./metrics.js";

/** HTTP methods the API serves. */
export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;

/** Coarse status classes — far lower cardinality than raw status codes. */
export const STATUS_CLASSES = ["2xx", "3xx", "4xx", "5xx"] as const;

/** Canonical error codes (mirrors domain/errors.ts ErrorCode). */
export const ERROR_CODES = [
  "VALIDATION_FAILED",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "STATE_TRANSITION_FAILED",
  "RATE_LIMITED",
  // Notification provider failure taxonomy (NOTIFY_FAILURES in domain/notificationProvider.ts).
  "provider_unavailable",
  "rate_limited",
  "retryable_transport",
  "timeout",
  "invalid_recipient",
  "provider_rejected",
  "authentication_failed",
  "unsupported_channel",
  "INTERNAL",
] as const;

/** Notification delivery channels. */
export const CHANNELS = ["in_app", "email"] as const;

/** Notification provider operation outcomes. */
export const DELIVERY_RESULTS = ["delivered", "retried", "dead_letter", "skipped"] as const;

/** Route templates. `other` is the catch-all bucket for unmatched paths. */
export const ROUTES = [
  "/health",
  "/ready",
  "/metrics",
  "/api/v1/auth/register",
  "/api/v1/auth/login",
  "/api/v1/auth/logout",
  "/api/v1/auth/me",
  "/api/v1/auth/rotate",
  "/api/v1/invitations/accept",
  "/api/v1/organizations",
  "/api/v1/organizations/:orgId",
  "/api/v1/organizations/:orgId/workspaces",
  "/api/v1/organizations/:orgId/workspaces/:workspaceId",
  "/api/v1/organizations/:orgId/projects",
  "/api/v1/organizations/:orgId/projects/:projectId",
  "/api/v1/organizations/:orgId/members",
  "/api/v1/organizations/:orgId/members/:userId",
  "/api/v1/organizations/:orgId/invitations",
  "/api/v1/organizations/:orgId/audit-events",
  "/api/v1/organizations/:orgId/notifications",
  "/api/v1/organizations/:orgId/notifications/:id/read",
  "/api/v1/organizations/:orgId/notification-preferences",
  "/api/v1/organizations/:orgId/projects/:projectId/grants",
  "/api/v1/organizations/:orgId/members/:userId/notification-preferences",
  "/api/v1/agent-runs",
  "/api/v1/agent-runs/:runId",
  "/api/v1/agents",
  "/api/v1/agents/:agentId",
  "/api/v1/engineering-runs",
  "/api/v1/engineering-runs/:runId",
  "/api/v1/integrations",
  "/api/v1/integrations/:integrationId",
  "/api/v1/orchestration-sessions",
  "/api/v1/orchestration-sessions/:sessionId",
  "/api/v1/webhooks/:webhookId",
  "other",
] as const;

export const ROUTE_TEMPLATES: readonly string[] = ROUTES;

/**
 * Normalize a raw request path into a bounded route template.
 *
 * Path SEGMENTS that are identifiers become ":id" placeholders, and the
 * result is matched against the known route vocabulary. Anything not in the
 * vocabulary becomes "other" — so a scanner probing random URLs cannot
 * create unbounded time series.
 */
export function normalizeRoute(pathname: string): string {
  if (typeof pathname !== "string" || pathname.length === 0) return "other";
  // Strip the query string / fragment defensively (callers may pass a full URL).
  const path = pathname.split("?")[0].split("#")[0];
  if (path.length > 512) return "other";
  const segments = path.split("/").filter((s) => s.length > 0);
  if (segments.length === 0) return "other";
  const head = segments[0];
  if (head === "health" || head === "ready" || head === "metrics") {
    return `/${head}`;
  }
  if (head !== "api") return "other";
  const rest = segments.slice(1);
  if (rest[0] !== "v1") return "other";
  const family = rest[1] ?? "";
  const param = ":id";
  let candidate: string;
  switch (family) {
    case "auth":
      candidate = `/api/v1/auth/${rest[2] ?? "unknown"}`;
      break;
    case "invitations":
      candidate = "/api/v1/invitations/accept";
      break;
    case "organizations": {
      const org = "/api/v1/organizations/:orgId";
      const subParam: Record<string, string> = {
        projects: ":projectId",
        members: ":userId",
        workspaces: ":workspaceId",
      };
      if (rest.length === 2) candidate = "/api/v1/organizations";
      else if (rest.length === 3) candidate = org;
      else if (rest.length === 4) candidate = `${org}/${rest[3]}`;
      else if (rest.length === 5) candidate = `${org}/${rest[3]}/${subParam[rest[3]] ?? param}`;
      else if (rest.length === 6) candidate = `${org}/${rest[3]}/${subParam[rest[3]] ?? param}/${rest[5]}`;
      else candidate = "other";
      break;
    }
    case "agent-runs":
    case "agents":
    case "engineering-runs":
    case "integrations":
    case "orchestration-sessions":
    case "webhooks": {
      const base = `/api/v1/${family}`;
      const subParam: Record<string, string> = {
        "agent-runs": ":runId",
        agents: ":agentId",
        "engineering-runs": ":runId",
        integrations: ":integrationId",
        "orchestration-sessions": ":sessionId",
        webhooks: ":webhookId",
      };
      candidate = rest.length === 2 ? base : `${base}/${subParam[family] ?? param}`;
      break;
    }
    default:
      candidate = "other";
  }
  return ROUTE_TEMPLATES.includes(candidate) ? candidate : "other";
}

/** Bucket an HTTP status code into its class. */
export function statusClass(status: number): string {
  if (status >= 500) return "5xx";
  if (status >= 400) return "4xx";
  if (status >= 300) return "3xx";
  if (status >= 200) return "2xx";
  return "other";
}

/** Normalize an HTTP method to the bounded vocabulary. */
export function normalizeMethod(method: string | undefined): string {
  const m = (method ?? "GET").toUpperCase();
  return (HTTP_METHODS as readonly string[]).includes(m) ? m : "other";
}

/** Normalize an error code to the bounded vocabulary. */
export function normalizeErrorCode(code: string | undefined): string {
  if (!code) return "INTERNAL";
  return (ERROR_CODES as readonly string[]).includes(code) ? code : "INTERNAL";
}

/** Normalize a channel to the bounded vocabulary. */
export function normalizeChannel(channel: string | undefined): string {
  if (!channel) return "other";
  return (CHANNELS as readonly string[]).includes(channel) ? channel : "other";
}

/** Normalize a delivery result to the bounded vocabulary. */
export function normalizeResult(result: string | undefined): string {
  if (!result) return "other";
  return (DELIVERY_RESULTS as readonly string[]).includes(result) ? result : "other";
}

/** The metric descriptors registered by default. */
export const DEFAULT_METRICS: MetricDescriptor[] = [
  {
    name: `${METRIC_PREFIX}http_requests_total`,
    type: "counter",
    help: "Total HTTP requests handled, by route template and status class.",
    labelValues: {
      method: HTTP_METHODS,
      route: ROUTE_TEMPLATES,
      status_class: STATUS_CLASSES,
    },
  },
  {
    name: `${METRIC_PREFIX}http_request_duration_seconds`,
    type: "histogram",
    help: "HTTP request duration in seconds, by route template.",
    labelValues: {
      method: HTTP_METHODS,
      route: ROUTE_TEMPLATES,
    },
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  },
  {
    name: `${METRIC_PREFIX}http_errors_total`,
    type: "counter",
    help: "HTTP requests that failed, by normalized error code.",
    labelValues: {
      route: ROUTE_TEMPLATES,
      error_code: ERROR_CODES,
    },
  },
  {
    name: `${METRIC_PREFIX}notification_dispatch_total`,
    type: "counter",
    help: "Notification dispatch outcomes by channel.",
    labelValues: {
      channel: CHANNELS,
      result: DELIVERY_RESULTS,
    },
  },
  {
    name: `${METRIC_PREFIX}notification_delivery_duration_seconds`,
    type: "histogram",
    help: "Notification provider delivery duration in seconds, by channel.",
    labelValues: { channel: CHANNELS },
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
  },
  {
    name: `${METRIC_PREFIX}notification_provider_operations_total`,
    type: "counter",
    help: "Provider operation outcomes, by provider and channel.",
    labelValues: {
      provider: ["in_app", "email", "unconfigured", "other"],
      channel: CHANNELS,
      result: DELIVERY_RESULTS,
    },
  },
  {
    name: `${METRIC_PREFIX}notification_worker_ticks_total`,
    type: "counter",
    help: "Notification dispatcher ticks, by outcome.",
    labelValues: { result: ["ok", "error", "recovery"] },
  },
  {
    name: `${METRIC_PREFIX}notification_provider_timeouts_total`,
    type: "counter",
    help: "Notification provider calls that exceeded their deadline.",
    labelValues: { channel: CHANNELS },
  },
  {
    name: `${METRIC_PREFIX}notification_recovered_claims_total`,
    type: "counter",
    help: "Outbox/delivery rows reclaimed after an interrupted claim.",
    labelValues: { kind: ["outbox", "delivery"] },
  },
  {
    name: `${METRIC_PREFIX}db_retries_total`,
    type: "counter",
    help: "Database operations retried after a transient failure.",
    labelValues: { operation: ["read", "write"] },
  },
  {
    name: `${METRIC_PREFIX}shutdown_events_total`,
    type: "counter",
    help: "Shutdown sequence events, by outcome.",
    labelValues: { result: ["graceful", "forced", "step_failed"] },
  },
  {
    name: `${METRIC_PREFIX}readiness_dependency_up`,
    type: "gauge",
    help: "Readiness state of a critical dependency (1 = up, 0 = down).",
    labelValues: { dependency: ["postgres"] },
  },
];
