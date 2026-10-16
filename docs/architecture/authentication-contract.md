# Authentication Contract — Phase 6

Date 2026-10-16. Provider seam: `src/auth/provider.ts` (`AuthProvider`
interface) + `src/auth/localProvider.ts` (scrypt). Handlers depend on
`AuthPrincipal` only — no `req.auth0.*`-style coupling anywhere.

## Lifecycle

```text
Unauthenticated → attempt → Authenticated → Session → Authenticated request
  → expiry/revocation → Unauthenticated
```

## Rules

- Passwords: scrypt N=16384/r=8/p=1/64B, 16B salt, `timingSafeEqual`;
  policy 12..256 chars; hashes in `user_credentials`, never in API output.
- Tokens: 256-bit opaque, SHA-256 persisted; raw value crosses the wire
  once (login/accept/rotate response) and is never logged.
- Failures: constant `invalid email or password`; unknown-email path runs
  a dummy verify (timing/enumeration resistance, best-effort).
- Rate limits: login 5/min/identifier; register/invite/accept/step-up
  20/min. Exceeded → `RATE_LIMITED` (429, retryable) + audit.
- Actor attribution: `actor_id`/`principal_type` stamped from the server
  principal; client `actorId` is ignored (no forged-actor path).
- Password reset email: NOT implemented (out of scope; ADR 0013).
