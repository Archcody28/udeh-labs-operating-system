# ADR 0017 — AI Platform Runtime Architecture (Phase 10)

- **Status:** Accepted
- **Date:** 2026-10-17
- **Supersedes context:** ADR 0004 (PROPOSED — resolves it: A.9 coordinates, A.21 executes)
- **Builds on:** ADR 0012 (persistence), ADR 0013 (identity/auth), ADR 0014 (tenant isolation),
  ADR 0015 (core domain lifecycle), ADR 0016 (collaboration)

## Context

Phases 6–9 established identity, PostgreSQL persistence, the core domain kernel, and
collaboration coordination. CI (`runtime-foundation`) is green on `4803a37` against real
PostgreSQL. Phase 10 adds the AI platform foundation: a controlled plane through which AI
principals can eventually perform engineering work, without granting autonomous capability yet.

## Decision

### A.9 coordinates. A.21 executes.

- **A.9 coordination plane** (`orchestration_sessions`, `session_assignments`, `session_locks`,
  `session_escalations` from migration 005): creates assignments, selects agents, acquires locks,
  monitors, escalates. It NEVER invokes tools directly.
- **A.21 runtime plane** (`agents`, `agent_versions`, `agent_policies`, `agent_runs`,
  `agent_plans`, `agent_results`, tool records, from migration 006 + 016): owns actual
  execution semantics behind a provider-neutral seam.

### AI principal model

Human Principal, Organization, Project, Agent, AgentVersion, Policy — in that order.
AI is a scoped principal (`principal.kind = "agent"`, `subjectId` = run id), never
system/root/owner/DBA. Authority is explicitly scoped to one organization + project.

### Agent lifecycle and versioning

`agents`: id, organization, project scope, name, description, status
(defined, provisioned, retired), owner/creator, default version, policy reference,
timestamps, optimistic version. `agent_versions`: immutable configuration snapshot
(model identifier, system instructions, tool policy, budget policy, output constraints,
runtime config, definition_hash); pinned then superseded. Once used by a run, never mutated.
Every run references an immutable agent_version_id (reproducibility, audit, rollback).

### Policy model and evaluation

`agent_policies`: project scope, allowed/denied tools, model/provider, token/time/tool-call
budgets, approval requirements, data-access scope, execution mode. Restrictive by default.
Centralized evaluatePolicy() in domain/aiPolicy.ts: deterministic, testable, server-side,
auditable, deny-by-default. No scattered authorization checks across tools.

### Run and plan lifecycles

Run states from the repo contract: planning, waiting_approval, executing, succeeded,
with terminal failed and halted. Enforced by the agent_run transition machine.
Plan states: proposed, approved, denied, superseded. Plan is not approval is not execution.
Once approved or execution begins the plan row is immutable; material change creates a new
version with re-evaluation and possible re-approval.

## Tool boundary and provider seam

Tool registry (`tool_definitions`): stable id, name, description, input/output schema refs,
risk class (read, write, high_risk, external_side_effect), required permission, policy
requirements. Invocation records (`tool_invocations`): principal + org + project + agent
version + policy + tool + resource + plan + approval state evaluated centrally; decision
allowed or denied; idempotency key; result or failure. Phase 10 ships NO side-effecting
tools — read-only/safe seeds only; repository-write, shell, deployment deferred.

Provider seam: AIProvider interface in domain/aiProvider.ts. Domain entities never import a
vendor SDK and none is added. When no provider is configured the runtime raises
provider_unavailable — never fabricated output. Tests use a deterministic test double
behind the interface (tests/aiTestProvider.ts).

## Budgets, cancellation, timeouts, retries, idempotency

Budgets: token budget (where supported), wall-clock timeout, tool-call count. Exhaustion
stops execution with a terminal state + audit; no billing. Cancellation: authorized,
auditable, concurrency-safe (halted); cancel requested is distinct from execution
terminated. Timeouts: explicit boundary on every execution; hung provider/tool records
timeout + elapsed + terminal state + error category. Retries: transient provider failure,
timeout, rate-limit only; never auto-retry a side-effecting tool without guaranteed
idempotency; policy-aware. Idempotency: run creation keys, tool invocation keys,
single-decision approval consumption, plan execution guards.

## Input, output, secrets, audit, observability

Untrusted content (user/project data, tool output) is labeled and never redefines
authorization: system policy outranks agent policy outranks developer config outranks
project/user content outranks tool output. Model output is validated against schemas
before becoming an action; malformed calls, unknown tools, unauthorized params, invalid
resource IDs, oversized outputs are rejected. Secrets stay server-side, scoped,
policy-controlled, never in prompts/context. No plaintext provider credential storage;
that integration boundary is deferred.

Audit events: agent.created, agent.version.created, policy.created/updated, run.created,
run.started, run.cancelled, run.completed, run.failed, plan.created, plan.approved,
tool.requested, tool.allowed/denied, tool.completed/failed, escalation.created.
Server-derived actor identity; AI-supplied actor metadata never trusted. Retention keeps
only data needed for reproducibility/debugging/audit/visibility. Observability seam:
structured emitTelemetry() hooks (run/correlation/agent/version/provider/model/duration/
tool/result/failure/usage); no platform is built.

## API

/api/v1 conventions: POST/GET /agents; POST/GET /agents/:id/versions;
POST /agents/:id/provision; GET/PATCH /agents/:id/policies; POST/GET /agent-runs;
GET/PATCH /agent-runs/:id (cancel); POST/GET /agent-runs/:id/plans;
POST /agent-runs/:id/plans/:planId/approve; GET /agent-runs/:id/results;
POST/GET /orchestration-sessions; POST /orchestration-sessions/:id/assignments;
POST /orchestration-sessions/:id/locks; POST /orchestration-sessions/:id/escalations.
All authenticated, tenant-scoped, project-aware, permission-checked, correlation-aware,
audited. AI permissions: agent.read/create/update/run/cancel, agent.plan.read/approve,
agent.result.read, agent.tool.execute, agent.policy.read/update,
orchestration.session.create/manage.

## Rejected alternatives

Layered A.9/A.21 kept (A.21-supersedes-A.9 rejected). Permissive-default policy rejected.
Embedded provider SDK rejected. Fake provider output rejected. Second approval system
rejected (reuses authorization/review concepts). Global locks rejected (scoped + leased).

## Deferred autonomous capabilities

Autonomous coding, repository-write tools, GitHub App, shell/filesystem, production
deployment, autonomous merge/release, model marketplace, billing, notification delivery,
worker infra (queue/bus/k8s), vector DB/RAG, long-term memory platform, full AI UI,
multi-agent swarms, self-modifying agents, production model/provider selection,
credential storage, cost allocation, retention windows, external tool catalog,
autonomous execution authority.

