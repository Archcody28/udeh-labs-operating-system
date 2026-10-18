import { PoolClient } from "pg";
import { BaseRepository, updateWithVersion } from "./baseRepository.js";
import { TenantContext } from "../domain/tenancy.js";

export interface AgentRow {
  id: string;
  organization_id: string;
  project_id: string | null;
  default_version_id: string | null;
  status: string;
  version: number;
}

export interface AgentPolicyRow {
  id: string;
  organization_id: string;
  agent_id: string;
  project_id: string | null;
  tools: string[];
  denied_tools: string[];
  allowed_tools: string[];
  model: string | null;
  max_tokens: number | null;
  timeout_ms: number;
  max_tool_calls: number;
  approval_required: boolean;
  execution_mode: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

/** AI platform repositories (Phase 10): A.9 coordination + A.21 runtime. Tenant-scoped. */
export class AiRepository extends BaseRepository {
  protected table = "agents";

  async createAgent(ctx: TenantContext, projectId: string | null, name: string,
    description: string, ownerId: string, tx?: PoolClient) {
    const res = await this.query(
      `INSERT INTO agents(organization_id, project_id, name, description, owner_user_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [ctx.organizationId, projectId, name.trim(), description, ownerId], tx);
    return res.rows[0];
  }
  async findAgent(ctx: TenantContext, id: string, tx?: PoolClient): Promise<AgentRow> {
    return this.findByIdInOrg<AgentRow>(id, ctx.organizationId, tx);
  }
  async listAgents(ctx: TenantContext, tx?: PoolClient) {
    const res = await this.query("SELECT * FROM agents WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 100",
      [ctx.organizationId], tx);
    return res.rows;
  }
  async setAgentDefaults(ctx: TenantContext, id: string, versionId: string,
    status: string, version: number, tx?: PoolClient) {
    await this.findByIdInOrg(id, ctx.organizationId, tx);
    const res = await this.query(
      "UPDATE agents SET default_version_id=$3, status=$4, version=version+1, updated_at=now() WHERE id=$1 AND version=$2 RETURNING *",
      [id, version, versionId, status], tx);
    if (res.rowCount === 0) {
      const { ConflictError } = await import("../domain/errors.js");
      throw new ConflictError("agents: stale version");
    }
    return res.rows[0];
  }

  async createVersion(ctx: TenantContext, agentId: string, versionNo: number,
    hash: string, config: Record<string, unknown>, tx?: PoolClient) {
    const res = await this.query(
      `INSERT INTO agent_versions(organization_id, agent_id, version_no, definition_hash, config)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [ctx.organizationId, agentId, versionNo, hash, JSON.stringify(config)], tx);
    return res.rows[0];
  }
  async findVersion(ctx: TenantContext, id: string, tx?: PoolClient) {
    const res = await this.query("SELECT * FROM agent_versions WHERE id=$1 AND organization_id=$2",
      [id, ctx.organizationId], tx);
    if (res.rowCount === 0) {
      const { NotFoundError } = await import("../domain/errors.js");
      throw new NotFoundError("agent_versions");
    }
    const row = res.rows[0];
    if (typeof row.config === "string") { try { row.config = JSON.parse(row.config); } catch { /* keep */ } }
    return row;
  }
  async findVersionByHash(ctx: TenantContext, agentId: string, hash: string, tx?: PoolClient) {
    const res = await this.query(
      "SELECT * FROM agent_versions WHERE organization_id=$1 AND agent_id=$2 AND definition_hash=$3",
      [ctx.organizationId, agentId, hash], tx);
    return res.rows[0] ?? null;
  }
  async findVersionByNo(ctx: TenantContext, agentId: string, no: number, tx?: PoolClient) {
    const res = await this.query(
      "SELECT * FROM agent_versions WHERE organization_id=$1 AND agent_id=$2 AND version_no=$3",
      [ctx.organizationId, agentId, no], tx);
    if (res.rowCount === 0) {
      const { NotFoundError } = await import("../domain/errors.js");
      throw new NotFoundError("agent_versions");
    }
    return res.rows[0];
  }
  async countVersions(ctx: TenantContext, agentId: string, tx?: PoolClient) {
    const res = await this.query(
      "SELECT COUNT(*)::int AS n FROM agent_versions WHERE organization_id=$1 AND agent_id=$2",
      [ctx.organizationId, agentId], tx);
    return Number(res.rows[0].n);
  }
  async listVersions(ctx: TenantContext, agentId: string, tx?: PoolClient) {
    const res = await this.query(
      "SELECT * FROM agent_versions WHERE organization_id=$1 AND agent_id=$2 ORDER BY version_no",
      [ctx.organizationId, agentId], tx);
    return res.rows;
  }
  async supersedeVersion(ctx: TenantContext, id: string, tx?: PoolClient) {
    await this.query("UPDATE agent_versions SET status='superseded', updated_at=now() WHERE id=$1", [id], tx);
  }

