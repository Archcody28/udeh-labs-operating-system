// Phase 8 PostgreSQL integration: commercial chain + engineering + idempotency + concurrency.
// Requires DATABASE_URL; skipped otherwise (CI provides real PostgreSQL).
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

const hasDb = !!process.env.DATABASE_URL;
describe("phase8 core domain", { skip: !hasDb } as never, () => {
  before(async () => {
    const { migrateUp } = await import("../persistence/migrate.js");
    await migrateUp(process.env.DATABASE_URL as string);
  });
  async function setupOrg() {
    const { OrganizationRepository } = await import("../persistence/tenancyRepositories.js");
    const { WorkspaceRepository } = await import("../persistence/tenancyRepositories.js");
    const orgs = new OrganizationRepository();
    const ts = Date.now();
    const org = await orgs.create(`P8 ${ts}`, `p8-${ts}`);
    const { MembershipRepository } = await import("../persistence/membershipRepository.js");
    const { UserRepository } = await import("../persistence/userRepository.js");
    const users = new UserRepository();
    const u = await users.create(`p8-${ts}@t.co`, `P8 ${ts}`, "scrypt$16384$dummy");
    const mems = new MembershipRepository();
    await mems.upsertActive({ organizationId: org.id, correlationId: "t" } as never, u.id, "owner");
    const wss = new WorkspaceRepository();
    const ws = await wss.create({ organizationId: org.id, correlationId: "t" } as never, "WS", `ws-${ts}`);
    return { org, ws, user: u };
  }
  it("runs request->requirement->proposal->contract->project", async () => {
    const { org, ws, user } = await setupOrg();
    const ctx = { organizationId: org.id, actorId: user.id, principalType: "human", correlationId: "t" } as never;
    const { ClientRequestRepository, RequirementRepository } = await import("../persistence/commercialRepositories.js");
    const { ProposalRepository } = await import("../persistence/proposalRepository.js");
    const { ProposalVersionRepository } = await import("../persistence/versionContractRepositories.js");
    const reqs = new ClientRequestRepository();
    const cr = await reqs.create(ctx, ws.id, "Need CRM");
    await reqs.transition(ctx, cr.id, 1, "elaborated");
    const rq = new RequirementRepository();
    const r = await rq.create(ctx, ws.id, cr.id, "Login", "SSO login", "high");
    await rq.accept(ctx, r.id, 1);
    const ps = new ProposalRepository();
    const p = await ps.create(ctx, cr.id);
    await ps.transition(ctx, p.id, 1, "sent");
    const vs = new ProposalVersionRepository();
    const v = await vs.createVersion(ctx, p.id, { price: 10 }, "h1");
    await vs.send(ctx, v.id, 1);
    const { commercialService } = await import("../domain/commercialService.js");
    const acc = await (commercialService as never as {
      acceptProposal(c: never, pid: string, vid: string, ver: number, k: string, a: string): Promise<{ contract: { contractId: string } }>
    }).acceptProposal(ctx, p.id, v.id, 2, `k-${Date.now()}`, user.id);
    assert.ok(acc.contract.contractId);
    const { ContractRepository } = await import("../persistence/versionContractRepositories.js");
    const cs = new ContractRepository();
    const c = await cs.find(ctx, acc.contract.contractId) as { status: string; version: number };
    assert.equal(c.status, "ready");
    const sign = await (commercialService as never as {
      signContract(c: never, id: string, ver: number, h: string, k: string, a: string): Promise<unknown>
    }).signContract(ctx, cRowId(c), c.version, "pkg", `s-${Date.now()}`, user.id);
    assert.ok(sign);
    function cRowId(x: unknown): string { return (x as { id: string }).id ?? acc.contract.contractId; }
  });
  it("enforces cross-tenant + stale version conflicts", async () => {
    const a = await setupOrg();
    const b = await setupOrg();
    const ctxA = { organizationId: a.org.id, correlationId: "t" } as never;
    const { ClientRequestRepository } = await import("../persistence/commercialRepositories.js");
    const reqs = new ClientRequestRepository();
    const cr = await reqs.create(ctxA, a.ws.id, "X");
    const ctxB = { organizationId: b.org.id, correlationId: "t" } as never;
    await assert.rejects(() => reqs.transition(ctxB, cr.id, 1, "elaborated"), /not found|NOT_FOUND/i);
    await assert.rejects(() => reqs.transition(ctxA, cr.id, 99, "elaborated"), /stale|CONFLICT/i);
    await assert.rejects(() => reqs.transition(ctxA, cr.id, 1, "closed"), /invalid transition/i);
  });
});
