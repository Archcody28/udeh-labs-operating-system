// Adversarial security tests for Phase 7 tenant isolation and authorization.
//
// These tests attack the authorization chain end-to-end over a real HTTP
// server against a real PostgreSQL instance: cross-tenant isolation,
// permission frontiers, step-up guarantees, project grants, audit integrity.
// Requests that achieve an effect outside the caller's tenant fail the test.
// Requires a real PostgreSQL (DATABASE_URL) and a running server. Skipped
// when DATABASE_URL is not set. Pure policy assertions live in the "policy"
// describe below.

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app/server.js";
import { getPool } from "../persistence/db.js";
import { SessionRepository } from "../persistence/sessionRepository.js";
import { ProjectRepository } from "../persistence/projectRepository.js";
import {
  requiresStepUp,
  requirePermission,
  requireAssurance,
  permissionsFor,
  canInOrg,
  canOnProject,
  normalizeRole,
} from "../domain/authorization.js";

import { AppError } from "../domain/errors.js";

const hasDb = !!process.env.DATABASE_URL;
const SUFFIX = `${process.pid}-${Date.now().toString(36)}`;
const ALT_PASSWORD = "strong-password-123"; // allowlisted non-secret fixture

// HTTP helpers (mirror the representative flows in integration.test.ts)
async function api(path: string, call: { method?: string; body?: unknown; token?: string } = {}) {
  const headers: Record<string, string> = {};
  if (call.token) headers["authorization"] = `Bearer ${call.token}`;
  const res = await fetch(`${base}${path}`, {
    method: call.method ?? "GET",
    headers: { "content-type": "application/json", ...headers },
    body: call.body ? JSON.stringify(call.body) : undefined,
  });
  let json: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
  }
  return { status: res.status, json };
}

let base = "http://127.0.0.1:0";

async function register(email: string) {
  const { status, json } = await api("/api/v1/auth/register", {
    method: "POST",
    body: { email, password: ALT_PASSWORD, displayName: email },
  });
  assert.equal(status, 201, `register ${email}: ${JSON.stringify(json)}`);
  return json as { data: { id: string; email: string } };
}

async function login(email: string) {
  const { status, json } = await api("/api/v1/auth/login", {
    method: "POST",
    body: { email, password: ALT_PASSWORD },
  });
  assert.equal(status, 200, `login ${email}: ${JSON.stringify(json)}`);
  return json as { data: { token: string; sessionId: string; principal: { subjectId: string } } };
}

async function createOrg(token: string, name: string, slug: string) {
  const { status, json } = await api("/api/v1/organizations", {
    method: "POST",
    token,
    body: { name, slug },
  });
  assert.equal(status, 201, `create org ${slug}: ${JSON.stringify(json)}`);
  return json as { data: { organization: { id: string }; primaryWorkspace: { id: string } } };
}

async function inviteAndAccept(orgId: string, token: string, email: string, role: string) {
  const { status: invStatus, json: invBody } = await api(`/api/v1/organizations/${orgId}/invitations`, {
    method: "POST",
    token,
    body: { email, role },
  });
  assert.equal(invStatus, 201, `invite ${email}: ${JSON.stringify(invBody)}`);
  const tokenHash = (invBody as { data: { token: string } }).data!.token;
  const { status, json } = await api("/api/v1/invitations/accept", {
    method: "POST",
    body: { token: tokenHash, password: ALT_PASSWORD, displayName: email },
  });
  assert.equal(status, 200, `accept invite ${email}: ${JSON.stringify(json)}`);
  return json as { data: { token: string; sessionId: string; principal: { subjectId: string } } };
}

async function memberRows(orgId: string, token: string) {
  const { status, json } = await api(`/api/v1/organizations/${orgId}/members`, { token, method: "GET" });
  assert.equal(status, 200, `members ${orgId}: ${JSON.stringify(json)}`);
  return json as { data: Array<{ userId: string; role: string; status: string }> };
}

