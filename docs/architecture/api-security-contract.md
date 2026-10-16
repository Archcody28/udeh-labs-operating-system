# API Security Contract — Phase 4 (conceptual; no middleware/provider)
Date 2026-10-16.

- Authentication boundary: identity verified before any org action; mechanism UNRESOLVED (HD-01narrow); provider-neutral.
- Authorization boundary: org-scoped RBAC/ABAC concept; server resolves currentOrganization; least privilege (A.24); AI principals policy-bound.
- Tenant isolation: every read/write filtered by organizationId; cross-tenant → deny + audit; no client-supplied org context trusted.
- Validation: server-side strict; output filtering strips secrets/tokens; errors never leak sensitive data.
- Auditability: all mutating + security decisions emit AuditEvent.
- Rate limiting/abuse (PROPOSED): per-actor+org limits; sensitive actions (login, invite, approve, run-start, deploy) stricter; exceeded→RATE_LIMITED + audit.
- AI action authorization: high-risk tool calls require Approval record; execution references pinned policy/plan/agent versions.
