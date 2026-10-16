import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { getPool, closePool } from "../persistence/db.js";
import { migrateUp } from "../persistence/migrate.js";
import { OrganizationRepository, WorkspaceRepository } from "../persistence/tenancyRepositories.js";
import { ProjectRepository } from "../persistence/projectRepository.js";
import { AuditRepository } from "../persistence/auditRepository.js";
import { correlationIdOf, sendJson, sendError, readJsonBody, page } from "../api/http.js";
import { ValidationError } from "../domain/errors.js";
import { loadConfig } from "../config.js";

const orgs = new OrganizationRepository();
const workspaces = new WorkspaceRepository();
const projects = new ProjectRepository();
const audits = new AuditRepository();

function slugify(v: unknown): string {
  return String(v ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}

async function route(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const cid = correlationIdOf(req);
  const url = new URL(req.url ?? "/", "http://localhost");
  const method = req.method ?? "GET";
  try {
    if (method === "GET" && url.pathname === "/health") {
      return sendJson(res, 200, { status: "ok", correlationId: cid }, cid);
    }
    if (method === "GET" && url.pathname === "/ready") {
      await getPool().query("SELECT 1");
      return sendJson(res, 200, { status: "ready", correlationId: cid }, cid);
    }
    if (method === "POST" && url.pathname === "/api/v1/organizations") {
      const body = await readJsonBody(req);
      if (!body.name || !body.slug) throw new ValidationError("name and slug required",
        [{ field: "name", issue: "required" }, { field: "slug", issue: "required" }]);
      const { org, workspace } = await orgs.createWithPrimaryWorkspace(String(body.name), slugify(body.slug));
      await audits.append({ organizationId: org.id, correlationId: cid, principalType: "system" },
        "organization.created", "organization", org.id, "success", { slug: org.slug });
      return sendJson(res, 201, { data: { organization: org, primaryWorkspace: workspace }, correlationId: cid }, cid);
    }
    if (method === "GET" && url.pathname === "/api/v1/organizations") {
      const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 100);
      const cursor = url.searchParams.get("cursor") ?? undefined;
      const listed = await (orgs as unknown as { list: (l: number, c?: string) => Promise<{ data: unknown[]; nextCursor: string | null }> }).list(limit, cursor);
      return sendJson(res, 200, { ...page(listed.data, listed.nextCursor, limit), correlationId: cid }, cid);
    }
    const m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/(workspaces|projects|audit-events)$/);
    if (m) {
      const [, orgId, child] = m;
      const ctx = { organizationId: orgId, correlationId: cid } as never;
      if (method === "POST" && child === "workspaces") {
        const body = await readJsonBody(req);
        if (!body.name) throw new ValidationError("name required", [{ field: "name", issue: "required" }]);
        const ws = await workspaces.create(ctx, String(body.name), slugify(body.slug ?? body.name));
        await audits.append({ organizationId: orgId, correlationId: cid, principalType: "system" },
          "workspace.created", "workspace", ws.id, "success", {});
        return sendJson(res, 201, { data: ws, correlationId: cid }, cid);
      }
      if (method === "GET" && child === "workspaces") {
        return sendJson(res, 200, { ...page(await workspaces.list(ctx), null, 20), correlationId: cid }, cid);
      }
      if (method === "POST" && child === "projects") {
        const body = await readJsonBody(req);
        if (!body.name || !body.workspaceId) throw new ValidationError("name and workspaceId required");
        const p = await projects.create(ctx, String(body.workspaceId), String(body.name), slugify(body.slug ?? body.name));
        return sendJson(res, 201, { data: p, correlationId: cid }, cid);
      }
      if (method === "GET" && child === "projects") {
        return sendJson(res, 200, { ...page(await projects.list(ctx), null, 20), correlationId: cid }, cid);
      }
      if (method === "GET" && child === "audit-events") {
        return sendJson(res, 200, { ...page(await audits.list(ctx), null, 20), correlationId: cid }, cid);
      }
    }
    return sendJson(res, 404, { code: "NOT_FOUND", message: "not found", correlationId: cid, retryable: false }, cid);
  } catch (err) {
    sendError(res, err, cid);
  }
}

export function createApp() {
  return createServer((req, res) => { void route(req, res); });
}

const isMain = (process.argv[1] ?? "").endsWith("server.js");
if (isMain) {
  const cfg = loadConfig();
  process.env.DATABASE_URL = cfg.databaseUrl;
  migrateUp(cfg.databaseUrl).then(
    () => createApp().listen(cfg.port, () => console.log(`api listening :${cfg.port}`)),
    (e: unknown) => { console.error("migrate failed", e); process.exit(1); }
  );
  for (const s of ["SIGINT", "SIGTERM"]) process.on(s, () => { void closePool().then(() => process.exit(0)); });
}
