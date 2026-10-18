# ADR 0018 — Autonomous Engineering Architecture (Phase 11)

- **Status:** Accepted
- **Date:** 2026-10-18
- **Phase:** 11
- **Supersedes context:** ADR 0017 (AI Platform Runtime)
- **Builds on:** ADR 0012, 0013, 0014, 0015, 0016, 0017

## 1. Context

Phase 10 established the AI platform foundation: agents, versions, policies, runs, plans, results, tool registry, provider seam, deny-by-default policy, and A.9/A.21 separation. Phase 11 adds controlled **Autonomous Engineering**: AI reasons about an authorized engineering task, creates a bounded plan, generates a controlled patch, submits for review, responds to feedback — tenant-scoped, policy-controlled, auditable, unable to bypass human approval.

## 2. Decision — Execution Aggregate

Two new tables form the execution aggregate; everything else reuses existing Phase 8/9/10 artifacts:

| Table | Purpose |
|---|---|
| `engineering_runs` | Execution aggregate root: Org → Workspace → Project → Task → Agent → Policy → AI principal |
| `engineering_iterations` | Bounded Plan→Implement→Validate→Review→Revise cycle; one row per iteration |

Reused: `engineering_tasks`, `agent_plans`, `code_patches` (extended with AI provenance), `reviews`, `agent_runs`, `activity_events`, `audit_events`, `domain_idempotency`, `tool_definitions`/`tool_invocations`.

### EngineeringRun lifecycle

`planned → planning → waiting_approval → executing → validation → review → completed`
with terminal `escalated`, `failed`, `halted`.

### EngineeringValidationStatus (per iteration)

`generated → validation_failed | validation_passed → review_requested → changes_requested → (revise) | approved → applied → superseded`

### A.9 / A.21 responsibilities

- **A.9 Coordination:** sessions, assignments, locks, escalations. Never invokes tools.
- **A.21 Runtime:** agents, versions, policies, runs, plans, results, tool records. Execution behind provider seam.

AI is a scoped principal (`kind = "agent"`, `subjectId` = run id), never system/root/owner/DBA.

## 3. Authorization Boundaries

Every autonomous engineering operation enforces: authentication → organization isolation → workspace isolation → project isolation → task scope → AI principal permissions → policy evaluation (deny-by-default) → step-up → suspended/revoked denial → cross-tenant denial → cross-project denial → tool authorization → budget enforcement → concurrency control → idempotency.

AI may never: be an administrator, directly mutate canonical source, self-approve, merge/apply its own patch, deploy to production, bypass human approvals, or access unrestricted shell/filesystem/network/GitHub.

## 4. Tool Model

Engineering tools (seeded in migration 017): `task.read`, `project.context.read`, `requirement.read`, `repository.context.read`, `file.read` (risk: read); `patch.generate`, `patch.validate`, `test.run`, `lint.run`, `typecheck.run`, `review.request` (risk: high_risk). No unrestricted shell/filesystem/Git/GitHub/network/deployment tools.

## 5. Repository Boundary

No unrestricted host filesystem access. Deterministic controlled repository adapter: read project context, obtain source context, produce a patch (`code_patches` row — never direct mutation), validate the patch, preserve provenance. Repository text is untrusted input — never authorization. Phase 10 prompt-injection defenses apply.

## 6. Human Approval Boundary

`Task → AI Plan → Plan Approval → AI Implementation → Patch → Validation → Human Review → Approval → Apply`

AI may prepare artifacts but may not self-approve, self-merge, self-deploy, or bypass reviewers. Existing abstractions reused: `agent_plans.status`, `reviews.status`, `code_patches.status`, `engineering_tasks.status`.

## 7. Validation Pipeline

Interfaces for: syntax validation, type checking, tests, lint/static, patch integrity, policy validation. Status values: `generated`, `validation_failed`, `validation_passed`, `review_requested`, `changes_requested`, `approved`, `applied`, `superseded`. Patch success ≠ deployment success.

## 8. Iteration Model

Bounded loop: Plan → Implement → Validate → Review → Revise. Enforces: max iteration count, budget, timeout, cancellation, idempotency, audit event, correlation ID, failure classification. Limits reached → **ESCALATE**.

## 9. Review Feedback Loop

AI may consume review feedback and generate a new patch iteration. Must not: delete review history, overwrite patches, erase rejections, self-approve, bypass reviewers, mutate canonical review decision. Previous artifacts immutable/superseded.

## 10. Collaboration Integration

Uses Phase 9 `activity_events`. AI activity identifies AI principal. Event types: `ai.plan.submitted`, `ai.validation.completed`, `ai.patch.generated`, `ai.review.requested`, `ai.revision.requested`, `ai.escalated`.

## 11. Database

Forward-only migration `017_autonomous_engineering.sql`. No historical migrations rewritten. FK boundaries preserved. Transactions, optimistic concurrency, idempotency, append-only audit, deterministic constraints. No message broker.

## 12. Provider Boundary

Phase 10 `AIProvider` seam preserved (`generatePlan`, `generatePatch`, `analyzeFeedback`). No commercial vendor hard-coded. Deterministic test provider in tests. No fake production AI behavior.

## 13. API Surface

`/api/v1` contract: standard error envelopes, cursor pagination, deterministic ordering, correlation IDs, idempotency, authorization, tenant context.

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/engineering-runs` | POST | Create engineering run |
| `/api/v1/engineering-runs` | GET | List runs (cursor-paginated) |
| `/api/v1/engineering-runs/:id` | GET | Get run |
| `/api/v1/engineering-runs/:id/plan` | POST | Generate AI plan |
| `/api/v1/engineering-runs/:id/start` | POST | Start execution (post-approval) |
| `/api/v1/engineering-runs/:id/cancel` | POST | Cancel/halt run |
| `/api/v1/engineering-runs/:id/iterations` | GET | List iterations |
| `/api/v1/engineering-runs/:id/escalate` | POST | Escalate to human |

Does not duplicate task/patch/review/agent-run APIs.

## 14. Observability Seem

Captures: initiator, AI principal, agent version, policy version, task, project, plan, iteration, tools invoked, validation results, patch hashes, review decisions, final state, failure reason. `emitTelemetry()` hooks; no platform built yet.

## 15. Security Model

Deny-by-default. Tenant/workspace/project/task scoping. AI principal permissions via agent policy. Step-up for high-risk. Revoked/suspended denial. Cross-tenant/cross-project denial. Tool authorization via policy allowlist. Budget enforcement. Optimistic concurrency. Idempotency keys. Prompt-injection boundary.

## 16. Failure Model

Provider timeout/rate-limited → transient retry. Policy/tool denied, budget/iteration exhausted, cancelled, concurrency conflict, invalid output → terminal → escalate.

## 17. Concurrency

Optimistic `version` columns (stale → 409). Session locks. Single transaction per mutation. Idempotency keys prevent duplicates.

## 18. Idempotency

Run creation keys, tool invocation keys, `domain_idempotency` ledger. Replay returns stored response.

## 19. Explicit Non-Goals

Unrestricted autonomous coding, GitHub/Git integration, autonomous deployment/release, shell sandbox, arbitrary filesystem, model marketplace, billing, vector DB/RAG, long-term memory, Kubernetes, distributed infra, notifications, frontend/mobile, production observability.