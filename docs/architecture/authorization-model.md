# Authorization Model — Phase 6

Date 2026-10-16. Code: `src/domain/authorization.ts` (`requirePermission`,
`requireAssurance`), enforced centrally in `src/auth/guards.ts`
(`guardOrgRoute`). No per-controller ad-hoc checks.

## Chain

```text
Principal → Organization Membership → Role → Permission → Resource/Action
```

Roles: owner/admin/manager/developer/designer/client/support/auditor
(canonical lowercase; `normalizeRole` rejects unknowns with 403).
Permissions are the evidenced subset (`org.manage/read`,
`member.manage/read`, `workspace/project.create/read`,
`commercial.approve/read`, `engineering.manage/read`,
`deployment.trigger`, `agent.approve/invoke`, `audit.read`,
`invitation.create`). ABAC evolution: `MembershipClaim` + `TenantContext`
carry the attributes; conditions attach to `requirePermission` without
rewriting identity.

## Semantics

- Unauthenticated → 401 `UNAUTHORIZED`.
- Authenticated, no active membership / lacking permission → 403 `FORBIDDEN`.
- Cross-tenant single-resource reads → 403 (not 404) to avoid existence oracle.
- Errors carry no secrets, hashes, tokens, provider internals, or stack traces.

## Unresolved policy (explicit)

Full permission matrix per surface, project-level grant refinements,
support-break-glass scope, auditor read boundaries — framework ready,
policy deferred to Phase 7 with product sign-off.
