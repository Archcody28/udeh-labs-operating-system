# ADR 0009 — Authentication / Login / Onboarding Overlap

- **Status:** Partially accepted (Phase 3: conceptual identity model RESOLVED per organization_architecture_doc + A.33 — User→Member(org-scoped Role)→Invitation; org = tenant; AI = scoped principal; verification separate from authN. Mechanism — credentials/SSO/MFA/session — and onboarding-flow unification REMAIN Proposed → HD-01narrow/HD-07)
- **Date:** 2026-10-16

## Conflicting artifacts (top-level concept directories surveyed 2026-10-16)

- `stitch_udehlabs_operating_system/udehlabs_login/`
- `stitch_udehlabs_operating_system/udehlabs_access_governance_zero_trust_matrix/`
- `stitch_udehlabs_operating_system/udehlabs_client_onboarding/`
- `stitch_udehlabs_operating_system/udehlabs_developer_onboarding/`
- `stitch_udehlabs_operating_system/udehlabs_organization_setup/`
- `stitch_udehlabs_operating_system/udehlabs_account_settings_security/`
- `stitch_udehlabs_operating_system/udehlabs_activation_ready/` and
  `stitch_udehlabs_operating_system/phase_p.09_intelligence/` (activation/strategy context)

Each directory contains its own `code.html` mockup plus PNG assets; auth
surface is thus spread across at least six overlapping concepts (login,
zero-trust governance, two onboarding flows, org setup, account security).

## Evidence

Directory-name survey of `stitch_udehlabs_operating_system/` on 2026-10-16.
Per-file content comparison was out of scope for Phase 1; overlap is
established at the concept-inventory level, not the line level.

## Similarities

All concepts orbit identity, access, and first-run enrollment.

## Differences (to be verified)

Unclear which mockup owns: credential login vs SSO, invite/approval flow,
org provisioning, developer vs client onboarding, session/security
management. The zero-trust matrix doc may constrain all of them — or
conflict with them.

## Unresolved questions

1. Canonical authN/authZ model (credentials, SSO, MFA, session)?
2. One onboarding flow or distinct client/developer/org flows?
3. Relationship of the zero-trust matrix to each mockup.
4. Which screens (if any) carry forward vs retire?

## Proposed decision

None. A later phase must map every auth-adjacent mockup screen-by-screen
and select the canonical flows. NO authentication runtime is implemented
or implied by this ADR.

## Decision status

PROPOSED. Screen-level audit required.
