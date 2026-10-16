# Identity Architecture — Phase 6

Date 2026-10-16. Runtime truth: `services/api/src/{domain,auth,persistence,app}` + migration `009_identity_sessions.sql`. Decided by ADR 0013.

## Trust boundaries

```text
Untrusted client (email/password/token/org hint)
  → HTTP transport (correlation, rate-limit, validation)
  → AuthProvider seam (LocalPasswordProvider; the ONLY credential toucher)
  → AuthPrincipal (server-built, secret-free)
  → Tenant resolution (membership check → TenantContext)
  → Authorization guard (role → permission, optional step-up)
  → Handler → tenant-scoped repository → PostgreSQL
```

Identity ≠ Authentication ≠ Session ≠ Authorization ≠ Membership ≠
TenantContext ≠ Audit principal. Conflation is a review failure.

## Authentication flow

`POST /api/v1/auth/register` → scrypt-hashed credential row.
`POST /api/v1/auth/login` → constant-message verify → opaque 256-bit
session token (hash persisted) → Bearer + `HttpOnly; SameSite=Lax`
(`Secure` in production) cookie. Failures: 401 + `auth.login/failed`
audit, no enumeration (unknown user costs a dummy verify).

## Authorization flow

`requirePermission(principal, orgId, permission)` — 401 when
unauthenticated, 403 when unauthorized. Role lattice from the
role-surface-matrix (owner/admin/manager/developer/designer/client/
support/auditor); permission set is the minimal evidenced subset, NOT a
full matrix (documented gap for Phase 7).

## Tenant resolution

`resolveTenantContext` verifies `principal ∈ org` before minting context.
Single-resource reads walk org → workspace → project (`assertWorkspaceInOrg`,
`assertProjectInHierarchy`); cross-tenant reads are 403, never a 404 oracle.
`GET /api/v1/organizations` lists only membership-active orgs.

## Session lifecycle

Create (login) → touch (sliding 24h) → rotate (explicit endpoint +
privilege-change revocation) → revoke (logout, absolute 7-day cap).
Expired/revoked/suspended-user lookups return anonymous (→ 401 downstream).

## Membership lifecycle

Invite (owner/admin, `invitation.create`) → token (72h, hash-only) →
accept (email-bound, atomic invite-accept + membership-upsert) →
role change / suspend / remove (step-up gated, sessions revoked, audited).

## Assumptions / gaps

Single-instance rate limiter; no MFA/TOTP verifier (hook enforced);
no distributed session store; production needs TLS, least-privilege_pg
roles, shared limiter, KMS pepper (see session-security.md).
