/**
 * Phase 16 PostgreSQL integration: crash recovery, stale-claim reclamation,
 * and provider-deadline handling.
 *
 * These are the disaster-recovery invariants: after an unclean shutdown the
 * durable pipeline must resume without losing or duplicating work.
 */
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

const hasDb = !!process.env.DATABASE_URL;
describe("phase16 recovery", { skip: !hasDb } as never, () => {
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
    const org = await new OrganizationRepository().create(`N16 ${ts}`, `n16-${ts}`);
    const owner = await new UserRepository().create(`n16o-${ts}@t.co`, `N16 Owner ${ts}`, "scrypt$16384$dummy");
    const member = await new UserRepository().create(`n16m-${ts}@t.co`, `N16 Member ${ts}`, "scrypt$16384$dummy");
    const memberships = new MembershipRepository();
    await memberships.upsertActive({ organizationId: org.id, correlationId: "t" } as never, owner.id, "owner");
    await memberships.upsertActive({ organizationId: org.id, correlationId: "t" } as never, member.id, "developer");
    const ctx = { organizationId: org.id, actorId: owner.id, principalType: "human", correlationId: "t" } as never;
    const ws = await new WorkspaceRepository().create(ctx, "WS", `n16w-${ts}`);
    const p = await new ProjectRepository().create(ctx, ws.id, "P", `n16p-${ts}`);
    return { org, ws, p, owner, member, ctx, ts };
  }

  async function publish(input: Record<string, unknown>) {
    const { publishDomainEvent } = await import("../domain/domainEvents.js");
    const { withTransaction } = await import("../persistence/db.js");
    return withTransaction(async (tx) => publishDomainEvent(tx, input as never));
  }

  /** Publish a task.assigned event that will route to `member`. */
  async function publishAssigned(s: Awaited<ReturnType<typeof setup>>, agg: string, cid: string) {
    await publish({
      organizationId: s.org.id, projectId: s.p.id, eventType: "task.assigned",
      aggregateType: "engineering_task", aggregateId: agg,
      actorUserId: s.owner.id, principalType: "human",
      payload: { taskId: agg, assigneeUserId: s.member.id, action: "assigned" },
      correlationId: cid,
    });
  }


  it("reclaims an outbox row abandoned by an expired claim", async () => {
    const s = await setup();
    const { getPool } = await import("../persistence/db.js");
    const { recoverStaleClaims } = await import("../domain/notificationService.js");
    await publishAssigned(s, "00000000-0000-0000-0000-000000000101", "cid-101");
    // Simulate a crashed worker: the row is stuck in `processing` with an
    // EXPIRED lease (the process died before completing it).
    await getPool().query(
      `UPDATE outbox_events SET status='processing', claimed_by='dead-worker',
         claim_expires_at=now() - interval '1 hour'
       WHERE organization_id=$1`, [s.org.id]);
    const before = await getPool().query(
      "SELECT status, claimed_by FROM outbox_events WHERE organization_id=$1", [s.org.id]);
    assert.equal(before.rows[0].status, "processing");

    const result = await recoverStaleClaims();
    assert.ok(result.outboxRecovered >= 1, "the stale outbox claim must be recovered");
    const after = await getPool().query(
      "SELECT status, claimed_by, last_error_code FROM outbox_events WHERE organization_id=$1", [s.org.id]);
    assert.equal(after.rows[0].status, "retryable_failure");
    assert.equal(after.rows[0].claimed_by, null, "the dead claim must be released");
    assert.equal(after.rows[0].last_error_code, "stale_claim");
  });

  it("never resets a row whose claim is still live", async () => {
    const s = await setup();
    const { getPool } = await import("../persistence/db.js");
    const { recoverStaleClaims } = await import("../domain/notificationService.js");
    await publishAssigned(s, "00000000-0000-0000-0000-000000000102", "cid-102");
    // A worker that is legitimately mid-flight: the lease has NOT expired.
    await getPool().query(
      `UPDATE outbox_events SET status='processing', claimed_by='live-worker',
         claim_expires_at=now() + interval '1 hour'
       WHERE organization_id=$1`, [s.org.id]);
    await recoverStaleClaims();
    const after = await getPool().query(
      "SELECT status, claimed_by FROM outbox_events WHERE organization_id=$1", [s.org.id]);
    assert.equal(after.rows[0].status, "processing", "a live claim must be left alone");
    assert.equal(after.rows[0].claimed_by, "live-worker");
  });

  it("resumes and delivers work that was stranded by a crash", async () => {
    const s = await setup();
    const { getPool } = await import("../persistence/db.js");
    const { recoverStaleClaims, dispatchOnce } = await import("../domain/notificationService.js");
    await publishAssigned(s, "00000000-0000-0000-0000-000000000103", "cid-103");
    await getPool().query(
      `UPDATE outbox_events SET status='processing', claimed_by='dead-worker',
         claim_expires_at=now() - interval '1 hour'
       WHERE organization_id=$1`, [s.org.id]);
    await recoverStaleClaims();
    // The recovered row is dispatched normally: recovery loses no work.
    await dispatchOnce({ workerId: "w-recovery" });
    const n = await getPool().query(
      "SELECT * FROM notifications WHERE organization_id=$1 AND recipient_user_id=$2",
      [s.org.id, s.member.id]);
    assert.equal(n.rowCount, 1, "the recovered event must produce exactly one notification");
    const d = await getPool().query(
      "SELECT * FROM notification_deliveries WHERE organization_id=$1", [s.org.id]);
    assert.equal(d.rows[0].status, "delivered");
  });

  it("classifies a hung provider as a retryable timeout, not a terminal failure", async () => {
    const s = await setup();
    const { getPool } = await import("../persistence/db.js");
    const { dispatchOnce } = await import("../domain/notificationService.js");
    const { registerNotificationProvider, setChannelDefault } =
      await import("../domain/notificationProvider.js");
    await publishAssigned(s, "00000000-0000-0000-0000-000000000104", "cid-104");
    // Replace the in-app provider with one that never answers.
    registerNotificationProvider({
      name: "in_app",
      channel: "in_app",
      send: () => new Promise<never>(() => { /* never settles */ })
    });
    setChannelDefault("in_app", "in_app");
    await dispatchOnce({ workerId: "w-timeout", providerTimeoutMs: 150 });
    const d = await getPool().query(
      "SELECT * FROM notification_deliveries WHERE organization_id=$1", [s.org.id]);
    assert.equal(d.rows[0].status, "retryable_failure",
      "a provider deadline overrun must be retried, not dead-lettered");
    assert.equal(d.rows[0].last_error_code, "timeout");
  });

  it("does not double-deliver when two workers race for the same row", async () => {
    // The core safety property of the lease: two concurrent dispatchers must
    // never send the same notification twice. The provider idempotency key is
    // the delivery id, but the platform must not RELY on the provider to
    // deduplicate - the claim must be exclusive.
    const s = await setup();
    const { getPool } = await import("../persistence/db.js");
    const { dispatchOnce } = await import("../domain/notificationService.js");
    const { registerNotificationProvider, setChannelDefault } =
      await import("../domain/notificationProvider.js");

    // The provider is global and the claim query is NOT organization-scoped,
    // so the send log is tracked per delivery id and asserted for THIS
    // organization only. Otherwise a delivery left over by another test would
    // make the count flaky.
    const sends: string[] = [];
    registerNotificationProvider({
      name: "in_app",
      channel: "in_app",
      send: async (req: { deliveryId: string }) => {
        sends.push(req.deliveryId);
        // A slow provider widens the race window.
        await new Promise((r) => setTimeout(r, 60));
        return { providerMessageId: `pm-${req.deliveryId}`, accepted: true };
      }
    });
    setChannelDefault("in_app", "in_app");

    await publishAssigned(s, "00000000-0000-0000-0000-000000000105", "cid-105");

    // Two workers dispatch concurrently against the same backlog.
    await Promise.all([
      dispatchOnce({ workerId: "w-race-a" }),
      dispatchOnce({ workerId: "w-race-b" })
    ]);

    const d = await getPool().query(
      "SELECT * FROM notification_deliveries WHERE organization_id=$1", [s.org.id]);
    assert.equal(d.rows.length, 1, "exactly one delivery row must exist");
    assert.equal(d.rows[0].status, "delivered");
    const mine = sends.filter((id) => id === d.rows[0].id);
    assert.equal(mine.length, 1, "the provider must be called exactly once for this delivery");
  });

  it("stretches the lease so a slow provider call cannot be re-claimed", async () => {
    // The double-delivery hazard: if the provider call outlives the lease, a
    // second worker re-claims the row and sends the notification a second
    // time. The effective lease must therefore cover the provider deadline.
    const s = await setup();
    const { getPool } = await import("../persistence/db.js");
    const { dispatchOnce } = await import("../domain/notificationService.js");
    const { registerNotificationProvider, setChannelDefault } =
      await import("../domain/notificationProvider.js");

    const sends: string[] = [];
    registerNotificationProvider({
      name: "in_app",
      channel: "in_app",
      send: async (req: { deliveryId: string }) => {
        sends.push(req.deliveryId);
        // Deliberately LONGER than the raw requested lease (1000ms): without
        // the lease being stretched, the claim expires while this call is
        // still in flight and a second worker re-claims the row.
        await new Promise((r) => setTimeout(r, 1_500));
        return { providerMessageId: `pm-${req.deliveryId}`, accepted: true };
      }
    });
    setChannelDefault("in_app", "in_app");

    await publishAssigned(s, "00000000-0000-0000-0000-000000000106", "cid-106");

    // Worker A starts the (slow) provider call with a short requested lease.
    const a = dispatchOnce({ workerId: "w-slow-a", providerTimeoutMs: 5_000, leaseMs: 1_000 });
    // Give worker A time to claim the row and enter the provider call.
    await new Promise((r) => setTimeout(r, 150));

    // Wait past the RAW requested lease (1000ms). With an unstretched lease
    // the claim would now be expired and worker B would re-claim the row and
    // send the notification a second time.
    await new Promise((r) => setTimeout(r, 1_200));

    // Worker B tries to claim the same work while A is still calling out.
    await dispatchOnce({ workerId: "w-slow-b", providerTimeoutMs: 5_000, leaseMs: 1_000 });

    await a;

    const d = await getPool().query(
      "SELECT * FROM notification_deliveries WHERE organization_id=$1", [s.org.id]);
    assert.equal(d.rows.length, 1, "exactly one delivery row must exist");
    assert.equal(d.rows[0].status, "delivered");
    const mine = sends.filter((id) => id === d.rows[0].id);
    assert.equal(mine.length, 1,
      "the provider must be called exactly once for this delivery even though the " +
      "provider call outlived the raw lease");
  });
});
