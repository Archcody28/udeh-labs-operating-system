# ADR 0013 — Identity & Authentication Architecture (Phase 6)

Date: 2026-10-16. Status: Accepted. Phase: 6.
Resolves: HD-01narrow (mechanism half). Onboarding-flow unification stays open.

## Context

Phase 3 (ADR 0009) resolved the conceptual model — User → Membership
(org-scoped Role) → Organization, Invitation lifecycle, AI as scoped
principal — but left credentials/SSO/MFA/session unresolved. Repository
evidence: login/onboarding/zero-trust mockups only; no auth-flow doc, no
IdP config, no JWT/OIDC artifacts, no `pgcrypto`-backed credential store.
Phase 5 ships hand-written SQL + dependency-free Node `http` (ADR 0012);
adding an IdP SDK or framework would contradict that posture without
evidence. Phase 4 contracts require: server-resolved org context
(INV-TEN-01), no cross-tenant access (INV-TEN-02), step-up for sensitive
actions (INV-SEC-01), credentials/tokens never logged (INV-SEC-02).

## Vocabulary (not conflated)

- Identity: the durable User record (who the human is across orgs).
- Authentication: verifying credentials → authenticated state (password
  check here; MFA/SSO later behind the provider seam).
- Session: a revocable server-side record binding principal ↔ device;
  proves "still authenticated" on each request.
- Authorization: membership + role → permission evaluation per request.
- Membership: the org-scoped User↔Organization relationship (role,
  status). The ONLY org authorization relationship.
- TenantContext: server-built `{ organizationId, workspaceId?,
  projectId?, actorId, principalType }` — never client-trusted.
- Audit principal: `actor_id + principal_type` stamped from the server
  principal, never from client input.

## Decision

**Application-managed opaque sessions + password credentials (scrypt),
behind a provider-neutral `AuthProvider` seam.**

- Credentials: Node `crypto.scrypt` password hashing (N=16384, r=8, p=1,
  64-byte key, per-user 16-byte salt; `scrypt$N$r$p$salt$hash` storage).
  No custom crypto; constant-time compare via `timingSafeEqual`.
- Sessions: 256-bit opaque tokens (`randomBytes(32)`); only SHA-256 hash
  persisted; Bearer header primary, `HttpOnly; Secure; SameSite=Lax`
  cookie mirrored. 24h sliding expiry, 7-day absolute cap, rotation on
  privilege-affecting events, revocation list = session row status.
- Provider seam: `AuthProvider` interface
  (`verifyCredential`, `issuePrincipal`, `assuranceOf`) with a single
  `LocalPasswordProvider`. OIDC/SSO later implements the same interface;
  application code depends only on `AuthPrincipal`, never provider types.
- MFA/SSO/step-up: `assurance` field (`none|password|stepped-up`) +
  `requireAssurance(action)` hook; no provider wired yet (documented gap).

## Alternatives considered

- External IdP (Auth0/Clerk/Cognito/Keycloak): rejected now — zero repo
  evidence, adds vendor coupling + network dependency, contradicts ADR
  0012 minimalism. Seam keeps the door open.
- OIDC/OAuth2-compatible self-issue: rejected — token-issuance ceremony
  without a consumer; YAGNI.
- JWT-as-session ("JWT everywhere"): rejected — revocation needs
  server state anyway; JWTs leak claims, can't be revoked before expiry,
  invite replay/XSS risks. Opaque tokens + server rows are auditable.
- Pure server cookie sessions without Bearer: rejected — API-first
  consumers (CLI, agents) need header auth; dual transport costs little.
- Hybrid (local now, federate later): accepted in effect — that IS the
  seam design above.

## Consequences

- New: `009_identity_sessions.sql`, `User/Session/Membership/Invitation`
  repositories, `AuthService`, auth middleware, tenant-resolution +
  authorization guards on every `/api/v1` route.
- Password policy: ≥12 chars, ≤256, no complexity theater; rate-limited
  login (5/min/identifier), constant failure message (no enumeration).
- Production hardening still required before public exposure: TLS
  termination, `Secure` cookies enforced, Postgres RLS/least-privilege
  roles, distributed rate-limit store, KMS-backed pepper rotation.
