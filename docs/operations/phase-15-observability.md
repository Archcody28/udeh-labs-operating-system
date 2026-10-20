# Phase 15 Observability — Operations Guide

Date 2026-10-20. Operational contract for the Phase 15 observability foundation:
structured logging, request correlation, bounded metrics, health/readiness, and
worker/notification instrumentation.

## 1. Architecture at a glance

The observability stack is provider-neutral: no Prometheus/OpenTelemetry SDK
dependency is introduced. Everything is in-process with injectable sinks and
exporters.

```
request arrives
     │
     ▼
correlation ID (newRequestId) + request context (runWithContext)
     │
     ├─▶ structured log record (createLogger) → sink (fail-open)
     │       • sensitive fields redacted (REDACTED)
     │       • control characters stripped
     │       • strings bounded
     │
     ├─▶ HTTP metrics (metrics.increment / observe)
     │       • route normalized to template (normalizeRoute)
     │       • unknown label values folded to "unknown"/"other"
     │       • undeclared labels dropped
     │
     └─▶ response with correlation ID header
```

Three cardinality guards prevent memory exhaustion:
1. **Routes** are normalized to templates from `ROUTES` (anything unknown → `"other"`)
2. **Label values** are bounded per-metric (unknown → `"unknown"`)
3. **Undeclared labels** are dropped, never accepted

## 2. Structured logging

`createLogger({ level, sink })` returns a logger with `info`, `warn`, `error`,
`debug` methods. Every record includes: `timestamp`, `level`, `event`, `message`,
`correlationId`, `requestId`, and sanitized `fields`.

**Fail-open**: if the sink throws, the error is swallowed, `logSinkFailureCount()`
is incremented, and logging continues. Business logic never observes log failures.

| Behavior | Guarantee |
|---|---|
| Sink throws | Error swallowed, failure counter incremented, logging continues |
| Sensitive key (password, api_key, secret, token, etc.) | Replaced with `REDACTED` |
| Control characters in strings | Stripped |
| String over MAX_STRING_LENGTH | Truncated with `…[truncated]` |
| Circular / deeply nested objects | Bounded by depth limit (`[depth-limited]`) |

## 3. Request correlation

`runWithContext(ctx, fn)` binds a correlation ID + request ID to the async
context. `currentCorrelationId()` / `currentContext()` read it. Outside a
request scope both return `undefined`.

`newRequestId()` generates a UUID-style ID. Every HTTP request gets one via the
observability middleware in `app/server.ts`.

## 4. Bounded metrics

`MetricsRegistry` is a shared singleton. Metrics are registered via
`metrics.register(descriptor)` and recorded via `increment` / `set` / `observe`.

**Default metrics** (registered by `setup()`):

| Name | Type | Labels |
|---|---|---|
| `udehlabs_http_requests_total` | counter | method, route, status_class |
| `udehlabs_http_request_duration_seconds` | histogram | method, route |
| `udehlabs_http_errors_total` | counter | route, error_code |
| `udehlabs_notification_dispatch_total` | counter | channel, result |
| `udehlabs_notification_delivery_duration_seconds` | histogram | channel |
| `udehlabs_notification_provider_operations_total` | counter | provider, channel, result |
| `udehlabs_notification_worker_ticks_total` | counter | result |
| `udehlabs_readiness_dependency_up` | gauge | dependency |

**Cardinality rules:**
- Each metric has a fixed label NAME set; undeclared labels are dropped.
- Each label has a fixed VALUE set; unknown values fold to `"unknown"`/`"other"`.
- Series are keyed per-metric-name — no cross-metric contamination.
- `metrics.collect()` returns all series for scraping/export.
- `metrics.seriesCount()` returns total series held (cardinality guard).
- `metrics.reset()` clears all series (tests only).

## 5. Health / readiness

`liveness()` always returns `{ status: "ok", checkedAt }`.

`checkReadiness()` returns `{ status, dependencies, allUp, checkedAt }`. Each
dependency has `{ name, up, checkedAt }`. The `postgres` dependency is checked
via a `SELECT 1`. When any dependency is down, `allUp` is false and status is
`"not_ready"`.

Readiness updates `udehlabs_readiness_dependency_up` gauge per dependency.

## 6. Error normalization

`normalizeError(err)` maps any error to `{ code, message, retryable }`:

| Input | Output code |
|---|---|
| `ValidationError` | `VALIDATION_FAILED` |
| `AppError` (code in ERROR_CODES) | that code |
| `NotifyProviderError` (failure in NOTIFY_FAILURES) | that failure value |
| Unknown `Error` | `INTERNAL` |

Message is always a safe string — never raw stack traces, secrets, or provider
internals. `toEnvelope(err, correlationId)` produces an HTTP response body with
`status`, `code`, `message`, `correlationId`, `retryable`.

## 7. Notification worker instrumentation

The notification dispatcher instruments every tick:

- `udehlabs_notification_worker_ticks_total` — by outcome (`ok` / `error`)
- `udehlabs_notification_provider_operations_total` — by provider, channel, result
- `udehlabs_notification_delivery_duration_seconds` — by channel
- `udehlabs_notification_dispatch_total` — by channel, result

Provider errors are normalized via `normalizeError` so `provider_unavailable`,
`rate_limited`, etc. appear as bounded labels — never raw provider error strings.

## 8. Fail-open guarantees

All telemetry is fail-open:
- Log sink throws → swallowed, counter incremented, logging continues
- Metric record on unregistered metric → no-op
- Metric sink/exporter throws → swallowed
- Health/readiness check throws → dependency marked down, never throws

Business logic never depends on observability succeeding.

## 9. Related documents

- `docs/architecture/transaction-conventions.md` — transaction boundaries.
- `docs/architecture/authorization-model.md` — permission model.
- `docs/operations/phase-14-notification-delivery.md` — notification pipeline.
- `docs/development/database.md` — local database and migration commands.