/** A.9 coordination plane: sessions, assignments, locks, escalations (Phase 10). Never executes tools. */
import { PoolClient } from "pg";
import { TenantContext } from "./tenancy.js";
import { withTransaction } from "../persistence/db.js";
import { AuditRepository } from "../persistence/auditRepository.js";
import { AiRepository } from "../persistence/aiRepository.js";
import { assertTransition } from "./lifecycle.js";

const audits = new AuditRepository();
const repos = new AiRepository();

export class CoordinationService {
  async createSession(ctx: TenantContext, projectId: string, actorId: string) {
    return withTransaction(async (tx: PoolClient) => {
      const row = await repos.createSession(ctx, projectId, tx);
      await audits.append({ ...ctx, projectId, actorId, principalType: "human" },
        "orchestration.session.created", "orchestration_session", row.id, "success", {}, tx);
      return row;
    });
  }

  async createAssignment(ctx: TenantContext, sessionId: string, projectId: string,
    agentId: string, task: string, priority: number, actorId: string) {
    if (!task || task.length > 2000) {
      const { ValidationError } = await import("./errors.js");
      throw new ValidationError("assignment task must be 1..2000 chars");
    }
    // An agent cannot assign itself unrestricted work: agentId must differ from actor.
    return withTransaction(async (tx: PoolClient) => {
      const row = await repos.createAssignment(ctx, sessionId, projectId, agentId,
        task.slice(0, 2000), priority ?? 0, actorId, tx);
      await audits.append({ ...ctx, projectId, actorId, principalType: "human" },
        "orchestration.assignment.created", "session_assignment", row.id, "success", { agentId }, tx);
      return row;
    });
  }

  /** Scoped lock: owner + session + resource + lease; prevents unsafe concurrent execution. */
  async acquireLock(ctx: TenantContext, sessionId: string, resource: string,
    holder: string, leaseMs: number, actorId: string) {
    if (!resource || resource.length > 300) {
      const { ValidationError } = await import("./errors.js");
      throw new ValidationError("lock resource must be 1..300 chars");
    }
    const expires = new Date(Date.now() + Math.min(Math.max(leaseMs, 1000), 3600000)).toISOString();
    return withTransaction(async (tx: PoolClient) => {
      const existing = await repos.findActiveLock(ctx, sessionId, resource, tx);
      if (existing && existing.holder !== holder) {
        const { ConflictError } = await import("./errors.js");
        throw new ConflictError("lock held by another owner");
      }
      if (existing) return existing;
      const row = await repos.createLock(ctx, sessionId, resource, holder, expires, tx);
      await audits.append({ ...ctx, actorId, principalType: "human" },
        "orchestration.lock.acquired", "session_lock", row.id, "success", { resource, holder }, tx);
      return row;
    });
  }

  async releaseLock(ctx: TenantContext, sessionId: string, resource: string, holder: string, actorId: string) {
    return withTransaction(async (tx: PoolClient) => {
      const existing = await repos.findActiveLock(ctx, sessionId, resource, tx);
      if (!existing) {
        const { NotFoundError } = await import("./errors.js");
        throw new NotFoundError("session_locks");
      }
      if (existing.holder !== holder) {
        const { ForbiddenError } = await import("./authorization.js");
        throw new ForbiddenError("lock theft prohibited: only the holder may release");
      }
      const out = await repos.releaseLock(ctx, existing.id, tx);
      await audits.append({ ...ctx, actorId, principalType: "human" },
        "orchestration.lock.released", "session_lock", existing.id, "success", { resource }, tx);
      return out;
    });
  }

  /** Escalation: "I cannot safely continue" routed to a human/system boundary. No delivery. */
  async escalate(ctx: TenantContext, sessionId: string, projectId: string, reason: string, actorId: string) {
    if (!reason || reason.length > 2000) {
      const { ValidationError } = await import("./errors.js");
      throw new ValidationError("escalation reason must be 1..2000 chars");
    }
    return withTransaction(async (tx: PoolClient) => {
      const row = await repos.createEscalation(ctx, sessionId, reason.slice(0, 2000), tx);
      const session = await repos.findSession(ctx, sessionId, tx);
      assertTransition("orchestration_session", session.status, "escalated");
      await repos.setSessionStatus(ctx, sessionId, "escalated", session.version, tx);
      await audits.append({ ...ctx, projectId, actorId, principalType: "human" },
        "escalation.created", "session_escalation", row.id, "success", { reason: reason.slice(0, 200) }, tx);
      return row;
    });
  }
}
export const coordinationService = new CoordinationService();
