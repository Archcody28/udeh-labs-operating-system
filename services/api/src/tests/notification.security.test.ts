// Phase 14 notification adversarial security tests: real HTTP + real PostgreSQL.
// Focus: recipient scoping, preference authorization, cross-tenant isolation.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app/server.js";
import { getPool } from "../persistence/db.js";

const hasDb = !!process.env.DATABASE_URL;
const SUFFIX = `${process.pid}-${Date.now().toString(36)}`;
const PW = "strong-password-123";

let base = "http://127.0.0.1:0";
let app: ReturnType<typeof createApp>;

async function api(
  path: string,
  call: { method?: string; body?: unknown; token?: string } = {}
) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (call.token) headers["authorization"] = `Bearer ${call.token}`;
  const res = await fetch(`${base}${path}`, {
    method: call.method ?? "GET",
    headers,
    body: call.body ? JSON.stringify(call.body) : undefined,
  });
  const text = await res.text();
  let json: unknown = null;
  if (text) { try { json = JSON.parse(text); } catch { json = { raw: text }; } }
  return { status: res.status, json: json as Record<string, unknown>, raw: text };
}

async function register(email: string) {
  const r = await api("/api/v1/auth/register", {
    method: "POST", body: { email, password: PW, displayName: email },
  });
  assert.equal(r.status, 201, JSON.stringify(r.json));
}
async function login(email: string): Promise<string> {
  const r = await api("/api/v1/auth/login", {
    method: "POST", body: { email, password: PW },
  });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  return (r.json.data as { token: string }).token;
}
async function elevateUser(userId: string): Promise<void> {
  const { SessionRepository } = await import("../persistence/sessionRepository.js");
  const rows = await getPool().query(
    "SELECT id FROM sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", [userId]);
  assert.ok(rows.rowCount, "expected an active session");
  await new SessionRepository().elevate(rows.rows[0].id);
}