let app: ReturnType<typeof createApp>;
let aliceToken = "";
let bobToken = "";
let carolToken = "";
let aliceOrgId = "";
let bobOrgId = "";
let carolUserId = "";
let wsAId = "";
let wsBId = "";
let pAId = "";
let pBId = "";
let aliceSessionId = "";

before(async () => {
  if (!hasDb) return;
  const { migrateUp } = await import("../persistence/migrate.js");
  await migrateUp(process.env.DATABASE_URL as string);

  app = createApp();
  await new Promise<void>((resolve) => {
    app.listen(0, "127.0.0.1", resolve);
  });
  base = `http://127.0.0.1:${(app.address() as { port: number }).port}`;

  // Alice and Bob each own an organization; they can never see each other's data.
  const alice = await register(`alice${SUFFIX}@example.com`);
  aliceToken = (await login(alice.data.email)).data.token;
  const a = await createOrg(aliceToken, `A Org ${SUFFIX}`, `a-${SUFFIX}`);
  aliceOrgId = a.data.organization.id;
  wsAId = a.data.primaryWorkspace.id;

  const bob = await register(`bob${SUFFIX}@example.com`);
  bobToken = (await login(bob.data.email)).data.token;
  const b = await createOrg(bobToken, `B Org ${SUFFIX}`, `b-${SUFFIX}`);
  bobOrgId = b.data.organization.id;
  wsBId = b.data.primaryWorkspace.id;

  // Carol is invited into A as a developer (the permission frontier).
  const carol = await register(`carol${SUFFIX}@example.com`);
  const carolLogin = await login(carol.data.email);
  carolUserId = carolLogin.data.principal.subjectId;
  const invite = await api(`/api/v1/organizations/${aliceOrgId}/invitations`, {
    method: "POST",
    token: aliceToken,
    body: { email: carol.data.email, role: "developer" },
  });
  assert.equal(invite.status, 201);
  const accepted = await api("/api/v1/invitations/accept", {
    method: "POST",
    body: { token: (invite.json as { data: { token: string } }).data.token, password: ALT_PASSWORD, displayName: "Carol" },
  });
  assert.equal(accepted.status, 200);
  carolToken = (accepted.json as { data: { token: string } }).data.token;

  // Cross-tenant projects created from each org.
  const { getPool } = await import("../persistence/db.js");
  const rowsA = await getPool().query("SELECT id FROM projects WHERE organization_id = $1 LIMIT 1", [aliceOrgId]);
  if (rowsA.rowCount) pAId = rowsA.rows[0].id;
  const rowsB = await getPool().query("SELECT id FROM projects WHERE organization_id = $1 LIMIT 1", [bobOrgId]);
  if (rowsB.rowCount) pBId = rowsB.rows[0].id;
});

after(async () => {
  if (app) await new Promise<void>((resolve) => {
    app.close(() => resolve());
  });
});

// ---------------------------------------------------------------------------
// Policy-only group: no database, never skipped
// ---------------------------------------------------------------------------

