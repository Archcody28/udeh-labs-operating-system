# ADR 0004 — AI Engineering Orchestration Drift (Phase A.9 vs A.21)

- **Status:** Proposed (unresolved — genuine architectural fork)
- **Date:** 2026-10-16

## Conflicting artifacts

- `stitch_udehlabs_operating_system/udehlabs_ai_engineering_orchestration_architecture_doc_1.md` (31 lines)
- `stitch_udehlabs_operating_system/udehlabs_ai_engineering_orchestration_architecture_doc_2.md` (43 lines)

## Evidence

Both files verified by direct read on 2026-10-16. Unlike the near-identical
pairs in ADRs 0002/0003/0005/0007, these describe DIFFERENT systems:

- **doc_1:** "AI Engineering Orchestration & Multi-Agent Coordination
  Architecture" — Phase A.9 **Autonomous Engineering Orchestrator**:
  `OrchestrationSession`, `AgentRegistry`, `AgentAssignmentEngine`,
  `OrchestrationGraph`, `ResourceLockManager`, autonomy levels L0–L4
  (L5 explicitly disabled).
- **doc_2:** "Autonomous AI Engineering Orchestration & Agent Runtime
  Architecture" — Phase A.21 **Agent Runtime & Orchestration Layer**:
  `IAgentRuntime`, `IAgentOrchestrator`, `IExecutionPolicyEngine`,
  `AgentRun`/`AgentPlan`/`AgentPolicy`/`AgentResult`, hierarchical
  delegation, knowledge-graph grounding (A.20), verification (A.17) and
  deployment (A.18) as tools.

## Similarities

Shared vocabulary (agents, orchestration, policy, HITL, sandboxing) and
shared traceability intent.

## Differences

Different phase numbers (A.9 vs A.21), different component models,
different data models, different integration points. These are two
generations or two competing designs, not copies.

## Unresolved questions

1. Does A.21 supersede A.9, or do both layers coexist (coordination vs runtime)?
2. Which interfaces (`AgentAssignmentEngine` vs `IAgentOrchestrator`, etc.)
   are binding on future implementation?
3. Is the L5-autonomy ban (doc_1) still policy under the A.21 runtime?

## Proposed decision

None yet — requires architect review of the Phase A.9 → A.21 evolution.
Both specs preserved; no implementation may assume either.

## Decision status

PROPOSED. Architectural review required.
