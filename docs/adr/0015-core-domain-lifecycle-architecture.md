# ADR 0015 — Core Domain Lifecycle Architecture
## Context
Phase 8 establishes the canonical domain kernel: Org->Workspace->Project, then
ClientRequest->Requirement->Proposal(+versions)->Contract->Project, then Task->Patch->Review->Deployment(record).
## Boundaries
D-01 Identity, D-02 Tenancy, D-03 Commercial, D-04 Engineering. AI/Ops/Data/Platform out of scope.
## Aggregates
ClientRequest, Requirement, Proposal(+versions as child), Contract, EngineeringTask, CodePatch(+reviews as child), Deployment.
## Entity vs Aggregate vs Repository vs Service vs Resource
Entity: single row with lifecycle. Aggregate: consistency boundary (Proposal+versions, Patch+reviews).
Repository: tenant-scoped SQL per aggregate. Domain service: cross-aggregate tx (AcceptProposal, SignContract, ConvertContractToProject, ApprovePatch).
API resource: HTTP projection of an aggregate; transitions via command endpoints, never raw status PATCH.

Date 2026-10-17. Phase 8.

## Lifecycles
ClientRequest submitted->elaborated->closed. Requirement draft->accepted. Proposal draft->in_review->sent->approved/rejected.
ProposalVersion draft->sent->approved (+superseded side-transition). Contract ready->signed->active.
Task planned->in_progress->in_review->done. Patch proposed->approved->applied (+superseded). Review requested->approved/changes_requested.
Deployment record supports triggered + idempotency; further states PROPOSED (deferred).
## Invariants
Org/ws/project ownership immutable (DB triggers). Approvals version-pinned. Sent versions immutable. Audit append-only. Cross-tenant prohibited.
## Authorization
Accept/sign/convert + deployment.create require step-up. Owner/manager full commercial; developer engineering + read commercial; client read-only.
## Transactions
AcceptProposal, Sign, Convert, ApprovePatch each single tx with audits.
## Idempotency
domain_idempotency(org, scope, key) PK + partial unique indexes; replay returns stored response.
## Concurrency
Optimistic version column; stale -> 409.
## Events/Audit
Mutation -> tx -> audit_events rows, server actor, correlation id, no secrets.
## Cross-domain refs
Commercial consumes Tenancy; Engineering consumes Project; Contract<->Project links.
## Rejected
Raw status PATCH; hard delete; distributed tx; event bus; deployment platform; AI coder.
## Deferred
Billing, notifications, integrations, AI runtime, release gating, environments.
