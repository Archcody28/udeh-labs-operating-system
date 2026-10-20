/**
 * HTTP instrumentation middleware (Phase 15).
 *
 * Wraps each request/response cycle to emit structured logs and bounded
 * metrics. All fields pass through redaction before reaching any sink.
 *
 * Design constraints:
 * - FAIL OPEN: a broken sink or registry never breaks the request.
 * - BOUNDED CARDINALITY: route is normalized to a template; raw paths and
 *   query strings are never used as label values.
 * - CORRELATION: the x-correlation-id header (or a generated id) is attached
 *   to every log record for this request.
 */
import { IncomingMessage, ServerResponse } from "node:http";
import { correlationIdOf } from "../api/http.js";
import { log, runWithContext, newRequestId } from "./logger.js";
import { metrics } from "./metrics.js";
import { normalizeRoute, statusClass, normalizeMethod, normalizeErrorCode } from "./vocabulary.js";
import { normalizeError } from "./error.js";

/** Context captured for a single HTTP request. */
export interface HttpRequestContext {
  correlationId: string;
  requestId: string;
  method: string;
  route: string;
  startedAt: number;
}

/**
 * Instrument a single request/response cycle. `handler` is the existing
 * route dispatcher (it owns error handling and response writing).
 *
 * Returns a promise that resolves when the response has finished and
 * telemetry has been recorded.
 */
export async function instrumentRequest(
  req: IncomingMessage,
  res: ServerResponse,
  handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>
): Promise<void> {
  const correlationId = correlationIdOf(req);
  const requestId = newRequestId();
  const url = new URL(req.url ?? "/", "http://localhost");
  const method = normalizeMethod(req.method);
  const route = normalizeRoute(url.pathname);
  const startedAt = Date.now();

  const ctx: HttpRequestContext = { correlationId, requestId, method, route, startedAt };

  return runWithContext(ctx, async () => {
    try {
      log.info("http.request", "request started", {
        method,
        route,
      });
    } catch {
      // FAIL OPEN
    }

    // Capture the status code set by writeHead / writeHeadAsync.
    let statusCode = 0;
    const originalWriteHead = res.writeHead.bind(res);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (res as any).writeHead = ((code: number, ...args: unknown[]) => {
      statusCode = code;
      return originalWriteHead(code, ...(args as any[]));
    }) as ServerResponse["writeHead"];

    let finished = false;
    const recordTelemetry = () => {
      if (finished) return;
      finished = true;
      const durationMs = Date.now() - startedAt;
      const durationSec = durationMs / 1000;
      const sc = statusCode || 0;
      const scClass = statusClass(sc);

      // Metrics — bounded labels only.
      try {
        metrics.increment(
          "udehlabs_http_requests_total",
          { method, route, status_class: scClass }
        );
        metrics.observe(
          "udehlabs_http_request_duration_seconds",
          durationSec,
          { method, route }
        );
        if (scClass === "4xx" || scClass === "5xx") {
          metrics.increment(
            "udehlabs_http_errors_total",
            { route, error_code: normalizeErrorCode(undefined) }
          );
        }
      } catch {
        // FAIL OPEN
      }

      try {
        log.info("http.response", "request completed", {
          method,
          route,
          status_code: sc,
          status_class: scClass,
          duration_ms: durationMs,
        });
      } catch {
        // FAIL OPEN
      }
    };

    res.on("finish", recordTelemetry);
    res.on("close", recordTelemetry);

    try {
      await handler(req, res);
    } catch (err) {
      const normalized = normalizeError(err);
      // The handler already calls sendError on failure; we record the error
      // metric here using the normalized error code.
      try {
        metrics.increment(
          "udehlabs_http_errors_total",
          { route, error_code: normalized.code }
        );
      } catch {
        // FAIL OPEN
      }
      try {
        log.error("http.error", "request handler threw", {
          method,
          route,
          error_code: normalized.code,
        });
      } catch {
        // FAIL OPEN
      }
      throw err;
    }
  });
}
