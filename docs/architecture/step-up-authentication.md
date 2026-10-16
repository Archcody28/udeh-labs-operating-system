# Step-Up Authentication — Phase 6 Hook

Date 2026-10-16. Satisfies INV-SEC-01 architecturally; the MFA/TOTP/
WebAuthn verifier is unresolved and stays abstract.

- Model: `AuthPrincipal.assurance ∈ { none, password, stepped-up }`;
  `sessions.assurance` persisted; `POST /api/v1/auth/rotate` preserves it.
- Enforcement: `requiresStepUp(action)` covers `commercial.approve`,
  `deployment.trigger`, `member.manage`, `org.manage`, `agent.approve`,
  `credential.rotate`. `requireAssurance` throws 403
  (`step-up authentication required`) + audit when assurance is insufficient.
- Wired today: `PATCH /members` (role/status) passes `member.manage` as the
  step-up action — owner/admin must hold a stepped-up session.
- Elevating a session: `SessionRepository.elevate(id)` flips the flag AFTER
  out-of-band verification. No endpoint calls it yet — deliberate: wiring
  elevation without a real verifier would be theater. Phase 7 adds the
  verifier (TOTP/WebAuthn) + `POST /api/v1/auth/step-up` behind it.