describe("notification security", { skip: !hasDb } as never, () => {
  let ownerToken = "";
  let ownerId = "";
  let ownerOrg = "";
  let memberToken = "";
  let memberId = "";
  let foreignToken = "";
  let foreignOrg = "";

  before(async () => {
    const { migrateUp } = await import("../persistence/migrate.js");
    await migrateUp(process.env.DATABASE_URL as string);
    const { bootstrapNotificationProviders } = await import("../domain/notificationBootstrap.js");
    bootstrapNotificationProviders();
    app = createApp();
    await new Promise<void>((r) => app.listen(0, r));
    base = `http://127.0.0.1:${(app.address() as { port: number }).port}`;

    // Owner (holds notification.admin) with an org.
    await register(`nsec-owner-${SUFFIX}@example.com`);
    ownerToken = await login(`nsec-owner-${SUFFIX}@example.com`);
    const me = await api("/api/v1/auth/me", { token: ownerToken });
    ownerId = (me.json.data as { subjectId: string }).subjectId;
    const org = await api("/api/v1/organizations", {
      method: "POST", token: ownerToken,
      body: { name: `NSec ${SUFFIX}`, slug: `nsec-${SUFFIX}` },
    });
    assert.equal(org.status, 201, JSON.stringify(org.json));
    ownerOrg = (org.json.data as { organization: { id: string } }).organization.id;
    await elevateUser(ownerId);

    // A plain member (developer) of the same org: has preferences.manage but
    // NOT notification.admin.
    await register(`nsec-member-${SUFFIX}@example.com`);
    memberToken = await login(`nsec-member-${SUFFIX}@example.com`);
    const meM = await api("/api/v1/auth/me", { token: memberToken });
    memberId = (meM.json.data as { subjectId: string }).subjectId;
    const { MembershipRepository } = await import("../persistence/membershipRepository.js");
    await new MembershipRepository().upsertActive(
      { organizationId: ownerOrg, correlationId: "t" } as never, memberId, "developer");
    await elevateUser(memberId);

    // A user in a completely different organization.
    await register(`nsec-foreign-${SUFFIX}@example.com`);
    foreignToken = await login(`nsec-foreign-${SUFFIX}@example.com`);
    const orgF = await api("/api/v1/organizations", {
      method: "POST", token: foreignToken,
      body: { name: `NSecF ${SUFFIX}`, slug: `nsecf-${SUFFIX}` },
    });
    foreignOrg = (orgF.json.data as { organization: { id: string } }).organization.id;
  });

  after(async () => { await new Promise((r) => app.close(r)); });


  it("a member may read and write their OWN preferences", async () => {
    const put = await api(`/api/v1/organizations/${ownerOrg}/notification-preferences`, {
      method: "PUT", token: memberToken,
      body: { notificationType: "task.assigned", channel: "in_app", enabled: false },
    });
    assert.equal(put.status, 200, JSON.stringify(put.json));
    const own = await api(`/api/v1/organizations/${ownerOrg}/notification-preferences`, {
      token: memberToken,
    });
    assert.equal(own.status, 200, JSON.stringify(own.json));
    const rows = own.json.data as { notification_type: string; enabled: boolean }[];
    assert.equal(rows.length, 1);
    assert.equal(rows[0].notification_type, "task.assigned");
    assert.equal(rows[0].enabled, false);
  });

  it("a member CANNOT read another member's preferences without notification.admin", async () => {
    const res = await api(
      `/api/v1/organizations/${ownerOrg}/notification-preferences?userId=${ownerId}`,
      { token: memberToken }
    );
    assert.equal(res.status, 403, `expected 403, got ${res.status}: ${res.raw}`);
  });

  it("notification.admin (owner) CAN read another member's preferences", async () => {
    const res = await api(
      `/api/v1/organizations/${ownerOrg}/notification-preferences?userId=${memberId}`,
      { token: ownerToken }
    );
    assert.equal(res.status, 200, JSON.stringify(res.json));
  });

  it("a member cannot write another member's preferences", async () => {
    // The PUT endpoint always targets the authenticated subject, so a forged
    // userId in the body must not redirect the write.
    const res = await api(`/api/v1/organizations/${ownerOrg}/notification-preferences`, {
      method: "PUT", token: memberToken,
      body: { notificationType: "billing.payment.failed", channel: "in_app", enabled: true, userId: ownerId },
    });
    assert.equal(res.status, 200, JSON.stringify(res.json));
    const ownerPrefs = await getPool().query(
      "SELECT * FROM notification_preferences WHERE organization_id=$1 AND user_id=$2",
      [ownerOrg, ownerId]);
    assert.equal(ownerPrefs.rowCount, 0,
      "a forged userId must not write another member's preferences");
  });

  it("cross-tenant reads are rejected", async () => {
    // A foreign user cannot read notifications of the owner's org.
    const list = await api(`/api/v1/organizations/${ownerOrg}/notifications`, {
      token: foreignToken,
    });
    assert.equal(list.status, 403, `expected 403, got ${list.status}: ${list.raw}`);
    // A foreign user cannot read the owner's preferences either.
    const prefs = await api(
      `/api/v1/organizations/${ownerOrg}/notification-preferences?userId=${ownerId}`,
      { token: foreignToken });
    assert.equal(prefs.status, 403, `expected 403, got ${prefs.status}: ${prefs.raw}`);
  });

  it("a member cannot mark another member's notification read", async () => {
    // A notification must reference a real domain event (FK), so publish one
    // through the transactional outbox and let the dispatcher materialise it.
    const { publishDomainEvent } = await import("../domain/domainEvents.js");
    const { withTransaction } = await import("../persistence/db.js");
    const { dispatchOnce } = await import("../domain/notificationService.js");
    await withTransaction(async (tx) => publishDomainEvent(tx, {
      organizationId: ownerOrg, projectId: null, eventType: "comment.mentioned",
      aggregateType: "comment",
      aggregateId: "00000000-0000-0000-0000-0000000000a1",
      actorUserId: ownerId, principalType: "human",
      payload: {
        commentId: "00000000-0000-0000-0000-0000000000a1",
        targetType: "project", targetId: "00000000-0000-0000-0000-0000000000a2",
        mentionedUserIds: [memberId], excerpt: "hi",
      },
      correlationId: "nsec-notif",
    }));
    await dispatchOnce({ workerId: "w-nsec" });
    const notif = await getPool().query(
      "SELECT id FROM notifications WHERE organization_id=$1 AND recipient_user_id=$2",
      [ownerOrg, memberId]);
    assert.equal(notif.rowCount, 1, "expected a notification for the member");
    const id = notif.rows[0].id as string;
    const asOwner = await api(`/api/v1/organizations/${ownerOrg}/notifications/${id}/read`, {
      method: "POST", token: ownerToken,
    });
    assert.equal(asOwner.status, 403, `expected 403, got ${asOwner.status}: ${asOwner.raw}`);
    // The rightful recipient may mark it read.
    const asMember = await api(`/api/v1/organizations/${ownerOrg}/notifications/${id}/read`, {
      method: "POST", token: memberToken,
    });
    assert.equal(asMember.status, 200, JSON.stringify(asMember.json));
  });

  it("unauthenticated notification access is rejected", async () => {
    const res = await api(`/api/v1/organizations/${ownerOrg}/notifications`);
    assert.equal(res.status, 401, `expected 401, got ${res.status}: ${res.raw}`);
  });
});
