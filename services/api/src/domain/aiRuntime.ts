/** A.21 runtime plane: Agent → Policy → Run → Plan → Tool Call → Result (Phase 10). */
import { createHash } from "node:crypto";
import { PoolClient } from "pg";
import { TenantContext } from "./tenancy.js";
import { withTransaction } from "../persistence/db.js";
import { AuditRepository } from "../persistence/auditRepository.js";
import { AiRepository } from "../persistence/aiRepository.js";
import { evaluateToolCall, checkBudget, validateDraftOutput, ToolRisk } from "./aiPolicy.js";
import { AiError, sanitizeUntrusted } from "./aiErrors.js";
import { AIProvider, UnavailableProvider } from "./aiProvider.js";
import { assertTransition } from "./lifecycle.js";
import { validateName } from "./lifecycle.js";

const audits = new AuditRepository();
const repos = new AiRepository();

export interface TelemetryEvent {
  runId: string; correlationId: string; agentId?: string; agentVersionId?: string;
  provider?: string; model?: string; durationMs?: number; toolId?: string;
  result?: string; failureCategory?: string; usage?: Record<string, unknown>;
}
const telemetryHooks: Array<(e: TelemetryEvent) => void> = [];
/** Observability seam: later phases consume these hooks; no platform is built here. */
export function onTelemetry(hook: (e: TelemetryEvent) => void): void {
  telemetryHooks.push(hook);
}
export function emitTelemetry(e: TelemetryEvent): void {
  for (const h of telemetryHooks) { try { h(e); } catch { /* hooks never break runs */ } }
}

export function hashJson(v: unknown): string {
  return createHash("sha256").update(JSON.stringify(v)).digest("hex");
}

let provider: AIProvider = new UnavailableProvider();
/** Provider injection point (tests supply a deterministic double; prod config later). */
export function setProvider(p: AIProvider): void { provider = p; }

export class AgentRuntime {
  async createAgent(ctx: TenantContext, projectId: string | null, name: string,
    description: string, ownerId: string, actorId: string) {
    validateName(name);
    return withTransaction(async (tx: PoolClient) => {
      const agent = await repos.createAgent(ctx, projectId, name, description?.slice(0, 2000) ?? "", ownerId, tx);
      await audits.append({ ...ctx, projectId: projectId ?? undefined, actorId, principalType: "human" },
        "agent.created", "agent", agent.id, "success", {}, tx);
      return agent;
    });
  }

  async createVersion(ctx: TenantContext, agentId: string, config: {
    model: string; systemInstructions: string; toolPolicy?: unknown;
    budgetPolicy?: unknown; outputConstraints?: unknown; runtimeConfig?: unknown;
  }, actorId: string) {
    if (!config.model || !config.systemInstructions) {
      const { ValidationError } = await import("./errors.js");
      throw new ValidationError("model and systemInstructions required");
    }
    const hash = hashJson(config);
    return withTransaction(async (tx: PoolClient) => {
      await repos.findAgent(ctx, agentId, tx);
      const existing = await repos.findVersionByHash(ctx, agentId, hash, tx);
      if (existing) return existing;
      const count = await repos.countVersions(ctx, agentId, tx);
      const row = await repos.createVersion(ctx, agentId, count + 1, hash,
        config as Record<string, unknown>, tx);
      await audits.append({ ...ctx, actorId, principalType: "human" },
        "agent.version.created", "agent_version", row.id, "success", { agentId }, tx);
      return row;
    });
  }

  async provision(ctx: TenantContext, agentId: string, version: number, actorId: string) {
    return withTransaction(async (tx: PoolClient) => {
      const agent = await repos.findAgent(ctx, agentId, tx);
      const target = await repos.findVersionByNo(ctx, agentId, version, tx);
      if (agent.default_version_id) {
        await repos.supersedeVersion(ctx, agent.default_version_id, tx);
      }
      const out = await repos.setAgentDefaults(ctx, agentId, target.id, "provisioned", version, tx);
      await audits.append({ ...ctx, actorId, principalType: "human" },
        "agent.provisioned", "agent", agentId, "success", { versionId: target.id }, tx);
      return out;
    });
  }

  async createPolicy(ctx: TenantContext, agentId: string, projectId: string | null, doc: {
    allowedTools: string[]; deniedTools?: string[]; model?: string;
    maxTokens?: number; timeoutMs?: number; maxToolCalls?: number;
    approvalRequired?: boolean; executionMode?: string;
  }, actorId: string) {
    return withTransaction(async (tx: PoolClient) => {
      const row = await repos.createPolicy(ctx, agentId, projectId, {
        allowed_tools: doc.allowedTools,
        denied_tools: doc.deniedTools ?? [],
        model: doc.model ?? null, max_tokens: doc.maxTokens ?? null,
        timeout_ms: doc.timeoutMs ?? 120000, max_tool_calls: doc.maxToolCalls ?? 25,
        approval_required: doc.approvalRequired ?? true, execution_mode: doc.executionMode ?? "supervised",
      }, tx);
      await audits.append({ ...ctx, projectId: projectId ?? undefined, actorId, principalType: "human" },
        "policy.created", "agent_policy", row.id, "success", { agentId }, tx);
      return row;
    });
  }

