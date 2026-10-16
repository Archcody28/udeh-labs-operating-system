# Database Conventions — Phase 5

- Naming: tables `snake_case` plural; PK `id UUID DEFAULT gen_random_uuid()`; FK
  `<entity>_id UUID`; tenant cols `organization_id/workspace_id/project_id`; time
  `created_at/updated_at TIMESTAMPTZ DEFAULT now()`; concurrency `version INTEGER DEFAULT 1`.
- Lifecycle: `status TEXT` + `CHECK (... IN ...)` using catalog values; PROPOSED/UNRESOLVED
  labels kept as constants, CHECK-constrained but transitions enforced in domain code.
- Money/ordering: none in Phase 5 scope.
- Indexes: FK/org indexes (`ix_*`); unique `(organization_id, slug)`, `(proposal_id, version_no)`,
  `(agent_id, version_no)`, idempotency keys unique where contract requires.
- Deletion: `RESTRICT` on tenant/commercial/signed structures; `CASCADE` only for
  memberships/invitations/credentials/session children; audit never cascades.
- Errors: `23505→CONFLICT duplicate`, `23503→CONFLICT missing ref`, `23514→CONFLICT check`.
- Audit/lineage: no UPDATE/DELETE (trigger raises); `metadata JSONB`, `prev_hash TEXT`
  optional (chain PROPOSED).
