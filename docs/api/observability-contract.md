# Observability Contract — Phase 4 (conceptual; no telemetry impl)
Date 2026-10-16.

Future APIs must expose per request: correlationId (required, returned + logged), latency, outcome (success/error code), domain action, actor/principal (+type), organizationId/workspaceId/projectId, AI run/plan/policy refs where applicable. Error rates by code + org. No PII/secrets in telemetry. Audit events are compliance source; metrics/logs are diagnostics.