  /** Start a run: pins agent version + policy, records idempotency, audits. */
  async startRun(ctx: TenantContext, projectId: string, agentId: string, key: string,
    untrustedInput: string, actorId: string, sessionId?: string) {
    sanitizeUntrusted(untrustedInput);
    return withTransaction(async (tx: PoolClient) => {
      const dup = await repos.findRunByKey(key, tx);
      if (dup) return dup;
      const agent = await repos.findAgent(ctx, agentId, tx);
      if (!agent.default_version_id) {
        const { ConflictError } = await import("./errors.js");
        throw new ConflictError("agent has no pinned default version");
      }
      const version = await repos.findVersion(ctx, agent.default_version_id, tx);
      const policy = await repos.activePolicyFor(ctx, agentId, tx);
      const run = await repos.createRun(ctx, projectId, agentId, version.id, policy?.id ?? null,
        sessionId ?? null, key, tx);
      await audits.append({ ...ctx, projectId, actorId, principalType: "human" },
        "run.created", "agent_run", run.id, "success", { agentId, versionId: version.id }, tx);
      emitTelemetry({ runId: run.id, correlationId: ctx.correlationId, agentId,
        agentVersionId: version.id, result: "created" });
      return run;
    });
  }

  async cancelRun(ctx: TenantContext, runId: string, version: number, actorId: string) {
    return withTransaction(async (tx: PoolClient) => {
      const run = await repos.findRun(ctx, runId, tx);
      assertTransition("agent_run", run.status, "halted");
      const out = await repos.setRunStatus(ctx, runId, "halted", version, tx);
      await audits.append({ ...ctx, projectId: run.project_id, actorId, principalType: "human" },
        "run.cancelled", "agent_run", runId, "success", {}, tx);
      emitTelemetry({ runId, correlationId: ctx.correlationId, result: "cancelled" });
      return out;
    });
  }

  async proposePlan(ctx: TenantContext, runId: string, steps: unknown[], actorId: string) {
    if (!Array.isArray(steps) || steps.length === 0 || steps.length > 50) {
      const { ValidationError } = await import("./errors.js");
      throw new ValidationError("plan steps must be 1..50 items");
    }
    return withTransaction(async (tx: PoolClient) => {
      const run = await repos.findRun(ctx, runId, tx);
      if (run.status !== "planning" && run.status !== "waiting_approval") {
        const { ConflictError } = await import("./errors.js");
        throw new ConflictError("plan can only be proposed while run is planning");
      }
      const row = await repos.createPlan(ctx, runId, hashJson(steps), { steps }, tx);
      await audits.append({ ...ctx, projectId: run.project_id, actorId, principalType: "human" },
        "plan.created", "agent_plan", row.id, "success", { runId }, tx);
      return row;
    });
  }

  /** Approve a plan: human-only, single-decision, version-pinned. AI can never self-approve. */
  async approvePlan(ctx: TenantContext, runId: string, planId: string, version: number,
    approverKind: "human" | "agent" | "system", actorId: string) {
    if (approverKind !== "human") {
      const { ForbiddenError } = await import("./authorization.js");
      throw new ForbiddenError("AI cannot self-approve");
    }
    return withTransaction(async (tx: PoolClient) => {
      const run = await repos.findRun(ctx, runId, tx);
      const plan = await repos.findPlan(ctx, planId, tx);
      if (plan.run_id !== runId) {
        const { ConflictError } = await import("./errors.js");
        throw new ConflictError("plan does not belong to run");
      }
      if (plan.status !== "proposed") {
        const { ConflictError } = await import("./errors.js");
        throw new ConflictError("approval already consumed or superseded");
      }
      const out = await repos.setPlanStatus(ctx, planId, "approved", version, tx);
      await repos.setRunStatus(ctx, runId, "waiting_approval", run.version, tx);
      await audits.append({ ...ctx, projectId: run.project_id, actorId, principalType: "human" },
        "plan.approved", "agent_plan", planId, "success", { runId }, tx);
      return out;
    });
  }

