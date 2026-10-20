// Phase 14 PostgreSQL integration: durable events, outbox, notifications,
// deliveries, retries, tenant isolation, and concurrency.
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import type { AuthPrincipal } from "../domain/principal.js";

const hasDb = !!process.env.DATABASE_URL;
describe("phase14 notifications", { skip: !hasDb } as never, () => {
  before(async () => {
    const { migrateUp } = await import("../persistence/migrate.js");
    await migrateUp(process.env.DATABASE_URL as string);
    const { bootstrapNotificationProviders } = await import("../domain/notificationBootstrap.js");
    bootstrapNotificationProviders();
  });

  async function setup() {
    const { OrganizationRepository, WorkspaceRepository } = await import("../persistence/tenancyRepositories.js");
    const { ProjectRepository } = await import("../persistence/projectRepository.js");
    const { MembershipRepository } = await import("../persistence/membershipRepository.js");
    const { UserRepository } = await import("../persistence/userRepository.js");
    const ts = Date.now() + Math.floor(Math.random() * 100000);
    const org = await new OrganizationRepository().create(`N14 ${ts}`, `n14-${ts}`);
    const owner = await new UserRepository().create(`n14o-${ts}@t.co`, `N14 Owner ${ts}`, "scrypt$16384$dummy");
    const member = await new UserRepository().create(`n14m-${ts}@t.co`, `N14 Member ${ts}`, "scrypt$16384$dummy");
    const memberships = new MembershipRepository();
    await memberships.upsertActive({ organizationId: org.id, correlationId: "t" } as never, owner.id, "owner");
    await memberships.upsertActive({ organizationId: org.id, correlationId: "t" } as never, member.id, "developer");
    const ctx = { organizationId: org.id, actorId: owner.id, principalType: "human", correlationId: "t" } as never;
    const ws = await new WorkspaceRepository().create(ctx, "WS", `n14w-${ts}`);
    const p = await new ProjectRepository().create(ctx, ws.id, "P", `n14p-${ts}`);
    return { org, ws, p, owner, member, ctx, ts };
  }

  /** Publish an event inside one real transaction, then commit it. */
  async function publish(input: Record<string, unknown>) {
    const { publishDomainEvent } = await import("../domain/domainEvents.js");
    const { withTransaction } = await import("../persistence/db.js");
    return withTransaction(async (tx) => publishDomainEvent(tx, input as never));
  }

  async function taskAssigned(orgId: string, projectId: string, ownerId: string, assigneeId: string, agg: string, cid: string) {
    return publish({
      organizationId: orgId, projectId, eventType: "task.assigned",
      aggregateType: "engineering_task", aggregateId: agg,
      actorUserId: ownerId, principalType: "human",
      payload: { taskId: agg, assigneeUserId: assigneeId, action: "assigned" },
      correlationId: cid,
    });
  }

  it("publishes an immutable domain event and its outbox row in one transaction", async () => {
    const s = await setup();
    const { getPool } = await import("../persistence/db.js");
    const out = await publish({
      organizationId: s.org.id, projectId: s.p.id, eventType: "comment.mentioned",
      aggregateType: "comment", aggregateId: "00000000-0000-0000-0000-000000000001",
      actorUserId: s.owner.id, principalType: "human",
      payload: {
        commentId: "c1", targetType: "project", targetId: "t1",
        mentionedUserIds: [s.member.id], excerpt: "hi",
      },
      correlationId: "cid-1",
    });
    assert.ok(out.eventId);
    assert.ok(out.outboxId);
    const ev = await getPool().query("SELECT * FROM domain_events WHERE id=$1", [out.eventId]);
    assert.equal(ev.rowCount, 1);
    assert.equal(ev.rows[0].schema_version, 1);
    const ob = await getPool().query("SELECT * FROM outbox_events WHERE id=$1", [out.outboxId]);
    assert.equal(ob.rows[0].status, "pending");
  });

  it("collapses a replayed logical event onto the same event row", async () => {
    const s = await setup();
    const agg = "00000000-0000-0000-0000-000000000002";
    const a = await taskAssigned(s.org.id, s.p.id, s.owner.id, s.member.id, agg, "cid-2");
    const b = await taskAssigned(s.org.id, s.p.id, s.owner.id, s.member.id, agg, "cid-2");
    assert.equal(b.duplicate, true);
    assert.equal(b.eventId, a.eventId);
    const { getPool } = await import("../persistence/db.js");
    const n = await getPool().query(
      "SELECT COUNT(*)::int AS n FROM domain_events WHERE organization_id=$1", [s.org.id]);
    assert.equal(n.rows[0].n, 1);
  });

  it("refuses to mutate a domain event (DB-enforced immutability)", async () => {
    const s = await setup();
    const { getPool } = await import("../persistence/db.js");
    const out = await publish({
      organizationId: s.org.id, eventType: "integration.disconnected",
      aggregateType: "integration", aggregateId: "00000000-0000-0000-0000-000000000003",
      actorUserId: s.owner.id, principalType: "human",
      payload: { integrationId: "i1", kind: "github" }, correlationId: "cid-3",
    });
    await assert.rejects(
      () => getPool().query("UPDATE domain_events SET payload='{}' WHERE id=$1", [out.eventId]),
      /immutable/);
  });

  it("routes an event into a notification and a delivery row", async () => {
    const s = await setup();
    const { getPool } = await import("../persistence/db.js");
    const { dispatchOnce } = await import("../domain/notificationService.js");
    await taskAssigned(s.org.id, s.p.id, s.owner.id, s.member.id,
      "00000000-0000-0000-0000-000000000004", "cid-4");
    const res = await dispatchOnce({ workerId: "w-test-1" });
    assert.ok(res.routed >= 1, "expected the outbox row to be routed");
    const n = await getPool().query(
      "SELECT * FROM notifications WHERE organization_id=$1 AND recipient_user_id=$2",
      [s.org.id, s.member.id]);
    assert.ok((n.rowCount ?? 0) >= 1);
    const d = await getPool().query(
      "SELECT * FROM notification_deliveries WHERE organization_id=$1", [s.org.id]);
    assert.ok((d.rowCount ?? 0) >= 1);
  });

  it("never creates a notification for a recipient outside the organization", async () => {
    const s = await setup();
    const other = await setup();
    const { getPool } = await import("../persistence/db.js");
    const { dispatchOnce } = await import("../domain/notificationService.js");
    await taskAssigned(s.org.id, s.p.id, s.owner.id, other.member.id,
      "00000000-0000-0000-0000-000000000005", "cid-5");
    await dispatchOnce({ workerId: "w-test-2" });
    const n = await getPool().query(
      "SELECT * FROM notifications WHERE organization_id=$1 AND recipient_user_id=$2",
      [s.org.id, other.member.id]);
    assert.equal(n.rowCount, 0, "a cross-tenant recipient must never be notified");
  });

  it("does not notify the actor about their own action", async () => {
    const s = await setup();
    const { getPool } = await import("../persistence/db.js");
    const { dispatchOnce } = await import("../domain/notificationService.js");
    await taskAssigned(s.org.id, s.p.id, s.owner.id, s.owner.id,
      "00000000-0000-0000-0000-000000000006", "cid-6");
    await dispatchOnce({ workerId: "w-test-3" });
    const n = await getPool().query(
      "SELECT * FROM notifications WHERE organization_id=$1 AND recipient_user_id=$2",
      [s.org.id, s.owner.id]);
    assert.equal(n.rowCount, 0, "the actor must not be notified of their own action");
  });

  it("marks a delivery delivered and records the provider operation", async () => {
    const s = await setup();
    const { getPool } = await import("../persistence/db.js");
    const { dispatchOnce } = await import("../domain/notificationService.js");
    await taskAssigned(s.org.id, s.p.id, s.owner.id, s.member.id,
      "00000000-0000-0000-0000-000000000007", "cid-7");
    await dispatchOnce({ workerId: "w-test-4" });
    await dispatchOnce({ workerId: "w-test-4" });
    const d = await getPool().query(
      "SELECT * FROM notification_deliveries WHERE organization_id=$1", [s.org.id]);
    assert.equal(d.rows[0].status, "delivered");
    const ops = await getPool().query(
      "SELECT * FROM notification_provider_operations WHERE organization_id=$1", [s.org.id]);
    assert.ok((ops.rowCount ?? 0) >= 1);
    assert.equal(ops.rows[0].result, "accepted");
  });

  it("dead-letters a delivery when the recipient is no longer an active member", async () => {
    const s = await setup();
    const { getPool } = await import("../persistence/db.js");
    const { dispatchOnce } = await import("../domain/notificationService.js");
    await taskAssigned(s.org.id, s.p.id, s.owner.id, s.member.id,
      "00000000-0000-0000-0000-000000000008", "cid-8");
    // Route ONLY (no delivery stage): claim the outbox row, create the
    // notification + delivery, but leave the delivery pending.
    const { claimDueOutbox } = await import("../persistence/notificationOutboxRepository.js");
    const claimed = await claimDueOutbox(10, "w-route-only", 30_000);
    const row = claimed.find((r) => r.organization_id === s.org.id);
    assert.ok(row, "expected to claim the outbox row");
    // Simulate the routing stage having produced a pending delivery, then
    // remove the member BEFORE the delivery stage runs.
    const notif = await getPool().query(
      "INSERT INTO notifications(organization_id, project_id, event_id, event_type, recipient_user_id, title, body, payload, priority) VALUES ($1,$2,$3,'task.assigned',$4,'t','b','{}','normal') RETURNING id",
      [s.org.id, s.p.id, row!.event_id, s.member.id]);
    await getPool().query(
      "INSERT INTO notification_deliveries(notification_id, organization_id, channel, provider) VALUES ($1,$2,'in_app','in_app')",
      [notif.rows[0].id, s.org.id]);
    await getPool().query(
      "UPDATE memberships SET status='removed' WHERE organization_id=$1 AND user_id=$2",
      [s.org.id, s.member.id]);
    await dispatchOnce({ workerId: "w-test-5" });
    const d = await getPool().query(
      "SELECT * FROM notification_deliveries WHERE organization_id=$1", [s.org.id]);
    assert.equal(d.rows[0].status, "dead_letter");
    assert.equal(d.rows[0].last_error_code, "recipient_unavailable");
  });

  it("honours a disabled preference (opt-out)", async () => {
    const s = await setup();
    const { getPool } = await import("../persistence/db.js");
    const { dispatchOnce } = await import("../domain/notificationService.js");
    const { PreferenceRepository } = await import("../persistence/notificationPreferenceRepository.js");
    await new PreferenceRepository().upsert({
      organizationId: s.org.id, userId: s.member.id,
      notificationType: "task.assigned", channel: "in_app", enabled: false,
    });
    await taskAssigned(s.org.id, s.p.id, s.owner.id, s.member.id,
      "00000000-0000-0000-0000-000000000009", "cid-9");
    await dispatchOnce({ workerId: "w-test-6" });
    const n = await getPool().query(
      "SELECT * FROM notifications WHERE organization_id=$1 AND recipient_user_id=$2",
      [s.org.id, s.member.id]);
    assert.equal(n.rowCount, 0, "a disabled preference must suppress the notification");
  });

  it("never lets one worker deliver the same row twice (concurrency)", async () => {
    const s = await setup();
    const { getPool } = await import("../persistence/db.js");
    const { dispatchOnce } = await import("../domain/notificationService.js");
    await taskAssigned(s.org.id, s.p.id, s.owner.id, s.member.id,
      "00000000-0000-0000-0000-000000000010", "cid-10");
    await Promise.all([
      dispatchOnce({ workerId: "w-c1" }),
      dispatchOnce({ workerId: "w-c2" }),
      dispatchOnce({ workerId: "w-c3" }),
    ]);
    const n = await getPool().query(
      "SELECT * FROM notifications WHERE organization_id=$1 AND recipient_user_id=$2",
      [s.org.id, s.member.id]);
    assert.equal(n.rowCount, 1, "concurrent workers must not duplicate the notification");
    const d = await getPool().query(
      "SELECT * FROM notification_deliveries WHERE organization_id=$1", [s.org.id]);
    assert.equal(d.rowCount, 1, "concurrent workers must not duplicate the delivery");
  });

  it("scopes a notification read to its own recipient", async () => {
    const s = await setup();
    const other = await setup();
    const { dispatchOnce } = await import("../domain/notificationService.js");
    const { listMyNotifications, markNotificationRead } = await import("../domain/notificationApi.js");
    await taskAssigned(s.org.id, s.p.id, s.owner.id, s.member.id,
      "00000000-0000-0000-0000-000000000011", "cid-11");
    await dispatchOnce({ workerId: "w-test-7" });
    const page = await listMyNotifications(s.ctx, s.member.id, { limit: 10 });
    assert.equal(page.rows.length, 1);
    const id = String(page.rows[0].id);
    // Another member in the same org must not be able to read it.
    const otherCtx = { organizationId: s.org.id, actorId: other.owner.id, correlationId: "t" } as never;
    const stolen = await markNotificationRead(otherCtx, other.owner.id, id);
    assert.equal(stolen, null, "a notification is readable only by its recipient");
    // A different organization must not be able to read it either.
    const foreign = await markNotificationRead(other.ctx, s.member.id, id);
    assert.equal(foreign, null, "a cross-tenant notification read must not resolve");
  });
  it("rejects a non-user actor (system/agent) without aborting the transaction", async () => {
    const s = await setup();
    const { getPool } = await import("../persistence/db.js");
    // An actor is an opaque principal reference, not necessarily a users row.
    // A system-initiated event must publish cleanly, not raise 22P02.
    const out = await publish({
      organizationId: s.org.id, projectId: s.p.id, eventType: "task.assigned",
      aggregateType: "engineering_task", aggregateId: "00000000-0000-0000-0000-000000000012",
      actorUserId: "system", principalType: "system",
      payload: {
        taskId: "00000000-0000-0000-0000-000000000012",
        assigneeUserId: s.member.id, action: "assigned",
      },
      correlationId: "cid-12",
    });
    assert.ok(out.eventId);
    const ev = await getPool().query(
      "SELECT actor_user_id, principal_type FROM domain_events WHERE id=$1", [out.eventId]);
    assert.equal(ev.rows[0].actor_user_id, "system");
    assert.equal(ev.rows[0].principal_type, "system");
  });

  it("rejects reading another member's preferences without notification.admin", async () => {
    const s = await setup();
    const { canInOrg } = await import("../domain/authorization.js");
    // A plain developer member holds notification.preferences.manage but NOT
    // notification.admin, so they may not read another member's preferences.
    const developer = {
      kind: "human", subjectId: s.member.id, assurance: "password",
      memberships: [{ organizationId: s.org.id, role: "developer", status: "active" }],
      correlationId: "t",
    } as AuthPrincipal;
    assert.equal(canInOrg(developer, s.org.id, "notification.preferences.manage"), true);
    assert.equal(canInOrg(developer, s.org.id, "notification.admin"), false,
      "a developer must not hold notification.admin");
    // The owner does hold it, so the same read is permitted for an admin.
    const owner: AuthPrincipal = {
      kind: "human", subjectId: s.owner.id, assurance: "stepped-up",
      memberships: [{ organizationId: s.org.id, role: "owner", status: "active" }],
      correlationId: "t",
    };
    assert.equal(canInOrg(owner, s.org.id, "notification.admin"), true);
  });

});
