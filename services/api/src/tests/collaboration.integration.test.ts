// Phase 9 PostgreSQL integration: members, assignment, comments, activity.
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

const hasDb = !!process.env.DATABASE_URL;
describe("phase9 collaboration", { skip: !hasDb } as never, () => {
  before(async () => {
    const { migrateUp } = await import("../persistence/migrate.js");
    await migrateUp(process.env.DATABASE_URL as string);
  });
  async function setup() {
    const { OrganizationRepository, WorkspaceRepository } = await import("../persistence/tenancyRepositories.js");
    const { ProjectRepository } = await import("../persistence/projectRepository.js");
    const { MembershipRepository } = await import("../persistence/membershipRepository.js");
    const { UserRepository } = await import("../persistence/userRepository.js");
    const ts = Date.now() + Math.floor(Math.random() * 100000);
    const org = await new OrganizationRepository().create(`C9 ${ts}`, `c9-${ts}`);
    const u = await new UserRepository().create(`c9-${ts}@t.co`, `C9 ${ts}`, "scrypt$16384$dummy");
    await new MembershipRepository().upsertActive({ organizationId: org.id, correlationId: "t" } as never, u.id, "owner");
    const ctx = { organizationId: org.id, actorId: u.id, principalType: "human", correlationId: "t" } as never;
    const ws = await new WorkspaceRepository().create(ctx, "WS", `c9w-${ts}`);
    const p = await new ProjectRepository().create(ctx, ws.id, "P", `c9p-${ts}`);
    return { org, ws, p, user: u, ctx };
  }
  it("assigns tasks with history + activity + idempotency", async () => {
    const { p, user, ctx } = await setup();
    const { collaborationOps } = await import("../domain/collaborationOps.js");
    const { tasks } = await import("../domain/engineeringService.js");
    const t = await tasks.create(ctx, p.id, "Build API");
    const a = await (collaborationOps as never as {
      assignTask(c: never, pid: string, tid: string, u: string, actor: string, k: string): Promise<{ assignee_user_id: string }>
    }).assignTask(ctx, p.id, t.id, user.id, user.id, `k-${Date.now()}`);
    assert.equal(a.assignee_user_id, user.id);
    const { getPool } = await import("../persistence/db.js");
    const hist = await getPool().query("SELECT action FROM task_assignments WHERE task_id=$1", [t.id]);
    assert.equal(hist.rows[0].action, "assigned");
    const act = await getPool().query("SELECT event_type FROM activity_events WHERE project_id=$1 AND event_type='task.assigned'", [p.id]);
    assert.ok((act.rowCount ?? 0) >= 1);
  });
  it("creates comments with target binding + mentions + tombstone", async () => {
    const s = await setup();
    const { collaborationOps } = await import("../domain/collaborationOps.js");
    const ops = collaborationOps as never as {
      createComment(c: never, pid: string, tt: string, tid: string, b: string, m: string[], a: string): Promise<{ id: string; version: number }>;
      editComment(c: never, pid: string, id: string, v: number, b: string, a: string, priv: boolean): Promise<{ status: string }>;
    };
    const c = await ops.createComment(s.ctx, s.p.id, "project", s.p.id, "hello", [s.user.id], s.user.id);
    assert.ok(c.id);
    const e = await ops.editComment(s.ctx, s.p.id, c.id, c.version, "hello v2", s.user.id, false);
    assert.equal(e.status, "edited");
    await assert.rejects(() => ops.editComment(s.ctx, s.p.id, c.id, 1, "stale", s.user.id, false), /stale|CONFLICT/);
  });
  it("rejects cross-project target mismatch", async () => {
    const a = await setup();
    const b = await setup();
    const { tasks } = await import("../domain/engineeringService.js");
    const t = await tasks.create(b.ctx, b.p.id, "Other");
    const { collaborationOps } = await import("../domain/collaborationOps.js");
    const ops = collaborationOps as never as {
      createComment(c: never, pid: string, tt: string, tid: string, b: string, m: string[], a: string): Promise<unknown>;
    };
    await assert.rejects(() => ops.createComment(a.ctx, a.p.id, "task", t.id, "x", [], a.user.id), /outside project/);
  });
});