  /** Execute: plan gate, provider draft, validate, policy-gated tools, result. */
  async executeRun(ctx: TenantContext, runId: string, actorId: string) {
    const startedAt = Date.now();
    const run = await repos.findRun(ctx, runId);
    assertTransition("agent_run", run.status, "executing");
    const version = await repos.findVersion(ctx, run.agent_version_id);
    const policy = run.policy_id ? await repos.findPolicy(ctx, run.policy_id) : null;
    const cfg = version.config as { model?: string; systemInstructions?: string };
    try {
      const plan = await repos.latestPlan(ctx, runId);
      if (!plan || plan.status !== "approved") {
        throw new AiError("policy_denied", "execution requires an approved plan", {});
      }
      const pDoc = policy ? {
        id: policy.id, organization_id: policy.organization_id, project_id: policy.project_id,
        agent_id: policy.agent_id, allowed_tools: policy.allowed_tools,
        denied_tools: policy.denied_tools, model: policy.model, max_tokens: policy.max_tokens,
        timeout_ms: policy.timeout_ms, max_tool_calls: policy.max_tool_calls,
        approval_required: policy.approval_required, execution_mode: policy.execution_mode,
        status: policy.status,
      } : null;
      const timeoutMs = pDoc?.timeout_ms ?? 120000;
      const draft = await this.withTimeout(provider.generate({
        runId, organizationId: ctx.organizationId, projectId: run.project_id,
        agentId: run.agent_id, agentVersionId: run.agent_version_id,
        model: cfg.model ?? "unspecified", systemInstructions: cfg.systemInstructions ?? "",
        untrustedInput: "[withheld: summarized, never authorization]",
        allowedTools: pDoc?.allowed_tools ?? [],
        budget: { maxTokens: pDoc?.max_tokens ?? undefined, timeoutMs,
          maxToolCalls: pDoc?.max_tool_calls ?? 25 },
      }), timeoutMs, "provider");
      validateDraftOutput(draft, pDoc?.allowed_tools ?? []);
      const usage = { tokens: (draft.usage?.inputTokens ?? 0) + (draft.usage?.outputTokens ?? 0),
        elapsedMs: Date.now() - startedAt, toolCalls: draft.toolRequests.length };
      if (pDoc) {
        const budget = checkBudget(pDoc, usage);
        if (!budget.allowed) throw new AiError("budget_exceeded", budget.reason, {});
      }
      let used = 0;
      const toolOutputs: unknown[] = [];
      for (const t of draft.toolRequests) {
        const def = await repos.findTool(t.toolId);
        if (!def) throw new AiError("tool_denied", `unknown tool: ${t.toolId}`, {});
        const decision = pDoc ? evaluateToolCall({
          policy: pDoc, organizationId: ctx.organizationId, projectId: run.project_id,
          toolId: t.toolId, risk: def.risk_class as ToolRisk,
          planApproved: true, approvalConsumed: true, toolCallsUsed: used,
        }) : { allowed: false, reason: "no policy bound" };
        await repos.recordToolInvocation(ctx, runId, t.toolId,
          t.input as Record<string, unknown>,
          decision.allowed ? "allowed" : "denied", `k-${runId}-${used}`, decision.reason);
        await audits.append({ ...ctx, projectId: run.project_id, actorId, principalType: "agent" },
          decision.allowed ? "tool.allowed" : "tool.denied", "tool", t.toolId,
          decision.allowed ? "success" : "denied", { runId, reason: decision.reason });
        if (!decision.allowed) throw new AiError("tool_denied", decision.reason, {});
        used += 1;
        toolOutputs.push({ toolId: t.toolId, note: "no side-effecting tools in Phase 10" });
      }
      return withTransaction(async (tx: PoolClient) => {
        const payload = { summary: draft.summary.slice(0, 4000), steps: draft.steps, toolOutputs };
        const result = await repos.createResult(ctx, runId, hashJson(payload), payload, tx);
        await repos.setRunStatus(ctx, runId, "succeeded", run.version, tx);
        await audits.append({ ...ctx, projectId: run.project_id, actorId, principalType: "agent" },
          "run.completed", "agent_run", runId, "success", {}, tx);
        emitTelemetry({ runId, correlationId: ctx.correlationId, agentId: run.agent_id,
          provider: provider.name, durationMs: Date.now() - startedAt, result: "succeeded", usage });
        return result;
      });
    } catch (err) {
      const category = err instanceof AiError ? err.category : "tool_failed";
      await repos.setRunStatus(ctx, runId, category === "cancelled" ? "halted" : "failed", run.version)
        .catch(() => undefined);
      await audits.append({ ...ctx, projectId: run.project_id, actorId, principalType: "agent" },
        "run.failed", "agent_run", runId, "failed", { category }).catch(() => undefined);
      emitTelemetry({ runId, correlationId: ctx.correlationId, failureCategory: category, result: "failed" });
      throw err;
    }
  }
  private withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const t = setTimeout(() => reject(new AiError("provider_timeout",
        `${what} timed out after ${ms}ms`, { transient: true })), ms);
      p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
    });
  }
}
export const agentRuntime = new AgentRuntime();
