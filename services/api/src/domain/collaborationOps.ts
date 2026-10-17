import { PoolClient } from "pg";
import { TenantContext } from "../domain/tenancy.js";
import { withTransaction } from "../persistence/db.js";
import { invalidMentions, resolveTarget, validateBody } from "../persistence/collaborationRepository.js";
import { CommentTarget, audits, collabRepos, idem, recordActivity, scopeCollabProject, updateWithVersion } from "./collaborationService.js";
import { ConflictError, NotFoundError } from "./errors.js";

/** Phase 9 collaboration operations: assignments + comments, transactional. */
export class CollaborationOps {
  async assignTask(ctx: TenantContext, projectId: string, taskId: string, assignee: string | null,
    actorId: string, key?: string, expectedVersion?: number) {
    if (key) {
      const hit = await idem.check(ctx, "collab:assign", key);
      if (hit) return hit as unknown;
    }
    return withTransaction(async (tx: PoolClient) => {
      await scopeCollabProject(ctx, projectId, tx);
      const t = await tx.query("SELECT * FROM engineering_tasks WHERE id=$1 AND organization_id=$2",
        [taskId, ctx.organizationId]);
      if (t.rowCount === 0) throw new NotFoundError("engineering_tasks");
      const task = t.rows[0];
      if (task.project_id !== projectId) throw new ConflictError("task outside project");
      if (assignee) await collabRepos.assertParticipant(ctx, projectId, assignee, tx);
      const action = !assignee ? "unassigned" : (!task.assignee_user_id ? "assigned" : "reassigned");
      let sql = "UPDATE engineering_tasks SET assignee_user_id=$3, updated_at=now(), version=version+1 WHERE id=$1 AND organization_id=$2";
      const params: unknown[] = [taskId, ctx.organizationId, assignee];
      if (expectedVersion !== undefined) { sql += " AND version=$4"; params.push(expectedVersion); }
      const upd = await tx.query(sql + " RETURNING *", params as never[]);
      if (upd.rowCount === 0) throw new ConflictError("engineering_tasks: stale version");
      await tx.query(
        "INSERT INTO task_assignments(organization_id, project_id, task_id, assignee_user_id, action, actor_user_id) VALUES ($1,$2,$3,$4,$5,$6)",
        [ctx.organizationId, projectId, taskId, assignee, action, actorId]);
      await recordActivity(ctx, projectId, action === "unassigned" ? "task.unassigned" : "task.assigned",
        "engineering_task", taskId, { assignee }, tx);
      await audits.append({ ...ctx, projectId, actorId, principalType: "human" },
        action === "unassigned" ? "task.unassigned" : "task.assigned", "engineering_task", taskId, "success", { assignee }, tx);
      const out = upd.rows[0];
      if (key) await idem.save(ctx, "collab:assign", key, out, tx);
      return out;
    });
  }

  async createComment(ctx: TenantContext, projectId: string, target: CommentTarget, targetId: string,
    body: string, mentions: string[], actorId: string, key?: string) {
    if (key) {
      const hit = await idem.check(ctx, "collab:comment", key);
      if (hit) return hit as unknown;
    }
    return withTransaction(async (tx: PoolClient) => {
      await scopeCollabProject(ctx, projectId, tx);
      const q = (text: string, p: unknown[]) => tx.query(text, p as never[]) as unknown as Promise<{ rowCount: number; rows: Record<string, string>[] }>;
      await resolveTarget(q, target, targetId, ctx.organizationId, projectId);
      const bad = await invalidMentions(
        (text: string, p: unknown[]) => tx.query(text, p as never[]) as unknown as Promise<{ rows: { user_id: string }[] }>,
        ctx.organizationId, mentions);
      if (bad.length) throw new ConflictError("mention outside organization");
      const clean = validateBody(body);
      const res = await tx.query(
        "INSERT INTO comments(organization_id, project_id, target_type, target_id, author_user_id, body, mentions) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
        [ctx.organizationId, projectId, target, targetId, actorId, clean, [...new Set(mentions)]]);
      const row = res.rows[0];
      await recordActivity(ctx, projectId, "comment.added", "comment", row.id, { target, targetId }, tx);
      if (mentions.length) await recordActivity(ctx, projectId, "comment.mentioned", "comment", row.id, { mentioned: [...new Set(mentions)] }, tx);
      await audits.append({ ...ctx, projectId, actorId, principalType: "human" },
        "comment.added", "comment", row.id, "success", { target, targetId }, tx);
      if (key) await idem.save(ctx, "collab:comment", key, row, tx);
      return row;
    });
  }

  async editComment(ctx: TenantContext, projectId: string, id: string, version: number,
    body: string, actorId: string, privileged: boolean) {
    return withTransaction(async (tx: PoolClient) => {
      const cur = await tx.query("SELECT * FROM comments WHERE id=$1 AND organization_id=$2", [id, ctx.organizationId]);
      if (cur.rowCount === 0) throw new NotFoundError("comments");
      const row = cur.rows[0];
      if (row.project_id !== projectId) throw new ConflictError("comment outside project");
      if (row.author_user_id !== actorId && !privileged) {
        const { ForbiddenError } = await import("./authorization.js");
        throw new ForbiddenError("only author or privileged editor");
      }
      if (row.status === "archived") throw new ConflictError("comment archived");
      const out = await updateWithVersion("comments", id, version, { body: validateBody(body), status: "edited" }, tx);
      await recordActivity(ctx, projectId, "comment.edited", "comment", id, {}, tx);
      await audits.append({ ...ctx, projectId, actorId, principalType: "human" }, "comment.edited", "comment", id, "success", {}, tx);
      return out;
    });
  }
}

export const collaborationOps = new CollaborationOps();