describe("policy", () => {
  it("step-up frontier is exclusive to high-risk actions", () => {
    const steppedUp = [
      "organization.update", "member.update", "member.remove", "workspace.archive",
      "project.archive", "deployment.create", "deployment.trigger", "agent.run",
      "agent.approve", "commercial.approve",
    ];
    for (const action of steppedUp) assert.equal(requiresStepUp(action), true, action);
    for (const action of ["member.read", "workspace.read", "project.read", "audit.read", "invitation.accept", "organization.read"]) {
      assert.equal(requiresStepUp(action), false, action);
    }
  });

  it("step-up is enforced on top of role permissions", () => {
    const owner = {
      kind: "human" as const,
      subjectId: "u1",
      assurance: "password" as const,
      memberships: [{ organizationId: "o1", role: "owner", status: "active" as const }],
      correlationId: "c",
    };
    assert.doesNotThrow(() => requirePermission(owner, "o1", "member.read"));
    assert.throws(() => requireAssurance(owner, "member.update"), (e: unknown) => (e as AppError).httpStatus === 403);
    assert.doesNotThrow(() => requireAssurance({ ...owner, assurance: "stepped-up" }, "member.update"));
  });

  it("legacy aliases resolve to canonical permissions", () => {
    assert.ok(permissionsFor("owner").includes("org.manage"));
    assert.ok(permissionsFor("owner").includes("member.manage"));
    assert.ok(!permissionsFor("developer").includes("member.manage"));
    const mk = (role: string) => ({ kind: "human" as const, subjectId: "u1", assurance: "password" as const, memberships: [{ organizationId: "o1", role, status: "active" as const }], correlationId: "c" });
    assert.equal(canInOrg(mk("owner"), "o1", "member.manage"), true);
    assert.equal(canInOrg(mk("developer"), "o1", "member.manage"), false);
  });

  it("canonicalize rejects unknown permissions", () => {
    assert.throws(() => normalizeRole("superuser"), (e: unknown) => e instanceof AppError);
  });

  it("role lattices are monotonic (owner holds everything, client holds little)", () => {
    const owner = permissionsFor("owner");
    const client = permissionsFor("client");
    assert.ok(owner.includes("workspace.read"));
    assert.ok(!client.includes("member.update"));
    assert.ok(!client.includes("workspace.create"));
    assert.ok(!client.includes("audit.read"));
  });

  it("cross-org membership does not authorize (canInOrg)", () => {
    const owner = {
      kind: "human" as const,
      subjectId: "u1",
      assurance: "password" as const,
      memberships: [{ organizationId: "o1", role: "owner", status: "active" as const }],
      correlationId: "c",
    };
    assert.equal(canInOrg(owner, "o1", "organization.read"), true);
    assert.equal(canInOrg(owner, "other-org", "organization.read"), false);
  });

  it("project grants refine permissions only for active members", () => {
    const outsider = {
      kind: "human" as const,
      subjectId: "u9",
      assurance: "password" as const,
      memberships: [],
      correlationId: "c",
    };
    const member = {
      kind: "human" as const,
      subjectId: "u1",
      assurance: "password" as const,
      memberships: [{ organizationId: "o1", role: "client", status: "active" as const }],
      correlationId: "c",
    };
    assert.equal(canOnProject(outsider, "o1", "engineering.task.read", []), false);
    assert.equal(canOnProject(member, "o1", "engineering.task.read", []), false);
    const grant = { organizationId: "o1", status: "active", permission: "engineering.task.read" };
    assert.equal(canOnProject(member, "o1", "engineering.task.read", [grant]), true);
    assert.equal(canOnProject(outsider, "o1", "engineering.task.read", [grant]), false);
  });
});

// ---------------------------------------------------------------------------
// PostgreSQL group: skipped when DATABASE_URL is not set
// ---------------------------------------------------------------------------

