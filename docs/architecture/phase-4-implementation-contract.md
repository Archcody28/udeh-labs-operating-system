# Phase 4 Implementation Contract
Date 2026-10-16. Binding on Phase 4 engineers.

## Approved for implementation (Phase 4 may: domain modeling + IA scaffolding docs only — NO runtime yet unless gated decision clears)
- Use canonical IDs (SCR-xxx), surface names, journey IDs, layered orchestration vocabulary (A.9 coordination vs A.21 runtime), workforce-vs-workspace naming.
- Reference canonical content files with `_1` filename as canonical pointer for duplicate pairs (content identical); never delete `_2` source files.
- Follow org→workspace→project hierarchy + organizationId scoping concept; zero-trust envelope; L5 ban; audit-everything invariants.

## Prohibited until later
- No React/routes/state, APIs, DB schemas/migrations, auth runtime, RBAC code, AI providers/agents, billing, infra (per Phase 2 boundaries, still in force).
- No theme-dir promotion; no dashboard iteration deletion; no A.9/A.21 collapse.

## Architectural invariants (must not violate)
1. Organization = primary tenant; workspace belongs to org; server resolves currentOrganization.
2. L5 full autonomy disabled. 3. Agents are scoped principals; high-risk→HITL. 4. Proposal approvals version-pinned. 5. Every agent tool call + security event audited.

## Unresolved blockers
- Auth mechanism/SSO/MFA, onboarding unification, shell composition, dashboard iteration picks, SRE consolidation, accent/motion tokens → Phase 4 MUST NOT implement these areas; docs/scaffolding only where marked.

## Required future dependencies
Identity provider → tenancy enforcement → domain model → API → AI gateway → observability, each gated by its human decision.
