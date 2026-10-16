# Tenant Context — Phase 6 Runtime Mechanism

Date 2026-10-16. Contract (Phase 4) required server-resolved org context;
this document describes the runtime that enforces it (`src/domain/tenant.ts`,
`src/auth/guards.ts`, `src/app/*Routes.ts`).

## Establishment

```text
Authenticated Principal → membership lookup → requested org ∈ memberships?
  → YES: TenantContext{ organizationId, actorId, principalType, correlationId }
  → NO: 403 (or 401 when unauthenticated)
```

The client's `organizationId` path parameter is a hint, never authority.
`GET /api/v1/organizations` derives the list from memberships (no
`listAll()` for tenant resources exists anywhere).

## Hierarchy (never `user → project`)

1. authenticate principal; 2. resolve organization; 3. verify active
membership; 4. verify workspace.organization_id = org; 5. verify
project.(organization_id, workspace_id) chain; 6. verify permission;
7. build context. Repository `create` re-checks the workspace org match;
updates carry `organization_id` predicates + optimistic `version`.

## Isolation proof

Integration tests: B∈orgB reading orgA workspaces/audit/members → 403;
foreign workspaceId on project create → 403/404; invitation acceptance
binds to the invite org only (email match + atomic transaction).
