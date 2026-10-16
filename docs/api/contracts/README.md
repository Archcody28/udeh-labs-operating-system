# Contracts — conceptual per resource family (no schemas/endpoints implemented)

- `commercial.md` — R-05..R-09 (request→proposal→contract→approval→project trigger).
- `engineering.md` — R-10/R-11/R-15 (tasks, patches, reviews, orchestration).
- `agents.md` — R-13/R-14 (agent lifecycle + HITL).
- `operations.md` — R-12/R-16/R-17 (deploy, incident, release/verification).
- `tenancy.md` — R-01..R-04 (org/workspace/project/membership).
- `data-platform.md` — R-18..R-22 (data, decisions, audit-read, credentials, workforce).

Each file: Request (purpose/actor/inputs/validation/scope/idempotency) → Response (resource/metadata/state/relations/audit) → Errors. Payloads illustrative only.
