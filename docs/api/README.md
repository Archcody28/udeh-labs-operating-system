# API Architecture — Phase 4
Date 2026-10-16. Contract only; no server/framework/endpoints implemented.

- Purpose: predictable resource/actions over D-01..D-08 entities with tenant isolation + audit.
- Versioning: PROPOSED path versioning `/api/v1/...` (no repo evidence; labeled PROPOSED).
- Conventions: resource-oriented nouns; tenant context via server-resolved organization (+workspace/project scope); authN/Z boundaries conceptual only (provider-neutral, HD-01narrow open).
- Validation: server-side; reject unknown fields (PROPOSED); never trust client org context.
- Errors: see error-contract.md. Query: see query-conventions.md. Idempotency: see idempotency-and-concurrency.md.
- Concurrency: optimistic via version/ETag concept where evidenced (commercial versions, agent plans) — PROPOSED mechanism.
- Auditability: mutating actions emit AuditEvent concepts; correlationId required.
- Compatibility: additive changes within v1; breaking → new version (see compatibility-policy.md).
- No framework selected (no repo evidence). Example payloads illustrative only.