  private parseJson(row: Record<string, unknown>, keys: string[]): void {
    for (const k of keys) {
      if (typeof row[k] === "string") { try { row[k] = JSON.parse(row[k] as string); } catch { /* keep */ } }
    }
  }
  private withTools(row: Record<string, unknown>): AgentPolicyRow {
    this.parseJson(row, ["tools", "denied_tools"]);
    row.allowed_tools = row.tools; return row as unknown as AgentPolicyRow;
  }

  async createPolicy(ctx: TenantContext, agentId: string, projectId: string | null,
    doc: Record<string, unknown>, tx?: PoolClient): Promise<AgentPolicyRow> {
    const res = await this.query(
      `INSERT INTO agent_policies(organization_id, agent_id, project_id, tools, denied_tools,
        model, max_tokens, timeout_ms, max_tool_calls, approval_required, execution_mode)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [ctx.organizationId, agentId, projectId, JSON.stringify(doc.allowed_tools ?? []),
        JSON.stringify(doc.denied_tools ?? []), doc.model ?? null, doc.max_tokens ?? null,
        doc.timeout_ms ?? 120000, doc.max_tool_calls ?? 25, doc.approval_required ?? true,
        doc.execution_mode ?? "supervised"], tx);
    return this.withTools(res.rows[0]);
  }
  async findPolicy(ctx: TenantContext, id: string, tx?: PoolClient): Promise<AgentPolicyRow> {
    const res = await this.query("SELECT * FROM agent_policies WHERE id=$1 AND organization_id=$2",
      [id, ctx.organizationId], tx);
    if (res.rowCount === 0) {
      const { NotFoundError } = await import("../domain/errors.js");
      throw new NotFoundError("agent_policies");
    }
    return this.withTools(res.rows[0]);
  }
  async activePolicyFor(ctx: TenantContext, agentId: string, tx?: PoolClient): Promise<AgentPolicyRow | null> {
    const res = await this.query(
      `SELECT * FROM agent_policies WHERE organization_id=$1 AND agent_id=$2 AND status='active'
       ORDER BY created_at DESC LIMIT 1`, [ctx.organizationId, agentId], tx);
    if (!res.rows[0]) return null;
    return this.withTools(res.rows[0]);
  }

  async createRun(ctx: TenantContext, projectId: string, agentId: string, versionId: string,
    policyId: string | null, sessionId: string | null, key: string, tx?: PoolClient) {
    const res = await this.query(
      `INSERT INTO agent_runs(organization_id, project_id, agent_id, agent_version_id, policy_id,
        orchestration_session_id, idempotency_key, correlation_id, started_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now()) RETURNING *`,
      [ctx.organizationId, projectId, agentId, versionId, policyId, sessionId, key, ctx.correlationId], tx);
    return res.rows[0];
  }
  async findRun(ctx: TenantContext, id: string, tx?: PoolClient) {
    const res = await this.query("SELECT * FROM agent_runs WHERE id=$1 AND organization_id=$2",
      [id, ctx.organizationId], tx);
    if (res.rowCount === 0) {
      const { NotFoundError } = await import("../domain/errors.js");
      throw new NotFoundError("agent_runs");
    }
    return res.rows[0];
  }
  async findRunByKey(key: string, tx?: PoolClient) {
    const res = await this.query("SELECT * FROM agent_runs WHERE idempotency_key=$1", [key], tx);
    return res.rows[0] ?? null;
  }
  async listRuns(ctx: TenantContext, tx?: PoolClient) {
    const res = await this.query(
      "SELECT * FROM agent_runs WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 100",
      [ctx.organizationId], tx);
    return res.rows;
  }
  async setRunStatus(ctx: TenantContext, id: string, status: string, version: number, tx?: PoolClient) {
    await this.findRun(ctx, id, tx);
    const terminal = status === "succeeded" || status === "failed" || status === "halted";
    const res = await this.query(
      `UPDATE agent_runs SET status=$3, version=version+1, updated_at=now()${terminal ? ", ended_at=now()" : ""}
       WHERE id=$1 AND version=$2 RETURNING *`, [id, version, status], tx);
    if (res.rowCount === 0) {
      const { ConflictError } = await import("../domain/errors.js");
      throw new ConflictError("agent_runs: stale version");
    }
    return res.rows[0];
  }

  async createPlan(ctx: TenantContext, runId: string, hash: string, body: Record<string, unknown>, tx?: PoolClient) {
    const res = await this.query(
      "INSERT INTO agent_plans(organization_id, run_id, content_hash, body) VALUES ($1,$2,$3,$4) RETURNING *",
      [ctx.organizationId, runId, hash, JSON.stringify(body)], tx);
    const row = res.rows[0]; this.parseJson(row, ["body"]); return row;
  }
  async findPlan(ctx: TenantContext, id: string, tx?: PoolClient) {
    const res = await this.query("SELECT * FROM agent_plans WHERE id=$1 AND organization_id=$2",
      [id, ctx.organizationId], tx);
    if (res.rowCount === 0) {
      const { NotFoundError } = await import("../domain/errors.js");
      throw new NotFoundError("agent_plans");
    }
    const row = res.rows[0]; this.parseJson(row, ["body"]); return row;
  }
  async latestPlan(ctx: TenantContext, runId: string, tx?: PoolClient) {
    const res = await this.query(
      "SELECT * FROM agent_plans WHERE organization_id=$1 AND run_id=$2 ORDER BY created_at DESC LIMIT 1",
      [ctx.organizationId, runId], tx);
    if (!res.rows[0]) return null;
    const row = res.rows[0]; this.parseJson(row, ["body"]); return row;
  }
  async listPlans(ctx: TenantContext, runId: string, tx?: PoolClient) {
    const res = await this.query(
      "SELECT * FROM agent_plans WHERE organization_id=$1 AND run_id=$2 ORDER BY created_at",
      [ctx.organizationId, runId], tx);
    return res.rows;
  }
  async setPlanStatus(ctx: TenantContext, id: string, status: string, version: number, tx?: PoolClient) {
    await this.findPlan(ctx, id, tx);
    const res = await this.query(
      "UPDATE agent_plans SET status=$3, version=version+1, updated_at=now() WHERE id=$1 AND version=$2 RETURNING *",
      [id, version, status], tx);
    if (res.rowCount === 0) {
      const { ConflictError } = await import("../domain/errors.js");
      throw new ConflictError("agent_plans: stale version");
    }
    return res.rows[0];
  }

  async createResult(ctx: TenantContext, runId: string, hash: string,
    payload: Record<string, unknown>, tx?: PoolClient) {
    const res = await this.query(
      "INSERT INTO agent_results(organization_id, run_id, payload_hash, payload) VALUES ($1,$2,$3,$4) RETURNING *",
      [ctx.organizationId, runId, hash, JSON.stringify(payload)], tx);
    const row = res.rows[0]; this.parseJson(row, ["payload"]); return row;
  }
  async listResults(ctx: TenantContext, runId: string, tx?: PoolClient) {
    const res = await this.query(
      "SELECT * FROM agent_results WHERE organization_id=$1 AND run_id=$2 ORDER BY created_at",
      [ctx.organizationId, runId], tx);
    return res.rows;
  }

  async findTool(id: string, tx?: PoolClient) {
    const res = await this.query("SELECT * FROM tool_definitions WHERE id=$1", [id], tx);
    return res.rows[0] ?? null;
  }
  async recordToolInvocation(ctx: TenantContext, runId: string, toolId: string,
    input: Record<string, unknown>, decision: string, key: string, reason: string, tx?: PoolClient) {
    const res = await this.query(
      `INSERT INTO tool_invocations(organization_id, run_id, tool_id, input, decision, idempotency_key, reason)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (run_id, idempotency_key) DO UPDATE SET reason=EXCLUDED.reason RETURNING *`,
      [ctx.organizationId, runId, toolId, JSON.stringify(input ?? {}), decision, key, reason], tx);
    return res.rows[0];
  }

  async createSession(ctx: TenantContext, projectId: string, tx?: PoolClient) {
    const res = await this.query(
      "INSERT INTO orchestration_sessions(organization_id, project_id) VALUES ($1,$2) RETURNING *",
      [ctx.organizationId, projectId], tx);
    return res.rows[0];
  }
  async findSession(ctx: TenantContext, id: string, tx?: PoolClient) {
    const res = await this.query(
      "SELECT * FROM orchestration_sessions WHERE id=$1 AND organization_id=$2", [id, ctx.organizationId], tx);
    if (res.rowCount === 0) {
      const { NotFoundError } = await import("../domain/errors.js");
      throw new NotFoundError("orchestration_sessions");
    }
    return res.rows[0];
  }
  async listSessions(ctx: TenantContext, tx?: PoolClient) {
    const res = await this.query(
      "SELECT * FROM orchestration_sessions WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 100",
      [ctx.organizationId], tx);
    return res.rows;
  }
  async setSessionStatus(ctx: TenantContext, id: string, status: string, version: number, tx?: PoolClient) {
    await this.findSession(ctx, id, tx);
    const res = await this.query(
      "UPDATE orchestration_sessions SET status=$3, version=version+1, updated_at=now() WHERE id=$1 AND version=$2 RETURNING *",
      [id, version, status], tx);
    if (res.rowCount === 0) {
      const { ConflictError } = await import("../domain/errors.js");
      throw new ConflictError("orchestration_sessions: stale version");
    }
    return res.rows[0];
  }
  async createAssignment(ctx: TenantContext, sessionId: string, projectId: string, agentId: string,
    task: string, priority: number, creatorId: string, tx?: PoolClient) {
    const res = await this.query(
      `INSERT INTO session_assignments(organization_id, session_id, project_id, agent_id, task, priority, creator_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [ctx.organizationId, sessionId, projectId, agentId, task, priority, creatorId], tx);
    return res.rows[0];
  }
  async createLock(ctx: TenantContext, sessionId: string, resource: string,
    holder: string, expires: string, tx?: PoolClient) {
    const res = await this.query(
      `INSERT INTO session_locks(organization_id, session_id, resource, holder, expires_at)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [ctx.organizationId, sessionId, resource, holder, expires], tx);
    return res.rows[0];
  }
  async findActiveLock(ctx: TenantContext, sessionId: string, resource: string, tx?: PoolClient) {
    const res = await this.query(
      `SELECT * FROM session_locks WHERE organization_id=$1 AND session_id=$2 AND resource=$3
       AND released_at IS NULL ORDER BY created_at DESC LIMIT 1`,
      [ctx.organizationId, sessionId, resource], tx);
    const row = res.rows[0] ?? null;
    if (row && row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return null;
    return row;
  }
  async releaseLock(ctx: TenantContext, id: string, tx?: PoolClient) {
    const res = await this.query(
      "UPDATE session_locks SET released_at=now(), updated_at=now() WHERE id=$1 RETURNING *", [id], tx);
    return res.rows[0];
  }
  async createEscalation(ctx: TenantContext, sessionId: string, reason: string, tx?: PoolClient) {
    const res = await this.query(
      "INSERT INTO session_escalations(organization_id, session_id, reason) VALUES ($1,$2,$3) RETURNING *",
      [ctx.organizationId, sessionId, reason], tx);
    return res.rows[0];
  }
}
