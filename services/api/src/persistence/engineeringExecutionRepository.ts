import { PoolClient } from "pg";
import { BaseRepository, updateWithVersion } from "./baseRepository.js";
import { TenantContext } from "../domain/tenancy.js";
import { ConflictError, NotFoundError, StateTransitionError } from "../domain/errors.js";

export interface EngineeringRunRow {
  id: string;
  organization_id: string;
  project_id: string;
  engineering_task_id: string;
  agent_id: string;
  agent_version_id: string;
  policy_id: string;
  principal_id: string;
  correlation_id: string;
  status: string;
  iteration_count: number;
  max_iterations: number;
  budget: Record<string, unknown>;
  failure_category: string | null;
  idempotency_key: string | null;
  version: number;
}

export interface EngineeringIterationRow {
  id: string;
  organization_id: string;
  project_id: string;
  engineering_run_id: string;
  iteration_number: number;
  plan_id: string | null;
  patch_id: string | null;
  review_id: string | null;
  validation_status: string;
  review_feedback: string | null;
  version: number;
}

/** Phase 11: engineering execution aggregate repository. Tenant-scoped. */
export class EngineeringExecutionRepository extends BaseRepository {
  protected table = "engineering_runs";

  async createRun(ctx: TenantContext, projectId: string, taskId: string, agentId: string,
    agentVersionId: string, policyId: string, principalId: string, correlationId: string,
    maxIterations: number, budget: Record<string, unknown>, idempotencyKey: string | null,
    tx?: PoolClient) {
    const t = await this.query(
      "SELECT organization_id, project_id FROM engineering_tasks WHERE id=$1 AND organization_id=$2",
      [taskId, ctx.organizationId], tx);
    if (t.rowCount === 0) throw new NotFoundError("engineering_tasks");
    const task = t.rows[0];
    if (task.project_id !== projectId) throw new ConflictError("task outside project");
    const res = await this.query(
      `INSERT INTO engineering_runs(organization_id, project_id, engineering_task_id, agent_id,
        agent_version_id, policy_id, principal_id, correlation_id, status, max_iterations, budget, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'planned',$9,$10,$11) RETURNING *`,
      [ctx.organizationId, projectId, taskId, agentId, agentVersionId, policyId, principalId,
        correlationId, maxIterations, JSON.stringify(budget), idempotencyKey ?? null], tx);
    return res.rows[0];
  }

  async findRun(ctx: TenantContext, id: string, tx?: PoolClient): Promise<EngineeringRunRow> {
    return this.findByIdInOrg<EngineeringRunRow>(id, ctx.organizationId, tx);
  }

  async listRuns(ctx: TenantContext, projectId: string | null, limit = 20,
    cursor?: string | null, tx?: PoolClient) {
    const safe = Math.min(Math.max(limit, 1), 100);
    const args: unknown[] = [ctx.organizationId];
    let pred = "";
    if (projectId) { args.push(projectId); pred = `AND project_id = $${args.length}`; }
    if (cursor) {
      const parts = cursor.split(":");
      if (parts.length === 2) {
        args.push(parts[0], parts[1]);
        pred += ` AND (created_at < $${args.length - 1} OR (created_at = $${args.length - 1} AND id < $${args.length}))`;
      }
    }
    args.push(safe + 1);
    const res = await this.query(
      `SELECT * FROM engineering_runs WHERE organization_id = $1 ${pred}
       ORDER BY created_at DESC, id DESC LIMIT $${args.length}`,
      args, tx);
    const rows = res.rows.slice(0, safe);
    const next = res.rows.length > safe
      ? `${rows[rows.length - 1].created_at}:${rows[rows.length - 1].id}`
      : null;
    return { rows, nextCursor: next };
  }

  async transitionRun(ctx: TenantContext, id: string, version: number, to: string,
    tx?: PoolClient) {
    const cur = await this.findRun(ctx, id, tx);
    const ok: Record<string, string[]> = {
      planned: ["planning", "failed", "halted", "escalated"],
      planning: ["waiting_approval", "failed", "halted", "escalated"],
      waiting_approval: ["executing", "failed", "halted", "escalated"],
      executing: ["validation", "failed", "halted", "escalated"],
      validation: ["review", "failed", "halted", "escalated"],
      review: ["completed", "failed", "halted", "escalated"],
      completed: [], failed: [], halted: [], escalated: []
    };
    if (!(ok[cur.status] ?? []).includes(to)) {
      throw new StateTransitionError(cur.status, ok[cur.status] ?? []);
    }
    return updateWithVersion("engineering_runs", id, version, { status: to }, tx);
  }

