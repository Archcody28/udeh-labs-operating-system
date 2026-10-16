# Interface Contract — AI Agents & Orchestration (SCR-040..044)
Layers: A.9 coordination (OrchestrationSession/Assignment/Locks) ABOVE A.21 runtime (AgentRun/Plan/Policy/Result). No supersession.
## Actor: AI-eng, operator, approver; AI agent as scoped principal.
## Inputs: goal, policy, bounded context packet (A.20), approval decision.
## Outputs: AgentPlan versions, AgentResult + verification evidence.
## Actions: define/provision agent, run plan, approve/deny HITL, delegate to specialists, halt.
## Preconditions: AgentPolicy bound; budget set; tenant isolation enforced (A.33).
## Permissions: policy-bound tools; high-risk (deploy/secrets)→ApprovalRequest; L5 autonomy banned (A.9 invariant).
## States: planning, waiting-approval, executing, loading, processing, success, failed, error, stale (superseded plan), offline (sandbox).
## Transitions: propose→approval→execute; deny→replan; budget breach→halt; every tool call→audit.
## Data: Agent, AgentRun, AgentPlan, AgentPolicy, AgentResult, Workflow (conceptual).
## Audit: every tool call/reasoning/approval immutable (A.21).
