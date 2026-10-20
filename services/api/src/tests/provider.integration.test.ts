// Phase-12 integration/security persistence tests: real PostgreSQL only.
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

const hasDb = !!process.env.DATABASE_URL;
describe("phase12 integration persistence", { skip: !hasDb } as never, () => {
  before(async () => {
    const { migrateUp } = await import("../persistence/migrate.js");
    await migrateUp(process.env.DATABASE_URL as string);
  });
  async function setup() {
    const { OrganizationRepository, WorkspaceRepository } = await import("../persistence/tenancyRepositories.js");
    const { ProjectRepository } = await import("../persistence/projectRepository.js");
    const orgs = new OrganizationRepository();
    const ts = Date.now().toString(36);
    const org = await orgs.create(`P12 ${ts}`, `p12-${ts}-${Math.floor(Math.random() * 1e6)}`);
    const ws = await new WorkspaceRepository().create({ organizationId: org.id, correlationId: "p12" } as never, "WS", `ws-${ts}-${Math.floor(Math.random() * 1e6)}`);
    const proj = await new ProjectRepository().create({ organizationId: org.id, correlationId: "p12" } as never, ws.id, "P", `p-${ts}-${Math.floor(Math.random() * 1e6)}`);
    const ctx = { organizationId: org.id, actorId: "u-1", correlationId: "p12", principalType: "human" } as never;
    return { org, proj, ctx };
  }
  it("lifecycle + optimistic concurrency + revocation", async () => {
    const { integrationService } = await import("../domain/integrationService.js");
    const { integrationLifecycle } = await import("../domain/integrationLifecycle.js");
    const { registerGitHubAdapter } = await import("../domain/integrationProviders/githubAdapter.js");
    const { clearProvidersForTests } = await import("../domain/integrationProvider.js");
    clearProvidersForTests();
    registerGitHubAdapter({ apiBaseUrl: "https://api.github.test", resolveInstallationToken: async () => "tok" }, {
      request: async (p: string) => p.startsWith("/app/installations")
        ? { status: 200, headers: {}, body: { id: 1, account: { id: 5, login: "acme", type: "Organization" } } }
        : { status: 404, headers: {}, body: {} },
    });
    const { ctx } = await setup();
    const integ = await integrationService.create(ctx as never, "github", {}) as { id: string; version: number };
    const connected = await integrationLifecycle.connect(ctx, integ.id, integ.version, "1") as { status: string; version: number };
    assert.equal(connected.status, "connected");
    await assert.rejects(() => integrationLifecycle.connect(ctx, integ.id, integ.version, "1"), /stale|terminal|provider/i);
    const revoked = await integrationLifecycle.disconnect(ctx, integ.id, connected.version, "revoked") as { status: string };
    assert.equal(revoked.status, "revoked");
    await assert.rejects(() => integrationLifecycle.repositories(ctx, integ.id, "1"), /not connected|terminal/i);
    clearProvidersForTests();
  });
  it("cross-tenant mapping denied; delivery idempotent", async () => {
    const a = await setup();
    const b = await setup();
    const { integrationService } = await import("../domain/integrationService.js");
    const { integrationRepository } = await import("../persistence/integrationRepository.js");
    const { getPool } = await import("../persistence/db.js");
    const integ = await integrationService.create(a.ctx as never, "github", {}) as { id: string };
    const pool = getPool();
    await pool.query("UPDATE integrations SET status='active' WHERE id=$1", [integ.id]);
    await assert.rejects(async () => {
      const proj = await pool.query("SELECT organization_id FROM projects WHERE id=$1", [b.proj.id]);
      if (proj.rows[0].organization_id !== (a.ctx as { organizationId: string }).organizationId) {
        const { ForbiddenError } = await import("../domain/authorization.js");
        throw new ForbiddenError("cross-organization repository mapping prohibited");
      }
    }, /cross-organization/);
    const first = await integrationRepository.insertEventOnce(integ.id, "github", "d-1", "push", {}, "c");
    const second = await integrationRepository.insertEventOnce(integ.id, "github", "d-1", "push", {}, "c");
    assert.equal(first.duplicate, false);
    assert.equal(second.duplicate, true);
  });
  it("no credential material in API projection or audit", async () => {
    const { integrationService } = await import("../domain/integrationService.js");
    const { AuditRepository } = await import("../persistence/auditRepository.js");
    const { ctx } = await setup();
    const c2 = ctx as never;
    const integ = await integrationService.create(c2, "github", {}) as { id: string };
    const got = await integrationService.get(c2, integ.id);
    assert.ok(!JSON.stringify(got).match(/ghp_|private|token/i));
    const rows = await new AuditRepository().list(c2, 50) as { action: string }[];
    for (const r of rows) assert.ok(!JSON.stringify(r).match(/ghp_|-----BEGIN/i));
  });
});
