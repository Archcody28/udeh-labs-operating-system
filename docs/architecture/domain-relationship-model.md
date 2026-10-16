# Domain Relationship Model — Phase 4
Date 2026-10-16. Conceptual; no foreign keys.

Organization 1—* Workspace (owns; cascade-archive conceptually; immutable org link).
Workspace 1—* Project (owns; archive with workspace; move UNRESOLVED→prohibited default).
Project 1—* EngineeringTask/ExecutionTask/CodePatch/Review; 1—* AgentRun/Plan/Result; 1—* Deployment/VerificationRun/Release/Incident-link.
Organization 1—* Membership/Invitation/Dataset/DataPolicy/Decision/Environment/ApiCredential.
ClientRequest 1—* Requirement; 1—* Proposal 1—* ProposalVersion; Proposal 1—1 Contract 1—* Project-trigger.
Agent 1—* AgentVersion 1—* AgentRun 1—* AgentPlan/AgentResult; AgentPolicy *—* AgentRun (binding pin).
OrchestrationSession (A.9) 1—* ExecutionTask; coordinates AgentRuns without owning runtime (A.21).
AuditEvent *—1 target entity; carries org/ws/project + correlationId; append-only, no cascade delete.
Cardinality where evidenced above; else UNRESOLVED. No deletion cascades data loss for audit/commercial signed packages.
