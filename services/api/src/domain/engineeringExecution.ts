/** Phase 11: Autonomous Engineering execution domain service. */
import { PoolClient } from "pg";
import { TenantContext } from "./tenancy.js";
import { withTransaction } from "../persistence/db.js";
import { AuditRepository } from "../persistence/auditRepository.js";
import { engineeringExecutionRepository } from "../persistence/engineeringExecutionRepository.js";
import { PatchRepository } from "../persistence/engineeringRepositories.js";
import { AiError, sanitizeUntrusted } from "./aiErrors.js";
import { AIProvider } from "./aiProvider.js";
import { hashJson } from "./aiRuntime.js";
import { recordActivity } from "./collaborationService.js";
import { NotFoundError } from "./errors.js";
import { ForbiddenError } from "./authorization.js";

const execRepo = engineeringExecutionRepository;
const patches = new PatchRepository();
const auditRepo = new AuditRepository();

export interface RunBudget {
  maxTokens?: number;
  timeoutMs: number;
  maxToolCalls: number;
}

export interface CreateRunInput {
  projectId: string;
  taskId: string;
  agentId: string;
  agentVersionId: string;
  policyId: string;
  maxIterations?: number;
  budget?: RunBudget;
  idempotencyKey?: string;
}

export class EngineeringExecutionService {
  private provider: AIProvider | null = null;

  setProvider(p: AIProvider): void { this.provider = p; }

  async createRun(ctx: TenantContext, input: CreateRunInput, actorId: string) {
    if (!input.projectId || !input.agentId || !input.agentVersionId || !input.policyId) {
      throw new Error("projectId, agentId, agentVersionId, policyId required");
    }
    const maxIterations = Math.min(Math.max(input.maxIterations ?? 5, 1), 20);
    const budget: Record<string, unknown> = {
      maxTokens: input.budget?.maxTokens ?? null,
      timeoutMs: input.budget?.timeoutMs ?? 120000,
      maxToolCalls: input.budget?.maxToolCalls ?? 25,
      consumed: { tokens: 0, toolCalls: 0, elapsedMs: 0 }
    };
    return withTransaction(async (tx: PoolClient) => {
      const idemKey = input.idempotencyKey ?? null;
      const run = await execRepo.createRun(ctx, input.projectId, input.taskId, input.agentId,
        input.agentVersionId, input.policyId, ctx.actorId ?? actorId, ctx.correlationId,
        maxIterations, budget, idemKey, tx);
      await auditRepo.append({ ...ctx, projectId: input.projectId, actorId, principalType: "agent" },
        "engineering.run.created", "engineering_run", run.id, "success",
        { taskId: input.taskId, agentId: input.agentId, maxIterations }, tx);
      await recordActivity(ctx, input.projectId, "task.created", "engineering_task",
        input.taskId, { runId: run.id, action: "ai_run_created" }, tx);
      return run;
    });
  }