describe("postgres integration", { skip: !hasDb } as never, () => {
  // --- authentication & session lifecycle ---

  it("auth lifecycle: register, login, me, rotate, logout", async () => {
    const alice = await register(`alice${SUFFIX}@example.com`);
    const { data } = await login(alice.data.email);
    assert.ok(data.principal.subjectId);
    const me = await api("/api/v1/auth/me", { token: data.token });
    assert.equal(me.status, 200);
    assert.equal((me.json as { data: { subjectId: string } }).data.subjectId, data.principal.subjectId);

    const rotated = await api("/api/v1/auth/rotate", { token: data.token, method: "POST" });
    assert.equal(rotated.status, 200);
    const old = await api("/api/v1/auth/me", { token: data.token });
    assert.equal(old.status, 401);
    const fresh = await api("/api/v1/auth/me", {
      token: (rotated.json as { data: { token: string } }).data.token,
    });
    assert.equal(fresh.status, 200);

    const loggedOut = await api("/api/v1/auth/logout", {
      token: (rotated.json as { data: { token: string } }).data.token,
      method: "POST",
    });
    assert.equal(loggedOut.status, 200);
    const after = await api("/api/v1/auth/me", { token: (rotated.json as { data: { token: string } }).data.token });
    assert.equal(after.status, 401);
  });

  it("anonymous traffic gets 401 on every org-scoped route", async () => {
    const paths = [
      "/api/v1/organizations",
      "/api/v1/organizations/not-here/workspaces",
      "/api/v1/organizations/not-here/members",
      "/api/v1/organizations/not-here/invitations",
      "/api/v1/organizations/not-here/audit-events",
    ];
    for (const p of paths) {
      const res = await api(p);
      assert.equal(res.status, 401, `anonymous ${p}`);
    }
  });

  // --- tenant boundary ------------------------------------------------------

  it("tenant boundary: non-members are excluded from org routes", async () => {
    const cases: Array<[string, string]> = [
      ["/workspaces", "workspace.read (resolved from membership)"],
      ["/members", "member.read"],
      ["/audit-events", "audit.read"],
      ["/invitations", "invitation.create"],
      ["/invitations", "invitation.create (POST)"],
    ];
    for (const [path, what] of cases) {
      const res = await api(`/api/v1/organizations/${bobOrgId}${path}`, {
        token: aliceToken,
        method: path.startsWith("/invitations") ? "POST" : "GET",
      });
      assert.equal(res.status, 403, `alice (${what}) on bob's org ${path}`);
    }

    // Ownership of membership records is itself org-scoped.
    const suspend = await api(`/api/v1/organizations/${aliceOrgId}/members/${carolUserId}`, {
      token: bobToken,
      method: "PATCH",
      body: { status: "suspended" },
    });
    assert.equal(suspend.status, 403);

    // A member of A cannot create resources in B.
    const wsInB = await api(`/api/v1/organizations/${bobOrgId}/workspaces`, {
      token: aliceToken,
      method: "POST",
      body: { name: `evil-ws ${SUFFIX}` },
    });
    assert.equal(wsInB.status, 403);
  });

  // --- cross-tenant isolation at the persistence layer ----------------------

  it("cross-tenant project creation rejected at the repository (org boundary)", async () => {
    const repos = new ProjectRepository();
    await assert.rejects(
      () => repos.create({ organizationId: aliceOrgId, correlationId: "t" } as never, wsBId, `x ${SUFFIX}`, `x-${SUFFIX}`),
      /cross-tenant/
    );
    await assert.rejects(
      () => repos.create({ organizationId: bobOrgId, correlationId: "t" } as never, wsAId, `y ${SUFFIX}`, `y-${SUFFIX}`),
      /cross-tenant/
    );
  });

  // --- permission frontier --------------------------------------------------

  it("project creation: owner allowed, members and clients denied", async () => {
    const owner = await api(`/api/v1/organizations/${aliceOrgId}/projects`, {
      method: "POST",
      token: aliceToken,
      body: { name: `Main ${SUFFIX}`, workspaceId: wsAId },
    });
    assert.equal(owner.status, 201);

    const carol = await api(`/api/v1/organizations/${aliceOrgId}/projects`, {
      method: "POST",
      token: carolToken,
      body: { name: `Bad ${SUFFIX}`, workspaceId: wsAId },
    });
    assert.equal(carol.status, 403);

    const bob = await api(`/api/v1/organizations/${aliceOrgId}/projects`, {
      method: "POST",
      token: bobToken,
      body: { name: `Bad2 ${SUFFIX}`, workspaceId: wsAId },
    });
    assert.equal(bob.status, 403);
  });

  it("invitation creation: owner allowed, members and clients denied", async () => {
    const owner = await api(`/api/v1/organizations/${aliceOrgId}/invitations`, {
      method: "POST",
      token: aliceToken,
      body: { email: `invitee${SUFFIX}@example.com`, role: "developer" },
    });
    assert.equal(owner.status, 201);

    const carol = await api(`/api/v1/organizations/${aliceOrgId}/invitations`, {
      method: "POST",
      token: carolToken,
      body: { email: `invitee2${SUFFIX}@example.com`, role: "developer" },
    });
    assert.equal(carol.status, 403);

    const bob = await api(`/api/v1/organizations/${aliceOrgId}/invitations`, {
      method: "POST",
      token: bobToken,
      body: { email: `invitee3${SUFFIX}@example.com`, role: "developer" },
    });
    assert.equal(bob.status, 403);
  });

  // --- step-up assurance ----------------------------------------------------
  // Owner holds member.update but must prove stepped-up assurance before
  // mutating another member's status.

  it("step-up: no stepped-up assurance -> 403 on sensitive membership mutations", async () => {
    const suspend = await api(`/api/v1/organizations/${aliceOrgId}/members/${carolUserId}`, {
      token: aliceToken,
      method: "PATCH",
      body: { status: "suspended" },
    });
    assert.equal(suspend.status, 403, `suspend without step-up: ${JSON.stringify(suspend.json)}`);

    // A developer cannot escalate another member either.
    const dev = await api(`/api/v1/organizations/${aliceOrgId}/members/${carolUserId}`, {
      token: carolToken,
      method: "PATCH",
      body: { status: "suspended" },
    });
    assert.equal(dev.status, 403, `developer attempt: ${JSON.stringify(dev.json)}`);
  });

  it("step-up: stepped-up assurance enables sensitive membership mutation", async () => {
    const rows = await getPool().query("SELECT id FROM sessions WHERE user_id = $1", [carolUserId]);
    assert.ok(rows.rowCount, "expected an active carol session");
    aliceSessionId = rows.rows[0].id;
    await new SessionRepository().elevate(aliceSessionId);

    const res = await api(`/api/v1/organizations/${aliceOrgId}/members/${carolUserId}`, {
      token: aliceToken,
      method: "PATCH",
      body: { status: "suspended" },
    });
    assert.equal(res.status, 200, `suspended: ${JSON.stringify(res.json)}`);
  });

  // --- project grants -------------------------------------------------------
  // Grants require member.update (with step-up) and an active membership of
  // the grantee; the database enforces the organization boundary.

  it("grant lifecycle: non-member grantee is rejected", async () => {
    const eve = await register(`eve${SUFFIX}@example.com`);
    await login(eve.data.email); // never a member of A
    const res = await api(`/api/v1/organizations/${aliceOrgId}/projects/${pAId}/grants`, {
      method: "POST",
      token: aliceToken,
      body: { userId: eve.data.id, permission: "engineering.task.read" },
    });
    assert.equal(res.status, 409, `grant to non-member: ${JSON.stringify(res.json)}`);
  });

  it("grant lifecycle: owner can grant to active members, revoke removes it", async () => {
    const rows = await memberRows(aliceOrgId, aliceToken);
    const target = rows.data.find((m) => m.userId !== carolUserId) ?? rows.data[0];
    assert.ok(target, "expected a target member (any active member)");

    const grant = await api(`/api/v1/organizations/${aliceOrgId}/projects/${pAId}/grants`, {
      method: "POST",
      token: aliceToken,
      body: { userId: target.userId, permission: "engineering.task.read" },
    });
    assert.equal(grant.status, 201, `grant: ${JSON.stringify(grant.json)}`);
    assert.equal((grant.json as { data: { user_id: string } }).data.user_id, target.userId);

    const revoke = await api(`/api/v1/organizations/${aliceOrgId}/projects/${pAId}/grants`, {
      method: "DELETE",
      token: aliceToken,
      body: { userId: target.userId, permission: "engineering.task.read" },
    });
    assert.equal(revoke.status, 200);

    const replay = await api(`/api/v1/organizations/${aliceOrgId}/projects/${pAId}/grants`, {
      method: "DELETE",
      token: aliceToken,
      body: { userId: target.userId, permission: "engineering.task.read" },
    });
    assert.equal(replay.status, 404, `double revoke: ${JSON.stringify(replay.json)}`);
  });

  it("grant lifecycle: organization boundary enforced by the database", async () => {
    const grace = await register(`grace${SUFFIX}@example.com`);
    await login(grace.data.email);
    const res = await api(`/api/v1/organizations/${aliceOrgId}/projects/${pAId}/grants`, {
      method: "POST",
      token: aliceToken,
      body: { userId: grace.data.id, permission: "engineering.task.read" },
    });
    // Grace has no membership in A -> the grant must be refused (409).
    assert.equal(res.status, 409, `cross-org grant: ${JSON.stringify(res.json)}`);
  });

  it("audit trail: grant and revoke events are recorded", async () => {
    const rows = await getPool().query(
      "SELECT id, actor_id FROM audit_events WHERE organization_id = $1 AND action = 'project.grant.created' ORDER BY id DESC LIMIT 1",
      [aliceOrgId],
    );
    assert.ok(rows.rowCount, "project.grant.created event");
    assert.equal(rows.rows[0].actor_id, carolUserId, "grant attributed to the acting principal");

    const rev = await getPool().query(
      "SELECT action FROM audit_events WHERE organization_id = $1 AND action IN ('project.grant.created','project.grant.revoked') ORDER BY id DESC LIMIT 2",
      [aliceOrgId],
    );
    assert.ok(rev.rowCount !== null && rev.rowCount >= 2, "grant plus revoke events recorded");
  });

  // --- lifecycle transitions -------------------------------------------------

  it("workspace archive: final transition, only once", async () => {
    const first = await api(`/api/v1/organizations/${aliceOrgId}/workspaces/${wsAId}`, {
      method: "PATCH",
      token: aliceToken,
      body: { status: "archived", version: 1 },
    });
    assert.equal(first.status, 200);

    const second = await api(`/api/v1/organizations/${aliceOrgId}/workspaces/${wsAId}`, {
      method: "PATCH",
      token: aliceToken,
      body: { status: "archived", version: 1 },
    });
    assert.equal(second.status, 422, `second archive: ${JSON.stringify((await second).json)}`);
  });

  it("invitation accept: replay is rejected", async () => {
    const invite = await api(`/api/v1/organizations/${aliceOrgId}/invitations`, {
      method: "POST",
      token: aliceToken,
      body: { email: `replay${SUFFIX}@example.com`, role: "developer" },
    });
    assert.equal(invite.status, 201);
    const accept = await api("/api/v1/invitations/accept", {
      method: "POST",
      body: {
        token: (invite.json as { data: { token: string } }).data.token,
        password: ALT_PASSWORD,
        displayName: "Replay",
      },
    });
    assert.equal(accept.status, 200, `first accept: ${JSON.stringify(accept.json)}`);
    const replay = await api("/api/v1/invitations/accept", {
      method: "POST",
      body: {
        token: (invite.json as { data: { token: string } }).data.token,
        password: ALT_PASSWORD,
      },
    });
    assert.equal(replay.status, 403, `replay: ${JSON.stringify(replay.json)}`);
  });

  // --- audit integrity -------------------------------------------------------
  // The audit log is append-only at the database layer; neither update nor
  // delete may succeed.

  it("audit events are append-only", async () => {
    const rows = await getPool().query(
      "SELECT id FROM audit_events WHERE organization_id = $1 ORDER BY id DESC LIMIT 1", [aliceOrgId]);
    assert.ok(rows.rowCount, "audit rows present");
    await assert.rejects(
      () => getPool().query("UPDATE audit_events SET action = 'x' WHERE id = $1", [rows.rows[0].id]),
      /append-only/
    );
    await assert.rejects(
      () => getPool().query("DELETE FROM audit_events WHERE id = $1", [rows.rows[0].id]),
      /append-only/
    );
  });
});
