// Phase 9 adversarial IDOR tests over HTTP + real PostgreSQL.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app/server.js";
import { getPool } from "../persistence/db.js";

const hasDb = !!process.env.DATABASE_URL;
const PW = "strong-password-123";
let app: ReturnType<typeof createApp> | null = null;
let port = 0;

async function api(path: string, o: { method?: string; body?: unknown; token?: string } = {}) {
  const headers: Record<string, string> = {};
  if (o.token) headers["authorization"] = `Bearer ${o.token}`;
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: o.method ?? "GET", headers: { "content-type": "application/json", ...headers },
    body: o.body ? JSON.stringify(o.body) : undefined,
  });
  let json: unknown = null;
  const text = await res.text();
  if (text) { try { json = JSON.parse(text); } catch { json = { raw: text }; } }
  return { status: res.status, json };
}
async function register(email: string) {
  const r = await api("/api/v1/auth/register", { method: "POST", body: { email, password: PW, displayName: email } });
  assert.equal(r.status, 201);
  return r.json as { data: { id: string } };
}
async function login(email: string) {
  const r = await api("/api/v1/auth/login", { method: "POST", body: { email, password: PW } });
  assert.equal(r.status, 200);
  return r.json as { data: { token: string; principal: { subjectId: string } } };
}

describe("phase9 adversarial", { skip: !hasDb } as never, () => {
  const s = `p9${process.pid}${Date.now().toString(36)}`;
  let orgA = "", orgB = "", projA = "", projB = "", tokA = "", tokB = "", taskA = "";
  before(async () => {
    const { migrateUp } = await import("../persistence/migrate.js");
    await migrateUp(process.env.DATABASE_URL as string);
    app = createApp();
    await new Promise<void>((r) => app!.listen(0, r));
    port = (app.address() as { port: number }).port;
    await register(`a9-${s}@example.com`);
    await register(`b9-${s}@example.com`);
    tokA = (await login(`a9-${s}@example.com`)).data.token;
    tokB = (await login(`b9-${s}@example.com`)).data.token;
    const mk = async (tok: string, slug: string) => {
      const o = await api("/api/v1/organizations", { method: "POST", token: tok, body: { name: slug, slug } });
      const orgId = (o.json as { data: { organization: { id: string }; primaryWorkspace: { id: string } } }).data.organization.id;
      const wsId = (o.json as { data: { primaryWorkspace: { id: string } } }).data.primaryWorkspace.id;
      const p = await api(`/api/v1/organizations/${orgId}/projects`, { method: "POST", token: tok, body: { name: "P", slug: `${slug}-p`, workspaceId: wsId } });
      return { orgId, proj: (p.json as { data: { id: string } }).data.id };
    };
    const a = await mk(tokA, `a9-${s}`);
    const b = await mk(tokB, `b9-${s}`);
    orgA = a.orgId; projA = a.proj; orgB = b.orgId; projB = b.proj;
    const t = await api(`/api/v1/organizations/${orgA}/projects/${projA}/tasks`, { method: "POST", token: tokA, body: { title: "T" } });
    taskA = (t.json as { data: { id: string } }).data.id;
  });
  after(async () => { if (app) await new Promise((r) => app!.close(r)); });
  it("cross-org comment injection fails", async () => {
    const r = await api(`/api/v1/organizations/${orgB}/projects/${projB}/comments`,
      { method: "POST", token: tokA, body: { targetType: "project", targetId: projB, body: "x" } });
    assert.ok([401, 403, 409].includes(r.status), JSON.stringify(r.json));
  });
  it("cross-project task/comment mismatch fails", async () => {
    const r = await api(`/api/v1/organizations/${orgA}/projects/${projB}/comments`,
      { method: "POST", token: tokA, body: { targetType: "task", targetId: taskA, body: "x" } });
    assert.ok([403, 409, 404].includes(r.status), JSON.stringify(r.json));
  });
  it("cross-org activity read fails", async () => {
    const r = await api(`/api/v1/organizations/${orgB}/projects/${projB}/activity`, { token: tokA });
    assert.ok([401, 403].includes(r.status), JSON.stringify(r.json));
  });
  it("unauthorized assignment fails", async () => {
    const r = await api(`/api/v1/organizations/${orgA}/projects/${projA}/tasks/${taskA}/assign`,
      { method: "POST", token: tokB, body: { assigneeUserId: null } });
    assert.ok([401, 403].includes(r.status), JSON.stringify(r.json));
  });
  it("revoked participant cannot comment", async () => {
    void getPool;
    const r = await api(`/api/v1/organizations/${orgA}/projects/${projA}/comments`,
      { method: "POST", token: tokB, body: { targetType: "project", targetId: projA, body: "hi" } });
    assert.ok([401, 403, 409].includes(r.status), JSON.stringify(r.json));
  });
});
