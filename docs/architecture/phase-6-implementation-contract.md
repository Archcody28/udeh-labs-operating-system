# Phase 6 Implementation Contract — Identity Foundation

Date 2026-10-16. Binding on Phase 6 implementation. Extends (never rewrites)
the Phase 5 contract: forward-only migration `009`, additive domain/auth
layers, guards on every tenant route.

## Approved for Phase 6

ADR 0013 (local-password + opaque sessions behind `AuthProvider` seam);
`AuthPrincipal`, RBAC→ABAC authorization, server-resolved `TenantContext`,
invitation/membership lifecycle, step-up hook, audit attribution from the
server principal, identity/security test suites, docs listed below.

## Must preserve

Phase 5 architecture (hand-written SQL, `BaseRepository`, error envelope,
correlation, append-only audit); org→workspace→project hierarchy;
`TenantContext` never client-trusted; provider neutrality (no IdP SDK).

## Still blocked (not in Phase 6)

MFA/TOTP/WebAuthn verifier, SSO/OIDC federation, password-reset email,
distributed rate limiting, full permission matrix, production TLS/pg-role
posture, frontend auth UI beyond minimal proof.
