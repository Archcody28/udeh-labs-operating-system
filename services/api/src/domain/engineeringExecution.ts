/** Phase 11: Autonomous Engineering execution domain service. */
import { PoolClient } from "pg";
import { TenantContext } from "./tenancy.js";
import { withTransaction } from "../persistence/db.js";
import { AuditRepository } from "../persistence/auditRepository.js";
import { engineeringExecutionRepository } from "../persistence/engineeringExecutionRepository.js";
import { PatchRepository, ReviewRepository } from "../persistence/engineeringRepositories.js";
import { AiError, sanitizeUntrusted } from "./aiErrors.js";
import { AIProvider } from "./aiProvider.js";
import { hashJson } from "./aiRuntime.js";
import { validateDraftOutput, checkBudget } from "./aiPolicy.js";
import { recordActivity } from "./collaborationService.js";
import { NotFoundError, ConflictError, StateTransitionError, ValidationError } from "./errors.js";
import { ForbiddenError } from "./authorization.js";
import { publishDomainEvent } from "./domainEvents.js";

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

/** Deterministic validation report consumed by the validation gateway. */
export interface ValidationReport {
  typecheck?: "passed" | "failed";
  tests?: "passed" | "failed";
  lint?: "passed" | "failed";
}

export class EngineeringExecutionService {
  private provider: AIProvider | null = null;

  setProvider(p: AIProvider): void { this.provider = p; }

