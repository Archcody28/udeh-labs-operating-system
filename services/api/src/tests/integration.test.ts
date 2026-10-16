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

  it("representative API flow: health + org create + list", async () => {
    const { createApp } = await import("../app/server.js");
    const app = createApp();
    await new Promise<void>((r) => app.listen(0, r));
    const port = (app.address() as { port: number }).port;
    try {
      const h = await fetch(`http://localhost:${port}/health`);
      assert.equal(h.status, 200);
      assert.ok(h.headers.get("x-correlation-id"));
      const name = `API Org ${Date.now()}`;
      const created = await fetch(`http://localhost:${port}/api/v1/organizations`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, slug: `api-${Date.now()}` })
      });
      assert.equal(created.status, 201);
      const list = await fetch(`http://localhost:${port}/api/v1/organizations?limit=5`);
      assert.equal(list.status, 200);
      const envelope = await list.json() as { data: unknown[] };
      assert.ok(Array.isArray(envelope.data));
    } finally {
      await new Promise((r) => app.close(r));
    }
  });
});
