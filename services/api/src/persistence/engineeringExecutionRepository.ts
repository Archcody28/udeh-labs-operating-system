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
    // Tenant-scope every referenced agent artifact: a run may never bind an
    // agent, agent version, or policy that belongs to another organization.
    const agent = await this.query(
      "SELECT organization_id, project_id FROM agents WHERE id=$1", [agentId], tx);
    if (agent.rowCount === 0 || agent.rows[0].organization_id !== ctx.organizationId) {
      throw new NotFoundError("agents");
    }
    if (agent.rows[0].project_id && agent.rows[0].project_id !== projectId) {
      throw new ConflictError("agent outside project");
    }
    const version = await this.query(
      "SELECT organization_id, agent_id FROM agent_versions WHERE id=$1", [agentVersionId], tx);
    if (version.rowCount === 0 || version.rows[0].organization_id !== ctx.organizationId) {
      throw new NotFoundError("agent_versions");
    }
    if (version.rows[0].agent_id !== agentId) throw new ConflictError("agent version does not belong to agent");
    const policy = await this.query(
      "SELECT organization_id, project_id FROM agent_policies WHERE id=$1", [policyId], tx);
    if (policy.rowCount === 0 || policy.rows[0].organization_id !== ctx.organizationId) {
      throw new NotFoundError("agent_policies");
    }
    if (policy.rows[0].project_id && policy.rows[0].project_id !== projectId) {
      throw new ConflictError("policy outside project");
    }
    const res = await this.query(
      `INSERT INTO engineering_runs(organization_id, project_id, engineering_task_id, agent_id,
        agent_version_id, policy_id, principal_id, correlation_id, status, max_iterations, budget, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'planned',$9,$10,$11) RETURNING *`,
      [ctx.organizationId, projectId, taskId, agentId, agentVersionId, policyId, principalId,
        correlationId, maxIterations, JSON.stringify(budget), idempotencyKey ?? null], tx);
    return res.rows[0];
  }

  /** Tenant-scoped idempotency replay lookup (unique per organization). */
  async findRunByKey(ctx: TenantContext, key: string, tx?: PoolClient): Promise<EngineeringRunRow | null> {
    const res = await this.query(
      "SELECT * FROM engineering_runs WHERE organization_id=$1 AND idempotency_key=$2",
      [ctx.organizationId, key], tx);
    return res.rowCount ? res.rows[0] : null;
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
      // review → executing re-opens the loop when a human requests changes;
      // review → completed marks the approved run ready for application.
      review: ["completed", "executing", "failed", "halted", "escalated"],
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

  /** Iteration bound to a Phase 8 review within a given run (tenant-scoped). */
  async findIterationByReview(ctx: TenantContext, reviewId: string, runId: string,
    tx?: PoolClient): Promise<EngineeringIterationRow> {
    const res = await this.query(
      `SELECT * FROM engineering_iterations WHERE review_id=$1 AND engineering_run_id=$2 AND organization_id=$3`,
      [reviewId, runId, ctx.organizationId], tx);
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

  /** Autonomous-engineering plans bound to engineering_runs (NOT Phase 10 agent_runs). */
  async createPlan(ctx: TenantContext, runId: string, hash: string,
    body: Record<string, unknown>, tx?: PoolClient) {
    const res = await this.query(
      `INSERT INTO engineering_plans(organization_id, engineering_run_id, content_hash, body)
       VALUES ($1,$2,$3,$4) RETURNING *,
       engineering_run_id AS run_id`,
      [ctx.organizationId, runId, hash, JSON.stringify(body)], tx);
    const row = res.rows[0];
    if (typeof row.body === "string") { try { row.body = JSON.parse(row.body); } catch { /* keep raw */ } }
    return row;
  }

  async findPlan(ctx: TenantContext, id: string, tx?: PoolClient) {
    const res = await this.query(
      `SELECT *, engineering_run_id AS run_id FROM engineering_plans
       WHERE id=$1 AND organization_id=$2`, [id, ctx.organizationId], tx);
    if (res.rowCount === 0) throw new NotFoundError("engineering_plans");
    const row = res.rows[0];
    if (typeof row.body === "string") { try { row.body = JSON.parse(row.body); } catch { /* keep raw */ } }
    return row;
  }

  async setPlanStatus(ctx: TenantContext, id: string, status: string, version: number,
    tx?: PoolClient) {
    await this.findPlan(ctx, id, tx);
    const res = await this.query(
      `UPDATE engineering_plans SET status=$3, version=version+1, updated_at=now()
       WHERE id=$1 AND version=$2 RETURNING *, engineering_run_id AS run_id`,
      [id, version, status], tx);
    if (res.rowCount === 0) throw new ConflictError("engineering_plans: stale version");
    return res.rows[0];
  }
}

export const engineeringExecutionRepository = new EngineeringExecutionRepository();