  async createRun(ctx: TenantContext, input: CreateRunInput, actorId: string) {
    if (!input.projectId || !input.agentId || !input.agentVersionId || !input.policyId) {
      throw new ValidationError("projectId, agentId, agentVersionId, policyId required");
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
      if (idemKey) {
        // Replay semantics: same key + same payload returns the original run
        // (no duplicate run, audit, or activity); same key + different payload
        // fails safely as a conflict. Keys are unique per organization.
        const existing = await execRepo.findRunByKey(ctx, idemKey, tx);
        if (existing) {
          const same = existing.project_id === input.projectId &&
            existing.engineering_task_id === input.taskId &&
            existing.agent_id === input.agentId &&
            existing.agent_version_id === input.agentVersionId &&
            existing.policy_id === input.policyId;
          if (!same) throw new ConflictError("idempotency key reused with different payload");
          return { ...existing, replayed: true };
        }
      }
      const run = await execRepo.createRun(ctx, input.projectId, input.taskId, input.agentId,
        input.agentVersionId, input.policyId, ctx.actorId ?? actorId, ctx.correlationId,
        maxIterations, budget, idemKey, tx);
      await auditRepo.append({ ...ctx, projectId: input.projectId, actorId, principalType: ctx.principalType ?? "system" },
        "engineering.run.created", "engineering_run", run.id, "success",
        { taskId: input.taskId, agentId: input.agentId, maxIterations }, tx);
      await recordActivity(ctx, input.projectId, "ai.run.created", "engineering_run",
        run.id, { taskId: input.taskId, agentId: input.agentId, principalType: ctx.principalType ?? "system" }, tx);
      return run;
    });
  }

  async generatePlan(ctx: TenantContext, runId: string, actorId: string,
    untrustedInput: string) {
    // Failure state must PERSIST (not roll back), so provider errors are
    // captured inside the transaction, the failure is committed, and the
    // error is re-thrown only after the commit.
    let failure: unknown = null;
    const out = await withTransaction(async (tx: PoolClient) => {
      const run = await execRepo.findRun(ctx, runId, tx);
      if (run.status !== "planned" && run.status !== "planning") {
        throw new StateTransitionError(run.status, ["planned", "planning"]);
      }
      const cleanInput = sanitizeUntrusted(untrustedInput);
      await execRepo.transitionRun(ctx, runId, run.version, "planning", tx);
      const policy = await this.findPolicy(ctx, run.policy_id, tx);
      let draft: Awaited<ReturnType<AIProvider["generate"]>>;
      try {
        draft = await this.generateDraft(ctx, run, policy, cleanInput,
          "Generate an engineering plan");
      } catch (err) {
        // Chain from CURRENT row state: the run was already moved to
        // 'planning' above, so re-read before transitioning to 'failed'.
        const failed = await execRepo.findRun(ctx, runId, tx);
        await execRepo.transitionRun(ctx, runId, failed.version, "failed", tx);
        await execRepo.setRunFailure(ctx, runId, failed.version + 1, this.categoryOf(err), tx);
        await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: ctx.principalType ?? "system" },
          "engineering.plan.failed", "engineering_run", runId, "failed",
          { reason: err instanceof Error ? err.message : String(err), category: this.categoryOf(err) }, tx);
        // INV-EVT-01: the failed-run event commits with the failure state.
        await publishDomainEvent(tx, {
          organizationId: ctx.organizationId,
          workspaceId: ctx.workspaceId ?? null,
          projectId: run.project_id,
          eventType: "agent.run.failed",
          aggregateType: "engineering_run",
          aggregateId: runId,
          actorUserId: actorId,
          principalType: ctx.principalType ?? "system",
          payload: { runId, category: this.categoryOf(err) },
          correlationId: ctx.correlationId,
        });
        failure = err;
        return null;
      }
      const contentHash = hashJson(draft);
      const plan = await this.createPlan(ctx, runId, contentHash, draft, tx);
      await execRepo.transitionRun(ctx, runId, run.version + 1, "waiting_approval", tx);
      await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: ctx.principalType ?? "system" },
        "engineering.plan.submitted", "engineering_run", runId, "success",
        { planId: plan.id, iteration: run.iteration_count, contentHash }, tx);
      await recordActivity(ctx, run.project_id, "ai.plan.submitted", "engineering_run",
        runId, { planId: plan.id, iteration: run.iteration_count, agentId: run.agent_id }, tx);
      return { plan, run };
    });
    if (failure) throw failure;
    return out!;
  }

  async approvePlan(ctx: TenantContext, runId: string, planId: string, runVersion: number,
    planVersion: number, decision: "approved" | "denied", note: string, actorId: string) {
    if (decision !== "approved" && decision !== "denied") {
      throw new ValidationError("decision must be 'approved' or 'denied'");
    }
    // Hard self-approval guard at the SERVICE boundary (not only the HTTP
    // route): an agent principal can never approve its own plan, whatever
    // path reaches this method.
    if (ctx.principalType === "agent") throw new ForbiddenError("AI cannot approve its own plan");
    return withTransaction(async (tx: PoolClient) => {
      const run = await execRepo.findRun(ctx, runId, tx);
      if (run.status !== "waiting_approval") {
        throw new StateTransitionError(run.status, ["waiting_approval"]);
      }
      const plan = await this.findPlan(ctx, planId, tx);
      if (plan.run_id !== runId) throw new ConflictError("plan does not belong to run");
      if (plan.status !== "proposed") throw new ConflictError(`plan already ${plan.status}`);
      await this.updatePlanStatus(ctx, planId, planVersion, decision, tx);
      const next = decision === "approved" ? "executing" : "halted";
      await execRepo.transitionRun(ctx, runId, runVersion, next, tx);
      await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: "human" },
        `engineering.plan.${decision}`, "engineering_run", runId, "success",
        { planId, note }, tx);
      await recordActivity(ctx, run.project_id,
        decision === "approved" ? "ai.plan.approved" : "task.transitioned", "engineering_run",
        runId, { planId, decision, note, approverUserId: actorId }, tx);
      return { run, plan, decision };
    });
  }

  async startExecution(ctx: TenantContext, runId: string, actorId: string) {
    return withTransaction(async (tx: PoolClient) => {
      const run = await execRepo.findRun(ctx, runId, tx);
      if (run.status !== "executing") {
        throw new StateTransitionError(run.status, ["executing"]);
      }
      await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: ctx.principalType ?? "system" },
        "engineering.execution.started", "engineering_run", runId, "success", {}, tx);
      await recordActivity(ctx, run.project_id, "task.transitioned", "engineering_run",
        runId, { status: "executing", agentId: run.agent_id }, tx);
      return run;
    });
  }

  async implementPatch(ctx: TenantContext, runId: string, actorId: string,
    untrustedInput: string) {
    // Provider failures commit a durable failed/escalated state, then rethrow.
    let failure: unknown = null;
    const out = await withTransaction(async (tx: PoolClient) => {
      const run = await execRepo.findRun(ctx, runId, tx);
      // Iterations 2+ begin from `validation` (previous patch already validated);
      // halted/escalated/failed/completed runs can never resume implementing.
      if (run.status !== "executing" && run.status !== "validation") {
        throw new StateTransitionError(run.status, ["executing", "validation"]);
      }
      // Bounded autonomy: exhausted iterations ESCALATE, never loop forever.
      if (run.iteration_count >= run.max_iterations) {
        await execRepo.transitionRun(ctx, runId, run.version, "escalated", tx);
        await execRepo.setRunFailure(ctx, runId, run.version + 1, "budget_exceeded", tx);
        await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: ctx.principalType ?? "system" },
          "engineering.escalated", "engineering_run", runId, "success",
          { reason: "iteration_exhausted", iterationCount: run.iteration_count, maxIterations: run.max_iterations }, tx);
        await recordActivity(ctx, run.project_id, "ai.escalated", "engineering_run",
          runId, { reason: "iteration_exhausted" }, tx);
        failure = new AiError("budget_exceeded", "max iterations reached", {});
        return null;
      }
      const cleanInput = sanitizeUntrusted(untrustedInput);
      const policy = await this.findPolicy(ctx, run.policy_id, tx);
      let draft: Awaited<ReturnType<AIProvider["generate"]>>;
      try {
        draft = await this.generateDraft(ctx, run, policy, cleanInput, "Generate a code patch");
      } catch (err) {
        await this.failOrEscalate(ctx, run, err, actorId, tx);
        failure = err;
        return null;
      }
      const iterationNumber = run.iteration_count + 1;
      const iteration = await execRepo.createIteration(ctx, run.project_id, runId, iterationNumber, tx);
      await execRepo.incrementIteration(ctx, runId, tx);
      const patchContent = JSON.stringify(draft);
      const patchHash = hashJson(draft);
      // Patch is created in 'proposed' — a generated patch can NEVER appear
      // applied; only a human review decision can move it forward.
      const patch = await patches.create(ctx, run.project_id, patchContent, patchHash, tx);
      await execRepo.setIterationPatch(ctx, iteration.id, iteration.version, patch.id, tx);
      await tx.query(
        `UPDATE code_patches SET generating_principal_id=$1, agent_version_id=$2, policy_id=$3,
          is_ai_generated=TRUE, source_context_ref=$4 WHERE id=$5`,
        [ctx.actorId ?? actorId, run.agent_version_id, run.policy_id, cleanInput.slice(0, 1000), patch.id]);
      await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: ctx.principalType ?? "system" },
        "engineering.patch.generated", "code_patch", patch.id, "success",
        { runId, iteration: iterationNumber, patchHash, agentVersionId: run.agent_version_id, policyId: run.policy_id }, tx);
      await recordActivity(ctx, run.project_id, "ai.patch.generated", "code_patch",
        patch.id, { runId, iteration: iterationNumber, agentId: run.agent_id }, tx);
      return { iteration, patch, run };
    });
    if (failure) throw failure;
    return out!;
  }

  async validatePatch(ctx: TenantContext, runId: string, iterationId: string, actorId: string,
    report?: ValidationReport) {
    return withTransaction(async (tx: PoolClient) => {
      const run = await execRepo.findRun(ctx, runId, tx);
      const iteration = await execRepo.findIteration(ctx, iterationId, tx);
      if (iteration.engineering_run_id !== runId) throw new ConflictError("iteration does not belong to run");
      if (iteration.validation_status !== "generated") {
        throw new StateTransitionError(iteration.validation_status, ["generated"]);
      }
      // A halted/escalated/failed/completed run can never re-enter validation.
      if (run.status !== "executing" && run.status !== "validation") {
        throw new StateTransitionError(run.status, ["executing", "validation"]);
      }
      const patch = await patches.find(ctx, iteration.patch_id ?? "", tx) as {
        diff: string | null; diff_hash: string; is_ai_generated: boolean;
        agent_version_id: string | null; policy_id: string | null; status: string;
      };
      if (!patch) throw new NotFoundError("code_patches");
      // Deterministic integrity pipeline: parse + hash + provenance + report.
      // A FAILED validation must never appear successful.
      const failures: string[] = [];
      let parsed: unknown = null;
      if (!patch.diff || !patch.diff.trim()) {
        failures.push("empty patch");
      } else {
        try { parsed = JSON.parse(patch.diff); }
        catch { failures.push("malformed patch: not valid JSON"); }
      }
      if (parsed !== null && hashJson(parsed) !== patch.diff_hash) {
        failures.push("invalid patch hash: content does not match recorded hash");
      }
      if (!patch.is_ai_generated || !patch.agent_version_id || !patch.policy_id) {
        failures.push("missing AI provenance");
      }
      if (patch.status !== "proposed") failures.push(`patch not in proposed state: ${patch.status}`);
      if (report) {
        for (const [check, outcome] of Object.entries(report)) {
          if (outcome !== "passed" && outcome !== "failed") {
            throw new ValidationError(`validation report entry ${check} must be 'passed' or 'failed'`);
          }
          if (outcome === "failed") failures.push(`${check} failed`);
        }
      }
      const patchValid = failures.length === 0;
      const nextStatus = patchValid ? "validation_passed" : "validation_failed";
      await execRepo.transitionIteration(ctx, iteration.id, nextStatus, tx);
      if (!patchValid) {
        await execRepo.setIterationFeedback(ctx, iteration.id, iteration.version + 1,
          failures.join("; ").slice(0, 2000), tx);
      }
      await execRepo.transitionRun(ctx, runId, run.version, "validation", tx);
      await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: ctx.principalType ?? "system" },
        `engineering.validation.${patchValid ? "passed" : "failed"}`, "engineering_iteration",
        iteration.id, patchValid ? "success" : "failed",
        { iteration: iteration.iteration_number, patchId: iteration.patch_id, failures }, tx);
      await recordActivity(ctx, run.project_id, "ai.validation.completed", "engineering_iteration",
        iteration.id, { status: nextStatus, runId, failures: failures.length }, tx);
      return { iteration, validationStatus: nextStatus, failures };
    });
  }

  async requestReview(ctx: TenantContext, runId: string, iterationId: string, actorId: string) {
    return withTransaction(async (tx: PoolClient) => {
      const run = await execRepo.findRun(ctx, runId, tx);
      const iteration = await execRepo.findIteration(ctx, iterationId, tx);
      if (iteration.engineering_run_id !== runId) throw new ConflictError("iteration does not belong to run");
      if (run.status !== "validation") {
        throw new StateTransitionError(run.status, ["validation"]);
      }
      if (iteration.validation_status !== "validation_passed") {
        throw new StateTransitionError(iteration.validation_status, ["validation_passed"]);
      }
      const review = await this.createReview(ctx, run.project_id, iteration.patch_id ?? "", tx);
      await execRepo.setIterationReview(ctx, iteration.id, iteration.version, review.id, tx);
      await execRepo.transitionIteration(ctx, iteration.id, "review_requested", tx);
      await execRepo.transitionRun(ctx, runId, run.version, "review", tx);
      await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: ctx.principalType ?? "system" },
        "engineering.review.requested", "review", review.id, "success",
        { runId, iteration: iteration.iteration_number, patchId: iteration.patch_id }, tx);
      await recordActivity(ctx, run.project_id, "ai.review.requested", "review",
        review.id, { runId, iteration: iteration.iteration_number, agentId: run.agent_id }, tx);
      return { review, iteration, run };
    });
  }

  async revise(ctx: TenantContext, runId: string, previousIterationId: string, actorId: string,
    untrustedInput: string) {
    let failure: unknown = null;
    const out = await withTransaction(async (tx: PoolClient) => {
      const run = await execRepo.findRun(ctx, runId, tx);
      // A cancelled/escalated/failed/completed run must NEVER keep mutating
      // engineering state; revision is only legal while under human review.
      if (run.status !== "review") {
        throw new StateTransitionError(run.status, ["review"]);
      }
      const prev = await execRepo.findIteration(ctx, previousIterationId, tx);
      if (prev.engineering_run_id !== runId) throw new ConflictError("iteration does not belong to run");
      if (prev.validation_status !== "changes_requested") {
        throw new StateTransitionError(prev.validation_status, ["changes_requested"]);
      }
      // Bounded autonomy across revision cycles.
      if (prev.iteration_number >= run.max_iterations) {
        await execRepo.transitionRun(ctx, runId, run.version, "escalated", tx);
        await execRepo.setRunFailure(ctx, runId, run.version + 1, "budget_exceeded", tx);
        await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: ctx.principalType ?? "system" },
          "engineering.escalated", "engineering_run", runId, "success",
          { reason: "iteration_exhausted", iteration: prev.iteration_number }, tx);
        await recordActivity(ctx, run.project_id, "ai.escalated", "engineering_run",
          runId, { reason: "iteration_exhausted" }, tx);
        failure = new AiError("budget_exceeded", "max iterations reached", {});
        return null;
      }
      await execRepo.transitionRun(ctx, runId, run.version, "executing", tx);
      await execRepo.transitionIteration(ctx, prev.id, "superseded", tx);
      if (prev.patch_id) {
        // Previous patch is superseded with its CURRENT version — it stays
        // immutable and auditable; it is never deleted or overwritten.
        const prevPatch = await patches.find(ctx, prev.patch_id, tx) as { status: string; version: number };
        if (prevPatch.status === "proposed") {
          await patches.transition(ctx, prev.patch_id, prevPatch.version, "superseded", tx);
        }
      }
      const cleanInput = sanitizeUntrusted(untrustedInput);
      await execRepo.incrementIteration(ctx, runId, tx);
      const iterationNumber = prev.iteration_number + 1;
      const iteration = await execRepo.createIteration(ctx, run.project_id, runId, iterationNumber, tx);
      const policy = await this.findPolicy(ctx, run.policy_id, tx);
      let draft: Awaited<ReturnType<AIProvider["generate"]>>;
      try {
        draft = await this.generateDraft(ctx, run, policy, cleanInput,
          "Revise patch based on review feedback");
      } catch (err) {
        // Run was transitioned review→executing above; its version is +1 now.
        await this.failOrEscalate(ctx, { ...run, version: run.version + 1 }, err, actorId, tx);
        failure = err;
        return null;
      }
      const patchContent = JSON.stringify(draft);
      const patchHash = hashJson(draft);
      const patch = await patches.create(ctx, run.project_id, patchContent, patchHash, tx);
      await tx.query(
        `UPDATE code_patches SET generating_principal_id=$1, agent_version_id=$2, policy_id=$3,
          is_ai_generated=TRUE, source_context_ref=$4 WHERE id=$5`,
        [ctx.actorId ?? actorId, run.agent_version_id, run.policy_id, cleanInput.slice(0, 1000), patch.id]);
      await execRepo.setIterationPatch(ctx, iteration.id, iteration.version, patch.id, tx);
      await execRepo.setIterationFeedback(ctx, iteration.id, iteration.version + 1, prev.review_feedback ?? "", tx);
      await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: ctx.principalType ?? "system" },
        "engineering.revision.created", "engineering_iteration", iteration.id, "success",
        { runId, previousIterationId, iteration: iterationNumber, patchHash }, tx);
      await recordActivity(ctx, run.project_id, "ai.revision.requested", "engineering_iteration",
        iteration.id, { runId, previousIterationId, iteration: iterationNumber, agentId: run.agent_id }, tx);
      return { iteration, patch, run };
    });
    if (failure) throw failure;
    return out!;
  }

  /** Human review decision on an AI-generated patch (Phase 8 review reused). */
  async decideReview(ctx: TenantContext, runId: string, reviewId: string,
    decision: "approved" | "changes_requested", note: string, reviewVersion: number, actorId: string) {
    if (decision !== "approved" && decision !== "changes_requested") {
      throw new ValidationError("decision must be 'approved' or 'changes_requested'");
    }
    // AI can never approve its own patch — enforced at the service boundary.
    if (ctx.principalType === "agent") throw new ForbiddenError("AI cannot approve its own patch");
    return withTransaction(async (tx: PoolClient) => {
      const run = await execRepo.findRun(ctx, runId, tx);
      if (run.status !== "review") throw new StateTransitionError(run.status, ["review"]);
      const iteration = await execRepo.findIterationByReview(ctx, reviewId, runId, tx);
      const reviews = new ReviewRepository();
      // A reviewer scoped to one project can never decide a review bound to
      // another project's patch — cross-project/cross-tenant access fails closed.
      const reviewRow = await reviews.find(ctx, reviewId, tx) as { project_id: string };
      if (reviewRow.project_id !== run.project_id) throw new ConflictError("review outside project");
      const decisionRow = await reviews.decide(ctx, reviewId, reviewVersion, decision, note, actorId, tx);
      if (decision === "approved") {
        await execRepo.transitionIteration(ctx, iteration.id, "approved", tx);
        if (iteration.patch_id) {
          const patch = await patches.find(ctx, iteration.patch_id, tx) as { status: string; version: number };
          if (patch.status === "proposed") {
            await patches.transition(ctx, iteration.patch_id, patch.version, "approved", tx);
          }
        }
        await execRepo.transitionRun(ctx, runId, run.version, "completed", tx);
      } else {
        await execRepo.transitionIteration(ctx, iteration.id, "changes_requested", tx);
        const fresh = await execRepo.findIteration(ctx, iteration.id, tx);
        await execRepo.setIterationFeedback(ctx, iteration.id, fresh.version, note.slice(0, 2000), tx);
        // Run stays in 'review'; revise() re-opens execution.
      }
      await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: "human" },
        "engineering.review.decided", "review", reviewId, "success",
        { runId, decision, note: note.slice(0, 200), iteration: iteration.iteration_number }, tx);
      await recordActivity(ctx, run.project_id, "review.decided", "review",
        reviewId, { runId, decision, reviewerUserId: actorId }, tx);
      // INV-EVT-01: the review decision event commits with the decision.
      await publishDomainEvent(tx, {
        organizationId: ctx.organizationId,
        workspaceId: ctx.workspaceId ?? null,
        projectId: run.project_id,
        eventType: "review.decided",
        aggregateType: "review",
        aggregateId: reviewId,
        actorUserId: actorId,
        principalType: "human",
        payload: { reviewId, decision },
        correlationId: ctx.correlationId,
      });
      const outIteration = await execRepo.findIteration(ctx, iteration.id, tx);
      const outRun = await execRepo.findRun(ctx, runId, tx);
      return { review: decisionRow, iteration: outIteration, run: outRun };
    });
  }

  async escalate(ctx: TenantContext, runId: string, actorId: string, reason: string) {
    if (!reason || reason.length > 2000) throw new ValidationError("escalation reason must be 1..2000 chars");
    return withTransaction(async (tx: PoolClient) => {
      const run = await execRepo.findRun(ctx, runId, tx);
      if (run.status === "completed" || run.status === "failed" || run.status === "halted" || run.status === "escalated") {
        throw new StateTransitionError(run.status, []);
      }
      const out = await execRepo.transitionRun(ctx, runId, run.version, "escalated", tx);
      await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: ctx.principalType ?? "system" },
        "engineering.escalated", "engineering_run", runId, "success", { reason: reason.slice(0, 200) }, tx);
      await recordActivity(ctx, run.project_id, "ai.escalated", "engineering_run",
        runId, { reason: reason.slice(0, 200), agentId: run.agent_id }, tx);
      return out;
    });
  }

  async cancel(ctx: TenantContext, runId: string, actorId: string) {
    return withTransaction(async (tx: PoolClient) => {
      const run = await execRepo.findRun(ctx, runId, tx);
      if (run.status === "completed" || run.status === "failed" || run.status === "halted" || run.status === "escalated") {
        throw new StateTransitionError(run.status, []);
      }
      const out = await execRepo.transitionRun(ctx, runId, run.version, "halted", tx);
      await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: ctx.principalType ?? "system" },
        "engineering.run.cancelled", "engineering_run", runId, "success", {}, tx);
      await recordActivity(ctx, run.project_id, "ai.run.cancelled", "engineering_run",
        runId, { status: "halted" }, tx);
      return out;
    });
  }

  /** Provider seam with deterministic guards: timeout → allowlist → budget.
   *  Authorization is enforced HERE, outside the model: a draft requesting a
   *  tool outside the policy allowlist is rejected before it can become an
   *  action, regardless of what the untrusted prompt content asked for. */
  private async generateDraft(ctx: TenantContext,
    run: { id: string; project_id: string; agent_id: string; agent_version_id: string; policy_id: string },
    policy: { model: string | null; allowed_tools: string[]; max_tokens: number | null;
      timeout_ms: number; max_tool_calls: number },
    cleanInput: string, instructions: string) {
    if (!this.provider) throw new AiError("provider_unavailable", "no AI provider configured", {});
    const startedAt = Date.now();
    const timeoutMs = policy.timeout_ms ?? 120000;
    const draft = await this.withTimeout(this.provider.generate({
      runId: run.id, organizationId: ctx.organizationId, projectId: run.project_id,
      agentId: run.agent_id, agentVersionId: run.agent_version_id,
      model: policy.model ?? "test", systemInstructions: instructions,
      untrustedInput: cleanInput,
      allowedTools: policy.allowed_tools,
      budget: { maxTokens: policy.max_tokens ?? undefined, timeoutMs, maxToolCalls: policy.max_tool_calls }
    }), timeoutMs);
    if (!draft || typeof draft !== "object" || typeof draft.summary !== "string" ||
      !Array.isArray(draft.steps) || !Array.isArray(draft.toolRequests)) {
      throw new AiError("invalid_model_output", "provider returned a malformed draft", {});
    }
    // Tool escalation defense: every requested tool must be policy-allowlisted.
    validateDraftOutput(draft, policy.allowed_tools);
    const usage = {
      tokens: (draft.usage?.inputTokens ?? 0) + (draft.usage?.outputTokens ?? 0),
      elapsedMs: Date.now() - startedAt,
      toolCalls: draft.toolRequests.length
    };
    const budget = checkBudget({
      id: "", organization_id: ctx.organizationId, project_id: run.project_id,
      agent_id: run.agent_id, allowed_tools: policy.allowed_tools, denied_tools: [],
      model: policy.model, max_tokens: policy.max_tokens, timeout_ms: policy.timeout_ms,
      max_tool_calls: policy.max_tool_calls, approval_required: true,
      execution_mode: "supervised", status: "active",
    }, usage);
    if (!budget.allowed) {
      throw new AiError(budget.reason === "timeout exceeded" ? "provider_timeout" : "budget_exceeded",
        budget.reason, {});
    }
    return draft;
  }

  private withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const t = setTimeout(() => reject(new AiError("provider_timeout",
        `provider timed out after ${ms}ms`, { transient: true })), ms);
      p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
    });
  }

  private categoryOf(err: unknown): string {
    return err instanceof AiError ? err.category : "tool_failed";
  }

  /** Execution failure model: budget exhaustion ESCALATES (bounded autonomy
   *  stops for a human); every other failure FAILS the run deterministically.
   *  Failure categories come from the Phase 10 AI_FAILURES taxonomy only. */
  private async failOrEscalate(ctx: TenantContext,
    run: { id: string; project_id: string; version: number }, err: unknown,
    actorId: string, tx: PoolClient) {
    const category = this.categoryOf(err);
    const to = category === "budget_exceeded" ? "escalated" : "failed";
    await execRepo.transitionRun(ctx, run.id, run.version, to, tx);
    await execRepo.setRunFailure(ctx, run.id, run.version + 1, category, tx);
    await auditRepo.append({ ...ctx, projectId: run.project_id, actorId, principalType: ctx.principalType ?? "system" },
      to === "escalated" ? "engineering.escalated" : "engineering.execution.failed",
      "engineering_run", run.id, "failed", { category, reason: err instanceof Error ? err.message : String(err) }, tx);
    // INV-EVT-01: a failed agent run notifies org members who can read runs.
    if (to === "failed") {
      await publishDomainEvent(tx, {
        organizationId: ctx.organizationId,
        workspaceId: ctx.workspaceId ?? null,
        projectId: run.project_id,
        eventType: "agent.run.failed",
        aggregateType: "engineering_run",
        aggregateId: run.id,
        actorUserId: actorId,
        principalType: ctx.principalType ?? "system",
        payload: { runId: run.id, category },
        correlationId: ctx.correlationId,
      });
    }
    if (to === "escalated") {
      await recordActivity(ctx, run.project_id, "ai.escalated", "engineering_run",
        run.id, { reason: category }, tx);
    }
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
    return execRepo.createPlan(ctx, runId, contentHash, draft, tx);
  }

  private async findPlan(ctx: TenantContext, id: string, tx?: PoolClient) {
    return execRepo.findPlan(ctx, id, tx);
  }

  private async updatePlanStatus(ctx: TenantContext, id: string, version: number, status: string,
    tx?: PoolClient) {
    return execRepo.setPlanStatus(ctx, id, status, version, tx);
  }

  private async createReview(ctx: TenantContext, projectId: string, patchId: string, tx?: PoolClient) {
    const { ReviewRepository } = await import("../persistence/engineeringRepositories.js");
    const repos = new ReviewRepository();
    return repos.create(ctx, projectId, patchId, tx);
  }
}

export const engineeringExecutionService = new EngineeringExecutionService();