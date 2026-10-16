# AI / Agent Interface Contract — Phase 4
Date 2026-10-16. A.9 coordination ABOVE A.21 runtime. NEVER collapse.

- A.9 Coordination Plane: OrchestrationSession assigns ExecutionTasks, manages locks/escalation, supervises agents. Concepts: session, assignment, lock, escalation.
- A.21 Execution Plane: Agent/Policy/Run/Plan/Result lifecycle with budgets, HITL gates, per-tool-call audit.
- Flow: coordination proposes work → runtime plans → (high-risk?) approval gate → runtime executes via tools → verification/deploy tools consume Result as tool (not owned) → coordination closes/escalates.
- Boundaries: coordination never executes tools directly; runtime never self-approves; verification (A.17) and deployment (A.18) are tools invoked with evidence.
- Invariants: L5 banned; scoped principal; version-pinned execution; budget halt; every tool call audited.
- Screens: SCR-044 (A.9 orchestrate) vs SCR-040..043 (A.21 define/run/approve/automate).
