# Error Contract — Phase 4
Date 2026-10-16. Conceptual; no middleware.

Model (PROPOSED shape, illustrative): `{ code, message, correlationId, retryable, fields?[] }`.
- code: machine-readable UPPER_SNAKE (e.g. VALIDATION_FAILED, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, STATE_TRANSITION_FAILED, RATE_LIMITED, INTERNAL).
- message: human-readable, no sensitive data (no tokens, secrets, PII beyond need).
- correlationId: required on all responses (see observability-contract).
- fields: per-field validation failures for 422-style cases.
- retryable: true only for rate-limit/transient; false for validation/auth/state.
- Security: 401 vs 404 — avoid org-existence oracle: unauthenticated→401; authenticated-but-no-access→403 (or 404 only where enumeration risk documented; default 403 + audit).
- State failures use STATE_TRANSITION_FAILED with current state + allowed transitions (no internals).
