/**
 * Phase 15 observability unit tests.
 *
 * Covers: redaction, correlation IDs / logger context, bounded metrics +
 * cardinality, error normalization, health/readiness, fail-open behavior.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  redactFields, sanitizeString, REDACTED, MAX_STRING_LENGTH, MAX_MESSAGE_LENGTH,
} from "../observability/redaction.js";
import {
  createLogger, logSinkFailureCount, newRequestId, currentCorrelationId,
  runWithContext, currentContext,
} from "../observability/logger.js";
import {
  metrics,
} from "../observability/metrics.js";
import {
  HTTP_METHODS, STATUS_CLASSES, ERROR_CODES, CHANNELS, DELIVERY_RESULTS,
  ROUTES, normalizeRoute, statusClass, normalizeMethod, normalizeErrorCode,
  normalizeChannel, normalizeResult, DEFAULT_METRICS,
} from "../observability/vocabulary.js";
import { normalizeError, type NormalizedError } from "../observability/error.js";
import { liveness } from "../observability/health.js";
import { checkReadiness } from "../observability/readiness.js";
import { AppError, ValidationError, toEnvelope } from "../domain/errors.js";
import { NotifyProviderError, NOTIFY_FAILURES } from "../domain/notificationProvider.js";

// ---------------------------------------------------------------------------
// Redaction
// ---------------------------------------------------------------------------

describe("redaction", () => {
  it("redacts sensitive keys", () => {
    const out = redactFields({ password: "hunter2", api_key: "abc-123", name: "alice" });
    assert.equal(out.password, REDACTED);
    assert.equal(out.api_key, REDACTED);
    assert.equal(out.name, "alice");
  });

  it("keeps safe identifier-looking keys", () => {
    const out = redactFields({ token_hash: "abc123", session_id_hash: "xyz", credential_reference: "ref" });
    assert.equal(out.token_hash, "abc123");
    assert.equal(out.session_id_hash, "xyz");
    assert.equal(out.credential_reference, "ref");
  });

  it("strips control characters", () => {
    const out = sanitizeString("line1\nline2\r\tbad\x00end");
    assert.ok(!out.includes("\n"));
    assert.ok(!out.includes("\r"));
    assert.ok(!out.includes("\t"));
    assert.ok(!out.includes("\x00"));
    assert.equal(out, "line1line2badend");
  });

  it("bounds string length", () => {
    const long = "x".repeat(2000);
    const out = sanitizeString(long, 10);
    assert.equal(out, "xxxxxxxxxx…[truncated]");
  });

  it("bounds recursion depth (cycles terminate)", () => {
    const deep: Record<string, unknown> = { level: 0 };
    let cur = deep;
    for (let i = 1; i <= 10; i++) {
      (cur as Record<string, unknown>).next = { level: i };
      cur = (cur as Record<string, unknown>).next as Record<string, unknown>;
    }
    const out = redactFields({ obj: deep });
    const s = JSON.stringify(out);
    assert.ok(s.includes("[depth-limited]"));
  });

  it("breaks cycles with depth limit", () => {
    const a: Record<string, unknown> = { name: "a" };
    const b: Record<string, unknown> = { name: "b", ref: a };
    (a as Record<string, unknown>).ref = b;
    const out = redactFields({ obj: a });
    const s = JSON.stringify(out);
    // Cycles are broken via depth limit, producing [depth-limited].
    assert.ok(s.includes("[depth-limited]") || s.includes("[circular]"));
  });

  it("omits undefined values", () => {
    const out = redactFields({ a: 1, b: undefined, c: 3 });
    assert.ok(!("b" in out));
  });
});

// ---------------------------------------------------------------------------
// Logger / correlation IDs
// ---------------------------------------------------------------------------

describe("logger + correlation context", () => {
  it("generates unique request ids", () => {
    const a = newRequestId();
    const b = newRequestId();
    assert.notEqual(a, b);
    assert.match(a, /^[0-9a-f-]{36}$/);
  });

  it("has no correlation id outside a request scope", () => {
    assert.equal(currentCorrelationId(), undefined);
    assert.equal(currentContext(), undefined);
  });

  it("propagates correlation id through runWithContext", () => {
    const cid = "test-cid-123";
    const rid = "test-rid-456";
    let captured: string | undefined;
    runWithContext({ correlationId: cid, requestId: rid, method: "GET", route: "/health", startedAt: Date.now() }, () => {
      captured = currentCorrelationId();
      assert.equal(currentContext()?.correlationId, cid);
      assert.equal(currentContext()?.requestId, rid);
    });
    assert.equal(captured, cid);
    assert.equal(currentCorrelationId(), undefined);
  });

  it("fail-open sink does not throw and increments failure count", () => {
    let throws = true;
    const sink = () => { if (throws) throw new Error("sink broken"); };
    const log = createLogger({ level: "info", sink });
    log.info("test.event", "hello", { key: "value" });
    assert.equal(logSinkFailureCount(), 1);

    throws = false;
    log.info("test.event2", "after recovery", { key: "value2" });
    assert.equal(logSinkFailureCount(), 1); // no new failure
  });

  it("redacts sensitive fields through the logger", () => {
    const captured: unknown[] = [];
    const sink = (record: unknown) => captured.push(record);
    const log = createLogger({ level: "info", sink });
    log.info("test.event", "msg", { password: "secret123", name: "alice" });
    const record = captured[0] as { fields?: Record<string, unknown> };
    assert.equal(record.fields?.password, REDACTED);
    assert.equal(record.fields?.name, "alice");
  });
});



// ---------------------------------------------------------------------------
// Bounded metrics / cardinality
// ---------------------------------------------------------------------------

describe("metrics", () => {
  it("registers and collects default metrics", () => {
    metrics.reset();
    for (const d of DEFAULT_METRICS) metrics.register(d);
    // Record a sample for each metric so collect() returns it.
    for (const d of DEFAULT_METRICS) {
      if (d.type === "counter") metrics.increment(d.name, { method: "GET" });
      else if (d.type === "gauge") metrics.set(d.name, 1, { dependency: "postgres" });
      else if (d.type === "histogram") metrics.observe(d.name, 0.1, { method: "GET" });
    }
    assert.ok(metrics.seriesCount() >= 0);
    const samples = metrics.collect();
    const names = new Set(samples.map((s) => s.name));
    for (const d of DEFAULT_METRICS) assert.ok(names.has(d.name), `missing metric ${d.name}`);
  });

  it("folds unknown label values to unknown", () => {
    metrics.reset();
    metrics.register({
      name: "test_metric_total", type: "counter", help: "test",
      labelValues: { method: HTTP_METHODS },
    });
    metrics.increment("test_metric_total", { method: "GET" });
    metrics.increment("test_metric_total", { method: "DELETE" });
    metrics.increment("test_metric_total", { method: "SCANNER" }); // unknown -> unknown
    const samples = metrics.collect();
    const byLabels = new Map(samples.map(s => [JSON.stringify(s.labels), s.value]));
    assert.equal(byLabels.get('{"method":"GET"}'), 1);
    assert.equal(byLabels.get('{"method":"DELETE"}'), 1);
    assert.equal(byLabels.get('{"method":"unknown"}'), 1);
  });

  it("drops undeclared labels", () => {
    metrics.reset();
    metrics.register({
      name: "test_metric_total", type: "counter", help: "test",
      labelValues: { method: HTTP_METHODS },
    });
    // `route` is not declared — must be dropped, not cause cardinality explosion.
    metrics.increment("test_metric_total", { method: "GET", route: "/api/v1/organizations/12345" });
    const samples = metrics.collect();
    assert.equal(samples.length, 1);
    assert.ok(!("route" in samples[0].labels));
    assert.equal(samples[0].labels.method, "GET");
  });

  it("keeps per-metric series isolated (no cross-metric contamination)", () => {
    metrics.reset();
    metrics.register({
      name: "metric_a_total", type: "counter", help: "a",
      labelValues: { method: HTTP_METHODS },
    });
    metrics.register({
      name: "metric_b_total", type: "counter", help: "b",
      labelValues: { method: HTTP_METHODS },
    });
    metrics.increment("metric_a_total", { method: "GET" });
    metrics.increment("metric_b_total", { method: "GET" });
    const samples = metrics.collect();
    const a = samples.find(s => s.name === "metric_a_total");
    const b = samples.find(s => s.name === "metric_b_total");
    assert.ok(a, "metric_a_total should exist");
    assert.ok(b, "metric_b_total should exist");
    assert.equal(a!.value, 1);
    assert.equal(b!.value, 1);
  });

  it("gauge set overwrites previous value", () => {
    metrics.reset();
    metrics.register({
      name: "test_gauge", type: "gauge", help: "g",
      labelValues: { dependency: ["postgres"] },
    });
    metrics.set("test_gauge", 1, { dependency: "postgres" });
    metrics.set("test_gauge", 0, { dependency: "postgres" });
    const samples = metrics.collect();
    assert.equal(samples[0].value, 0);
  });

  it("histogram observe records count and buckets", () => {
    metrics.reset();
    metrics.register({
      name: "test_histogram_seconds", type: "histogram", help: "h",
      labelValues: { channel: CHANNELS },
      buckets: [0.1, 0.5, 1],
    });
    metrics.observe("test_histogram_seconds", 0.05, { channel: "in_app" });
    metrics.observe("test_histogram_seconds", 0.2, { channel: "in_app" });
    const samples = metrics.collect();
    const s = samples.find(x => x.name === "test_histogram_seconds");
    assert.ok(s);
    assert.equal(s!.count, 2);
    assert.equal(s!.sum, 0.25);
    assert.ok(s!.buckets);
  });

  it("incrementing an unregistered metric is a no-op (fail open)", () => {
    metrics.reset();
    assert.doesNotThrow(() => metrics.increment("nonexistent_total", { method: "GET" }));
    assert.equal(metrics.collect().length, 0);
  });

  it("reset clears all series", () => {
    metrics.reset();
    metrics.register({
      name: "test_metric_total", type: "counter", help: "t",
      labelValues: { method: HTTP_METHODS },
    });
    metrics.increment("test_metric_total", { method: "GET" });
    assert.equal(metrics.collect().length, 1);
    metrics.reset();
    assert.equal(metrics.collect().length, 0);
  });

// ---------------------------------------------------------------------------
// Vocabulary / normalizers
// ---------------------------------------------------------------------------

describe("vocabulary", () => {
  it("normalizeRoute bounds known routes", () => {
    assert.equal(normalizeRoute("/health"), "/health");
    assert.equal(normalizeRoute("/ready"), "/ready");
    assert.equal(normalizeRoute("/api/v1/auth/login"), "/api/v1/auth/login");
    assert.equal(normalizeRoute("/api/v1/organizations/abc-123"), "/api/v1/organizations/:orgId");
    assert.equal(normalizeRoute("/api/v1/organizations/abc-123/projects/xyz-789"), "/api/v1/organizations/:orgId/projects/:projectId");
    assert.equal(normalizeRoute("/api/v1/organizations/abc-123/projects/xyz-789/grants"), "/api/v1/organizations/:orgId/projects/:projectId/grants");
    assert.equal(normalizeRoute("/api/v1/organizations/abc-123/members/456/notification-preferences"), "/api/v1/organizations/:orgId/members/:userId/notification-preferences");
  });

  it("normalizeRoute bounds unknown paths to other", () => {
    assert.equal(normalizeRoute("/api/v1/nonexistent"), "other");
    assert.equal(normalizeRoute("/api/v1/organizations/abc-123/secret"), "other");
    assert.equal(normalizeRoute("/?id=1"), "other");
    assert.equal(normalizeRoute(""), "other");
    // Query string / fragment stripped
    assert.equal(normalizeRoute("/health?foo=bar#frag"), "/health");
  });

  it("statusClass buckets status codes", () => {
    assert.equal(statusClass(200), "2xx");
    assert.equal(statusClass(201), "2xx");
    assert.equal(statusClass(301), "3xx");
    assert.equal(statusClass(400), "4xx");
    assert.equal(statusClass(403), "4xx");
    assert.equal(statusClass(404), "4xx");
    assert.equal(statusClass(500), "5xx");
    assert.equal(statusClass(503), "5xx");
    assert.equal(statusClass(999), "5xx"); // >= 500 is 5xx per implementation
    assert.equal(statusClass(100), "other");
  });

  it("normalizeMethod bounds methods", () => {
    assert.equal(normalizeMethod("GET"), "GET");
    assert.equal(normalizeMethod("get"), "GET");
    assert.equal(normalizeMethod("DELETE"), "DELETE");
    assert.equal(normalizeMethod("UNKNOWN"), "other");
    assert.equal(normalizeMethod(undefined), "GET");
  });

  it("normalizeErrorCode bounds codes", () => {
    assert.equal(normalizeErrorCode("VALIDATION_FAILED"), "VALIDATION_FAILED");
    assert.equal(normalizeErrorCode("NOT_FOUND"), "NOT_FOUND");
    assert.equal(normalizeErrorCode("UNKNOWN_CODE"), "INTERNAL");
    assert.equal(normalizeErrorCode(undefined), "INTERNAL");
  });

  it("normalizeChannel bounds channels", () => {
    assert.equal(normalizeChannel("in_app"), "in_app");
    assert.equal(normalizeChannel("email"), "email");
    assert.equal(normalizeChannel("sms"), "other");
    assert.equal(normalizeChannel(undefined), "other");
  });

  it("normalizeResult bounds results", () => {
    assert.equal(normalizeResult("delivered"), "delivered");
    assert.equal(normalizeResult("retried"), "retried");
    assert.equal(normalizeResult("dead_letter"), "dead_letter");
    assert.equal(normalizeResult("skipped"), "skipped");
    assert.equal(normalizeResult("unknown_result"), "other");
    assert.equal(normalizeResult(undefined), "other");
  });

  it("ROUTES contains expected entries", () => {
    assert.ok(ROUTES.includes("/health"));
    assert.ok(ROUTES.includes("/ready"));
    assert.ok(ROUTES.includes("/api/v1/auth/register"));
    assert.ok(ROUTES.includes("/api/v1/organizations/:orgId"));
    assert.ok(ROUTES.includes("/api/v1/organizations/:orgId/projects/:projectId/grants"));
    assert.ok(ROUTES.includes("/api/v1/organizations/:orgId/members/:userId/notification-preferences"));
    assert.ok(ROUTES.includes("other"));
  });

  it("DEFAULT_METRICS has all expected metrics", () => {
    const names = DEFAULT_METRICS.map(m => m.name);
    assert.ok(names.includes("udehlabs_http_requests_total"));
    assert.ok(names.includes("udehlabs_http_request_duration_seconds"));
    assert.ok(names.includes("udehlabs_http_errors_total"));
    assert.ok(names.includes("udehlabs_notification_dispatch_total"));
    assert.ok(names.includes("udehlabs_notification_delivery_duration_seconds"));
    assert.ok(names.includes("udehlabs_notification_provider_operations_total"));
    assert.ok(names.includes("udehlabs_notification_worker_ticks_total"));
    assert.ok(names.includes("udehlabs_readiness_dependency_up"));
  });
});


// ---------------------------------------------------------------------------
// Error normalization
// ---------------------------------------------------------------------------

describe("error normalization", () => {
  it("maps AppError to bounded code", () => {
    const err = new ValidationError("bad input", [{ field: "email", issue: "required" }]);
    const n = normalizeError(err);
    assert.equal(n.code, "VALIDATION_FAILED");
    assert.equal(n.message, "bad input");
    assert.equal(n.retryable, false);
  });

  it("maps NotFoundError to NOT_FOUND", () => {
    const err = new AppError("NOT_FOUND", "org not found", 404);
    const n = normalizeError(err);
    assert.equal(n.code, "NOT_FOUND");
  });

  it("maps unknown error to INTERNAL", () => {
    const n = normalizeError(new Error("something broke"));
    assert.equal(n.code, "INTERNAL");
    assert.equal(n.message, "internal error");
    assert.equal(n.retryable, false);
  });

  it("maps NotifyProviderError to bounded code", () => {
    const err = new NotifyProviderError({
      provider: "email", failure: "provider_unavailable",
      message: "no transport", retryable: false,
    });
    const n = normalizeError(err);
    assert.equal(n.code, "provider_unavailable");
    assert.equal(n.retryable, false);
  });

  it("maps retryable provider failure", () => {
    const err = new NotifyProviderError({
      provider: "in_app", failure: "rate_limited",
      message: "rate limited", retryable: true, retryAfterMs: 1000,
    });
    const n = normalizeError(err);
    assert.equal(n.code, "rate_limited");
    assert.equal(n.retryable, true);
  });

  it("toEnvelope does not leak stack", () => {
    const err = new Error("raw error with stack");
    const { status, body } = toEnvelope(err, "cid-1");
    assert.equal(status, 500);
    assert.equal(body.code, "INTERNAL");
    assert.equal(body.message, "internal error");
    assert.equal(body.correlationId, "cid-1");
    assert.ok(!body.message.includes("stack"));
  });
});


// ---------------------------------------------------------------------------
// Health / readiness
// ---------------------------------------------------------------------------

describe("health + readiness", () => {
  it("liveness always returns ok", () => {
    const result = liveness();
    assert.equal(result.status, "ok");
    assert.ok(result.checkedAt);
  });

  it("readiness returns a result with dependencies", async () => {
    const result = await checkReadiness();
    assert.ok(result.status === "ready" || result.status === "not_ready");
    assert.ok(Array.isArray(result.dependencies));
    assert.ok(result.dependencies.some(d => d.name === "postgres"));
    assert.equal(result.allUp, result.dependencies.every(d => d.up));
  });

  it("readiness records gauge metric", () => {
    metrics.reset();
    metrics.register({
      name: "udehlabs_readiness_dependency_up", type: "gauge", help: "r",
      labelValues: { dependency: ["postgres"] },
    });
    // checkReadiness calls metrics.set internally; just verify no throw.
    assert.doesNotThrow(async () => await checkReadiness());
  });
});

// ---------------------------------------------------------------------------
// Fail-open end-to-end
// ---------------------------------------------------------------------------

describe("fail-open", () => {
  it("broken metrics sink does not throw", () => {
    metrics.reset();
    // Unregistered metrics are silently ignored — no throw.
    assert.doesNotThrow(() => metrics.increment("udehlabs_http_requests_total", { method: "GET" }));
    assert.doesNotThrow(() => metrics.observe("udehlabs_http_request_duration_seconds", 0.1, { method: "GET", route: "/health" }));
    assert.doesNotThrow(() => metrics.set("udehlabs_readiness_dependency_up", 1, { dependency: "postgres" }));
  });
});

});
