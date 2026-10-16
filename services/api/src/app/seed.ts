/** Deterministic synthetic dev seed. Never for production. Respects org→ws→project. */
import { migrateUp } from "../persistence/migrate.js";
import { OrganizationRepository, WorkspaceRepository } from "../persistence/tenancyRepositories.js";
import { ProjectRepository } from "../persistence/projectRepository.js";
import { AuditRepository } from "../persistence/auditRepository.js";

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL ?? "postgresql://udehlabs:udehlabs_dev@localhost:5432/udehlabs_dev";
  await migrateUp(url);
  process.env.DATABASE_URL = url;
  const orgs = new OrganizationRepository();
  const found = await orgs.createWithPrimaryWorkspace("Acme Demo Org", "acme-demo").catch(() => null);
  if (!found) { console.log("seed: dev org already present, kept"); return; }
  const ctx = { organizationId: found.org.id, correlationId: "seed" } as never;
  const wss = new WorkspaceRepository();
  const projs = new ProjectRepository();
  const audits = new AuditRepository();
  const ws = await wss.create(ctx, "Delivery", "delivery");
  const p = await projs.create(ctx, ws.id, "Website Launch", "website-launch");
  await audits.append({ organizationId: found.org.id, correlationId: "seed", principalType: "system" } as never, "seed.completed", "organization", found.org.id, "success",
    { workspaceId: ws.id, projectId: p.id });
  console.log(`seed ok org=${found.org.id} ws=${ws.id} project=${p.id}`);
}

const isMain = (process.argv[1] ?? "").endsWith("seed.js");
if (isMain) {
  main().then(() => process.exit(0), (e: unknown) => { console.error(e); process.exit(1); });
}
