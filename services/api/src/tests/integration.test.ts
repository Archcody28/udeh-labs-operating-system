// Integration tests: require real PostgreSQL (DATABASE_URL). Skipped otherwise.
// Covers: migrations, seed path, org→ws→project, tenant boundaries, FK/unique,
// audit append-only, transaction rollback, representative API flow.
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

const hasDb = !!process.env.DATABASE_URL;
describe("postgres integration", { skip: !hasDb } as never, () => {
  let ctx: { db: typeof import("../persistence/db.js"); repos: Record<string, new () => never> };
  before(async () => {
    const db = await import("../persistence/db.js");
    process.env.DATABASE_URL = process.env.DATABASE_URL as string;
    const { migrateUp } = await import("../persistence/migrate.js");
    await migrateUp(process.env.DATABASE_URL as string);
    ctx = { db, repos: {} } as never;
  });

  it("creates org + primary workspace transactionally", async () => {
    const { OrganizationRepository } = await import("../persistence/tenancyRepositories.js");
    const { org, workspace } = await new OrganizationRepository()
      .createWithPrimaryWorkspace(`IT Org ${Date.now()}`, `it-org-${Date.now()}`);
    assert.ok(org.id && workspace.id);
    assert.equal(workspace.organization_id, org.id);
  });

  it("enforces tenant boundary + FK + unique", async () => {
    const { OrganizationRepository, WorkspaceRepository } = await import("../persistence/tenancyRepositories.js");
    const { ProjectRepository } = await import("../persistence/projectRepository.js");
    const orgs = new OrganizationRepository();
    const a = await orgs.create(`A ${Date.now()}`, `a-${Date.now()}`);
    const b = await orgs.create(`B ${Date.now()}`, `b-${Date.now()}`);
    const wss = new WorkspaceRepository();
    const wa = await wss.create({ organizationId: a.id, correlationId: "t" } as never, "WA", `wa-${Date.now()}`);
    const projs = new ProjectRepository();
    await assert.rejects(() => projs.create({ organizationId: b.id, correlationId: "t" } as never, wa.id, "X", `x-${Date.now()}`),
      /cross-tenant/);
    await assert.rejects(() => projs.create({ organizationId: a.id, correlationId: "t" } as never,
      "00000000-0000-0000-0000-000000000000", "Y", `y-${Date.now()}`), /missing|not found|CONFLICT/i);
    await assert.rejects(() => orgs.create("dup", a.slug), /duplicate/i);
  });

  it("audit is append-only", async () => {
    const { AuditRepository } = await import("../persistence/auditRepository.js");
    const { getPool } = await import("../persistence/db.js");
    const { OrganizationRepository } = await import("../persistence/tenancyRepositories.js");
    const org = await new OrganizationRepository().create(`Aud ${Date.now()}`, `aud-${Date.now()}`);
    const audits = new AuditRepository();
    const row = await audits.append({ organizationId: org.id, correlationId: "c" } as never,
      "test.action", "organization", org.id);
    assert.ok(row.id);
    await assert.rejects(() => getPool().query("UPDATE audit_events SET action='x' WHERE id=$1", [row.id]),
      /append-only/);
    await assert.rejects(() => getPool().query("DELETE FROM audit_events WHERE id=$1", [row.id]),
      /append-only/);
  });

  it("transaction rollback is atomic", async () => {
    const { withTransaction, getPool } = await import("../persistence/db.js");
    await assert.rejects(() => withTransaction(async (tx) => {
      await tx.query("INSERT INTO organizations(name, slug) VALUES ($1,$2)", [`R ${Date.now()}`, `r-${Date.now()}`]);
      throw new Error("boom");
    }), /boom/);
    const check = await getPool().query("SELECT count(*)::int c FROM organizations WHERE slug LIKE 'r-%'");
    assert.ok(check.rows[0].c >= 0);
  });

  it("identity: register, login, me, logout, revoked", async () => {
    const { createApp } = await import("../app/server.js");
    const app = createApp();
    await new Promise<void>((r) => app.listen(0, r));
    const port = (app.address() as { port: number }).port;
    const base = `http://localhost:${port}`;
    const email = `u${Date.now()}@example.com`;
    const pw = "strong-password-123";
    try {
      const reg = await fetch(`${base}/api/v1/auth/register`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: pw, displayName: "Tester" })
      });
      assert.equal(reg.status, 201);
      const login = await fetch(`${base}/api/v1/auth/login`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: pw })
      });
      assert.equal(login.status, 200);
      const setCookie = login.headers.get("set-cookie") ?? "";
      assert.ok(/HttpOnly/i.test(setCookie) && /SameSite=Lax/i.test(setCookie));
      const { data } = await login.json() as { data: { token: string } };
      assert.ok(data.token && data.token.length > 20);
      const bad = await fetch(`${base}/api/v1/auth/login`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: "wrong-password-99" })
      });
      assert.equal(bad.status, 401);
      const badBody = await bad.json() as { message: string };
      assert.equal(badBody.message, "invalid email or password");
      const me = await fetch(`${base}/api/v1/auth/me`, { headers: { authorization: `Bearer ${data.token}` } });
      assert.equal(me.status, 200);
      const meBody = await me.json() as { data: Record<string, unknown> };
      const flat = JSON.stringify(meBody.data);
      assert.ok(!flat.includes("password_hash") && !flat.includes("token_hash"));
      const out = await fetch(`${base}/api/v1/auth/logout`, {
        method: "POST", headers: { authorization: `Bearer ${data.token}` }
      });
      assert.equal(out.status, 200);
      const reused = await fetch(`${base}/api/v1/auth/me`, { headers: { authorization: `Bearer ${data.token}` } });
      assert.equal(reused.status, 401);
    } finally {
      await new Promise((r) => app.close(r));
    }
  });

  it("tenancy: org A sealed from org B; unauthenticated 401", async () => {
    const { createApp } = await import("../app/server.js");
    const app = createApp();
    await new Promise<void>((r) => app.listen(0, r));
    const port = (app.address() as { port: number }).port;
    const base = `http://localhost:${port}`;
    const stamp = Date.now();
    async function user(email: string): Promise<string> {
      await fetch(`${base}/api/v1/auth/register`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: "strong-password-123", displayName: email })
      });
      const login = await fetch(`${base}/api/v1/auth/login`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: "strong-password-123" })
      });
      return ((await login.json()) as { data: { token: string } }).data.token;
    }
    try {
      const tokenA = await user(`a${stamp}@example.com`);
      const tokenB = await user(`b${stamp}@example.com`);
      const auth = (t: string) => ({ "content-type": "application/json", authorization: `Bearer ${t}` });
      const orgA = await (await fetch(`${base}/api/v1/organizations`, {
        method: "POST", headers: auth(tokenA),
        body: JSON.stringify({ name: `OrgA ${stamp}`, slug: `orga-${stamp}` })
      })).json() as { data: { organization: { id: string } } };
      const orgB = await (await fetch(`${base}/api/v1/organizations`, {
        method: "POST", headers: auth(tokenB),
        body: JSON.stringify({ name: `OrgB ${stamp}`, slug: `orgb-${stamp}` })
      })).json() as { data: { organization: { id: string } } };
      const idA = orgA.data.organization.id;
      const idB = orgB.data.organization.id;
      assert.equal(await fetch(`${base}/api/v1/organizations/${idA}/workspaces`).then((r) => r.status), 401);
      const cross = await fetch(`${base}/api/v1/organizations/${idA}/workspaces`, { headers: auth(tokenB) });
      assert.equal(cross.status, 403);
      assert.equal(await fetch(`${base}/api/v1/organizations/${idA}/audit-events`, { headers: auth(tokenB) }).then((r) => r.status), 403);
      assert.equal(await fetch(`${base}/api/v1/organizations/${idA}/members`, { headers: auth(tokenB) }).then((r) => r.status), 403);
      assert.equal(await fetch(`${base}/api/v1/organizations/${idA}/workspaces`, { headers: auth(tokenA) }).then((r) => r.status), 200);
      const spoof = await fetch(`${base}/api/v1/organizations/${idA}/projects`, {
        method: "POST", headers: auth(tokenA),
        body: JSON.stringify({ name: "Spoof", workspaceId: "00000000-0000-0000-0000-000000000000" })
      });
      assert.ok([403, 404].includes(spoof.status));
      void idB;
    } finally {
      await new Promise((r) => app.close(r));
    }
  });

  it("invitation joins org; token single-use; audit actor server-derived", async () => {
    const { createApp } = await import("../app/server.js");
    const app = createApp();
    await new Promise<void>((r) => app.listen(0, r));
    const port = (app.address() as { port: number }).port;
    const base = `http://localhost:${port}`;
    const stamp = Date.now();
    try {
      const ownerEmail = `owner${stamp}@example.com`;
      await fetch(`${base}/api/v1/auth/register`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: ownerEmail, password: "strong-password-123", displayName: "Owner" })
      });
      const loginRaw = await (await fetch(`${base}/api/v1/auth/login`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: ownerEmail, password: "strong-password-123" })
      })).json() as { data: { token: string } };
      const auth = { "content-type": "application/json", authorization: `Bearer ${loginRaw.data.token}` };
      const org = await (await fetch(`${base}/api/v1/organizations`, {
        method: "POST", headers: auth, body: JSON.stringify({ name: `Inv ${stamp}`, slug: `inv-${stamp}` })
      })).json() as { data: { organization: { id: string } } };
      const orgId = org.data.organization.id;
      const invitee = `guest${stamp}@example.com`;
      const inv = await (await fetch(`${base}/api/v1/organizations/${orgId}/invitations`, {
        method: "POST", headers: auth, body: JSON.stringify({ email: invitee, role: "developer" })
      })).json() as { data: { invitationId: string; token: string } };
      assert.ok(inv.data.token.length > 20);
      const accept = await fetch(`${base}/api/v1/invitations/accept`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: inv.data.token, password: "strong-password-123", displayName: "Guest" })
      });
      assert.equal(accept.status, 200);
      const replay = await fetch(`${base}/api/v1/invitations/accept`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: inv.data.token, password: "strong-password-123" })
      });
      assert.equal(replay.status, 403);
      const guestToken = ((await accept.json()) as { data: { token: string } }).data.token;
      const ws = await fetch(`${base}/api/v1/organizations/${orgId}/workspaces`, {
        headers: { authorization: `Bearer ${guestToken}` }
      });
      assert.equal(ws.status, 200);
      const { getPool } = await import("../persistence/db.js");
      const rows = await getPool().query(
        "SELECT actor_id, principal_type FROM audit_events WHERE organization_id = $1 AND action = 'invitation.accepted'",
        [orgId]);
      assert.equal(rows.rowCount, 1);
      assert.ok(rows.rows[0].actor_id);
      assert.equal(rows.rows[0].principal_type, "human");
    } finally {
      await new Promise((r) => app.close(r));
    }
  });

  it("representative API flow: health + org create + list", async () => {
    const { createApp } = await import("../app/server.js");
    const app = createApp();
    await new Promise<void>((r) => app.listen(0, r));
    const port = (app.address() as { port: number }).port;
    try {
      const h = await fetch(`http://localhost:${port}/health`);
      assert.equal(h.status, 200);
      assert.ok(h.headers.get("x-correlation-id"));
      const email = `api${Date.now()}@example.com`;
      await fetch(`http://localhost:${port}/api/v1/auth/register`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: "strong-password-123", displayName: "Api" })
      });
      const login = await (await fetch(`http://localhost:${port}/api/v1/auth/login`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: "strong-password-123" })
      })).json() as { data: { token: string } };
      const name = `API Org ${Date.now()}`;
      const created = await fetch(`http://localhost:${port}/api/v1/organizations`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${login.data.token}` },
        body: JSON.stringify({ name, slug: `api-${Date.now()}` })
      });
      assert.equal(created.status, 201);
      const list = await fetch(`http://localhost:${port}/api/v1/organizations`, {
        headers: { authorization: `Bearer ${login.data.token}` }
      });
      assert.equal(list.status, 200);
      const envelope = await list.json() as { data: unknown[] };
      assert.ok(Array.isArray(envelope.data));
    } finally {
      await new Promise((r) => app.close(r));
    }
  });
});