  async incrementIteration(ctx: TenantContext, id: string, tx?: PoolClient) {
    const res = await this.query(
      "UPDATE engineering_runs SET iteration_count = iteration_count + 1, updated_at = now() WHERE id=$1 AND organization_id=$2 RETURNING iteration_count",
      [id, ctx.organizationId], tx);
    if (res.rowCount === 0) throw new NotFoundError("engineering_runs");
    return res.rows[0].iteration_count;
  }

  async createIteration(ctx: TenantContext, projectId: string, runId: string, iterationNumber: number,
    tx?: PoolClient): Promise<EngineeringIterationRow> {
    const run = await this.findRun(ctx, runId, tx);
    if (run.project_id !== projectId) throw new ConflictError("run outside project");
    const res = await this.query(
      `INSERT INTO engineering_iterations(organization_id, project_id, engineering_run_id,
        iteration_number, validation_status)
       VALUES ($1,$2,$3,$4,'generated') RETURNING *`,
      [ctx.organizationId, projectId, runId, iterationNumber], tx);
    return res.rows[0];
  }

  async findIteration(ctx: TenantContext, id: string, tx?: PoolClient): Promise<EngineeringIterationRow> {
    const res = await this.query(
      "SELECT * FROM engineering_iterations WHERE id=$1 AND organization_id=$2", [id, ctx.organizationId], tx);
    if (res.rowCount === 0) throw new NotFoundError("engineering_iterations");
    return res.rows[0];
  }

  async listIterations(ctx: TenantContext, runId: string, tx?: PoolClient) {
    const run = await this.findRun(ctx, runId, tx);
    const res = await this.query(
      "SELECT * FROM engineering_iterations WHERE engineering_run_id=$1 AND organization_id=$2 ORDER BY iteration_number ASC",
      [runId, ctx.organizationId], tx);
    return res.rows;
  }

  async transitionIteration(ctx: TenantContext, id: string, to: string, tx?: PoolClient) {
    const cur = await this.findIteration(ctx, id, tx);
    const ok: Record<string, string[]> = {
      generated: ["validation_failed", "validation_passed"],
      validation_failed: ["review_requested", "superseded"],
      validation_passed: ["review_requested", "superseded"],
      review_requested: ["changes_requested", "approved", "superseded"],
      changes_requested: ["review_requested", "superseded"],
      approved: ["applied", "superseded"],
      applied: ["superseded"],
      superseded: []
    };
    if (!(ok[cur.validation_status] ?? []).includes(to)) {
      throw new StateTransitionError(cur.validation_status, ok[cur.validation_status] ?? []);
    }
    return updateWithVersion("engineering_iterations", id, cur.version, { validation_status: to }, tx);
  }

  async setIterationPatch(ctx: TenantContext, id: string, version: number, patchId: string,
    tx?: PoolClient) {
    return updateWithVersion("engineering_iterations", id, version, { patch_id: patchId }, tx);
  }

  async setIterationPlan(ctx: TenantContext, id: string, version: number, planId: string,
    tx?: PoolClient) {
    return updateWithVersion("engineering_iterations", id, version, { plan_id: planId }, tx);
  }

  async setIterationReview(ctx: TenantContext, id: string, version: number, reviewId: string,
    tx?: PoolClient) {
    return updateWithVersion("engineering_iterations", id, version, { review_id: reviewId }, tx);
  }

  async setIterationFeedback(ctx: TenantContext, id: string, version: number, feedback: string,
    tx?: PoolClient) {
    return updateWithVersion("engineering_iterations", id, version, { review_feedback: feedback }, tx);
  }

  async setRunFailure(ctx: TenantContext, id: string, version: number, category: string,
    tx?: PoolClient) {
    return updateWithVersion("engineering_runs", id, version, { failure_category: category }, tx);
  }
}

export const engineeringExecutionRepository = new EngineeringExecutionRepository();