  async generatePlan(ctx: TenantContext, runId: string, actorId: string,
    untrustedInput: string) {
    return withTransaction(async (tx: PoolClient) => {
      const run = await execRepo.findRun(ctx, runId, tx);
      if (run.status !== "planned" && run.status !== "planning") {
        throw new Error(`run not in plan-able state: ${run.status}`);
      }
      const cleanInput = sanitizeUntrusted(untrustedInput);
      await execRepo.transitionRun(ctx, runId, run.version, "planning", tx);
      await execRepo.incrementIteration(ctx, runId, tx);
      const policy = await this.findPolicy(ctx, run.policy_id, tx);
      const startedAt = Date.now();
      let draft: any;
      try {
        if (!this.provider) throw new Error("no AI provider configured");
        draft = await this.provider.generate({
          runId, organizationId: ctx.organizationId, projectId: run.project_id,
          agentId: run.agent_id, agentVersionId: run.agent_version_id,
          model: policy.model ?? "test", systemInstructions: "Generate an engineering plan",
          untrustedInput: cleanInput,
          allowedTools: policy.allowed_tools,
          budget: { maxTokens: policy.max_tokens ?? undefined, timeoutMs: policy.timeout_ms, maxToolCalls: policy.max_tool_calls }
        });
      } catch (err) {
        await execRepo.transitionRun(ctx, runId, run.version + 1, "failed", tx);
        await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: "agent" },
          "engineering.plan.failed", "engineering_run", runId, "failed",
          { reason: err instanceof Error ? err.message : String(err) }, tx);
        throw err;
      }
      const contentHash = hashJson(draft);
      const plan = await this.createPlan(ctx, runId, contentHash, draft, tx);
      await execRepo.transitionRun(ctx, runId, run.version + 1, "waiting_approval", tx);
      await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: "agent" },
        "engineering.plan.submitted", "engineering_run", runId, "success",
        { planId: plan.id, iteration: run.iteration_count, contentHash }, tx);
      await recordActivity(ctx, run.project_id, "ai.plan.submitted", "engineering_run",
        runId, { planId: plan.id, iteration: run.iteration_count }, tx);
      return { plan, run };
    });
  }

  async approvePlan(ctx: TenantContext, runId: string, planId: string, runVersion: number,
    planVersion: number, decision: "approved" | "denied", note: string, actorId: string) {
    if (decision !== "approved" && decision !== "denied") {
      throw new Error("decision must be 'approved' or 'denied'");
    }
    return withTransaction(async (tx: PoolClient) => {
      const run = await execRepo.findRun(ctx, runId, tx);
      if (run.status !== "waiting_approval") {
        throw new Error(`run not awaiting approval: ${run.status}`);
      }
      const plan = await this.findPlan(ctx, planId, tx);
      if (plan.run_id !== runId) throw new Error("plan does not belong to run");
      if (plan.status !== "proposed") throw new Error(`plan already ${plan.status}`);
      if (ctx.principalType === "agent") throw new ForbiddenError("AI cannot approve its own plan");
      await this.updatePlanStatus(ctx, planId, planVersion, decision, tx);
      const next = decision === "approved" ? "executing" : "halted";
      await execRepo.transitionRun(ctx, runId, runVersion, next, tx);
      await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: "human" },
        `engineering.plan.${decision}`, "engineering_run", runId, "success",
        { planId, note }, tx);
      await recordActivity(ctx, run.project_id, "task.transitioned", "engineering_run",
        runId, { planId, decision, note }, tx);
      return { run, plan, decision };
    });
  }

  async startExecution(ctx: TenantContext, runId: string, actorId: string) {
    return withTransaction(async (tx: PoolClient) => {
      const run = await execRepo.findRun(ctx, runId, tx);
      if (run.status !== "executing") {
        throw new Error(`run not in executing state: ${run.status}`);
      }
      await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: "agent" },
        "engineering.execution.started", "engineering_run", runId, "success", {}, tx);
      await recordActivity(ctx, run.project_id, "task.transitioned", "engineering_run",
        runId, { status: "executing" }, tx);
      return run;
    });
  }

  async implementPatch(ctx: TenantContext, runId: string, actorId: string,
    untrustedInput: string) {
    return withTransaction(async (tx: PoolClient) => {
      const run = await execRepo.findRun(ctx, runId, tx);
      if (run.status !== "executing") {
        throw new Error(`run not executing: ${run.status}`);
      }
      if (run.iteration_count >= run.max_iterations) {
        await execRepo.transitionRun(ctx, runId, run.version, "escalated", tx);
        await execRepo.setRunFailure(ctx, runId, run.version + 1, "iteration_exhausted", tx);
        throw new AiError("budget_exceeded", "max iterations reached", {});
      }
      const cleanInput = sanitizeUntrusted(untrustedInput);
      const policy = await this.findPolicy(ctx, run.policy_id, tx);
      let draft: any;
      try {
        if (!this.provider) throw new Error("no AI provider configured");
        draft = await this.provider.generate({
          runId, organizationId: ctx.organizationId, projectId: run.project_id,
          agentId: run.agent_id, agentVersionId: run.agent_version_id,
          model: policy.model ?? "test", systemInstructions: "Generate a code patch",
          untrustedInput: cleanInput,
          allowedTools: policy.allowed_tools,
          budget: { maxTokens: policy.max_tokens ?? undefined, timeoutMs: policy.timeout_ms, maxToolCalls: policy.max_tool_calls }
        });
      } catch (err) {
        await execRepo.transitionRun(ctx, runId, run.version, "failed", tx);
        throw err;
      }
      const iterationNumber = run.iteration_count + 1;
      const iteration = await execRepo.createIteration(ctx, run.project_id, runId, iterationNumber, tx);
      const patchContent = JSON.stringify(draft);
      const patchHash = hashJson(draft);
      const patch = await patches.create(ctx, run.project_id, patchContent, patchHash, tx);
      await patches.transition(ctx, patch.id, patch.version, "proposed", tx);
      await execRepo.setIterationPatch(ctx, iteration.id, iteration.version, patch.id, tx);
      await execRepo.transitionIteration(ctx, iteration.id, "generated", tx);
      await tx.query(
        `UPDATE code_patches SET generating_principal_id=$1, agent_version_id=$2, policy_id=$3,
          is_ai_generated=TRUE, source_context_ref=$4 WHERE id=$5`,
        [ctx.actorId ?? actorId, run.agent_version_id, run.policy_id, cleanInput.slice(0, 1000), patch.id]);
      await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: "agent" },
        "engineering.patch.generated", "code_patch", patch.id, "success",
        { runId, iteration: iterationNumber, patchHash }, tx);
      await recordActivity(ctx, run.project_id, "ai.patch.generated", "code_patch",
        patch.id, { runId, iteration: iterationNumber }, tx);
      return { iteration, patch, run };
    });
  }

  async validatePatch(ctx: TenantContext, runId: string, iterationId: string, actorId: string) {
    return withTransaction(async (tx: PoolClient) => {
      const run = await execRepo.findRun(ctx, runId, tx);
      const iteration = await execRepo.findIteration(ctx, iterationId, tx);
      if (iteration.engineering_run_id !== runId) throw new Error("iteration does not belong to run");
      if (iteration.validation_status !== "generated") {
        throw new Error(`iteration not in generated state: ${iteration.validation_status}`);
      }
      const patch = await patches.find(ctx, iteration.patch_id ?? "", tx) as { diff: string | null };
      if (!patch) throw new NotFoundError("code_patches");
      const patchValid = !!patch.diff && patch.diff.length > 0;
      const nextStatus = patchValid ? "validation_passed" : "validation_failed";
      await execRepo.transitionIteration(ctx, iteration.id, nextStatus, tx);
      await execRepo.transitionRun(ctx, runId, run.version, "validation", tx);
      await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: "agent" },
        `engineering.validation.${patchValid ? "passed" : "failed"}`, "engineering_iteration",
        iteration.id, "success", { iteration: iteration.iteration_number }, tx);
      await recordActivity(ctx, run.project_id, "ai.validation.completed", "engineering_iteration",
        iteration.id, { status: nextStatus }, tx);
      return { iteration, validationStatus: nextStatus };
    });
  }

  async requestReview(ctx: TenantContext, runId: string, iterationId: string, actorId: string) {
    return withTransaction(async (tx: PoolClient) => {
      const run = await execRepo.findRun(ctx, runId, tx);
      const iteration = await execRepo.findIteration(ctx, iterationId, tx);
      if (iteration.validation_status !== "validation_passed") {
        throw new Error("patch must pass validation before review");
      }
      const review = await this.createReview(ctx, run.project_id, iteration.patch_id ?? "", tx);
      await execRepo.setIterationReview(ctx, iteration.id, iteration.version, review.id, tx);
      await execRepo.transitionIteration(ctx, iteration.id, "review_requested", tx);
      await execRepo.transitionRun(ctx, runId, run.version, "review", tx);
      await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: "agent" },
        "engineering.review.requested", "review", review.id, "success",
        { runId, iteration: iteration.iteration_number, patchId: iteration.patch_id }, tx);
      await recordActivity(ctx, run.project_id, "ai.review.requested", "review",
        review.id, { runId, iteration: iteration.iteration_number }, tx);
      return { review, iteration, run };
    });
  }

  async revise(ctx: TenantContext, runId: string, previousIterationId: string, actorId: string,
    untrustedInput: string) {
    return withTransaction(async (tx: PoolClient) => {
      const run = await execRepo.findRun(ctx, runId, tx);
      const prev = await execRepo.findIteration(ctx, previousIterationId, tx);
      if (prev.engineering_run_id !== runId) throw new Error("iteration does not belong to run");
      if (prev.validation_status !== "changes_requested") {
        throw new Error(`iteration not in changes_requested state: ${prev.validation_status}`);
      }
      await execRepo.transitionIteration(ctx, prev.id, "superseded", tx);
      if (prev.patch_id) {
        await patches.transition(ctx, prev.patch_id, 0, "superseded", tx);
      }
      const cleanInput = sanitizeUntrusted(untrustedInput);
      const iterationNumber = prev.iteration_number + 1;
      const iteration = await execRepo.createIteration(ctx, run.project_id, runId, iterationNumber, tx);
      const policy = await this.findPolicy(ctx, run.policy_id, tx);
      let draft: any;
      try {
        if (!this.provider) throw new Error("no AI provider configured");
        draft = await this.provider.generate({
          runId, organizationId: ctx.organizationId, projectId: run.project_id,
          agentId: run.agent_id, agentVersionId: run.agent_version_id,
          model: policy.model ?? "test", systemInstructions: "Revise patch based on review feedback",
          untrustedInput: cleanInput,
          allowedTools: policy.allowed_tools,
          budget: { maxTokens: policy.max_tokens ?? undefined, timeoutMs: policy.timeout_ms, maxToolCalls: policy.max_tool_calls }
        });
      } catch (err) {
        await execRepo.transitionRun(ctx, runId, run.version, "failed", tx);
        throw err;
      }
      const patchContent = JSON.stringify(draft);
      const patchHash = hashJson(draft);
      const patch = await patches.create(ctx, run.project_id, patchContent, patchHash, tx);
      await patches.transition(ctx, patch.id, patch.version, "proposed", tx);
      await execRepo.setIterationPatch(ctx, iteration.id, iteration.version, patch.id, tx);
      await execRepo.setIterationFeedback(ctx, iteration.id, iteration.version + 1, prev.review_feedback ?? "", tx);
      await execRepo.transitionIteration(ctx, iteration.id, "generated", tx);
      await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: "agent" },
        "engineering.revision.created", "engineering_iteration", iteration.id, "success",
        { runId, previousIterationId, iteration: iterationNumber }, tx);
      await recordActivity(ctx, run.project_id, "ai.revision.requested", "engineering_iteration",
        iteration.id, { runId, previousIterationId, iteration: iterationNumber }, tx);
      return { iteration, patch, run };
    });
  }

  async escalate(ctx: TenantContext, runId: string, actorId: string, reason: string) {
    if (!reason || reason.length > 2000) throw new Error("escalation reason must be 1..2000 chars");
    return withTransaction(async (tx: PoolClient) => {
      const run = await execRepo.findRun(ctx, runId, tx);
      if (run.status === "completed" || run.status === "failed" || run.status === "halted" || run.status === "escalated") {
        throw new Error(`run already terminal: ${run.status}`);
      }
      await execRepo.transitionRun(ctx, runId, run.version, "escalated", tx);
      await execRepo.setRunFailure(ctx, runId, run.version + 1, "escalated", tx);
      await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: "agent" },
        "engineering.escalated", "engineering_run", runId, "success", { reason: reason.slice(0, 200) }, tx);
      await recordActivity(ctx, run.project_id, "ai.escalated", "engineering_run",
        runId, { reason: reason.slice(0, 200) }, tx);
      return run;
    });
  }

  async cancel(ctx: TenantContext, runId: string, actorId: string) {
    return withTransaction(async (tx: PoolClient) => {
      const run = await execRepo.findRun(ctx, runId, tx);
      if (run.status === "completed" || run.status === "failed" || run.status === "halted" || run.status === "escalated") {
        throw new Error(`run already terminal: ${run.status}`);
      }
      await execRepo.transitionRun(ctx, runId, run.version, "halted", tx);
      await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: "human" },
        "engineering.run.cancelled", "engineering_run", runId, "success", {}, tx);
      await recordActivity(ctx, run.project_id, "task.transitioned", "engineering_run",
        runId, { status: "halted" }, tx);
      return run;
    });
  }

  private async findPolicy(ctx: TenantContext, id: string, tx?: PoolClient) {
    const { AiRepository } = await import("../persistence/aiRepository.js");
    const repos = new AiRepository();
    const row = await repos.findPolicy(ctx, id, tx);
    if (!row) throw new NotFoundError("agent_policies");
    return row;
  }

  private async createPlan(ctx: TenantContext, runId: string, contentHash: string,
    draft: any, tx?: PoolClient) {
    const { AiRepository } = await import("../persistence/aiRepository.js");
    const repos = new AiRepository();
    return repos.createPlan(ctx, runId, contentHash, draft, tx);
  }

  private async findPlan(ctx: TenantContext, id: string, tx?: PoolClient) {
    const { AiRepository } = await import("../persistence/aiRepository.js");
    const repos = new AiRepository();
    return repos.findPlan(ctx, id, tx);
  }

  private async updatePlanStatus(ctx: TenantContext, id: string, version: number, status: string,
    tx?: PoolClient) {
    const { AiRepository } = await import("../persistence/aiRepository.js");
    const repos = new AiRepository();
    return repos.setPlanStatus(ctx, id, status, version, tx);
  }

  private async createReview(ctx: TenantContext, projectId: string, patchId: string, tx?: PoolClient) {
    const { ReviewRepository } = await import("../persistence/engineeringRepositories.js");
    const repos = new ReviewRepository();
    return repos.create(ctx, projectId, patchId, tx);
  }
}

export const engineeringExecutionService = new EngineeringExecutionService();