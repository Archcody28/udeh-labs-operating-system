import { IncomingMessage, ServerResponse } from "node:http";
import { sendJson, readJsonBody } from "../api/http.js";
import { ValidationError } from "../domain/errors.js";
import { guardOrgRoute } from "../auth/guards.js";
import { assertWorkspaceInOrg } from "../domain/tenant.js";
import { WorkspaceRepository } from "../persistence/tenancyRepositories.js";
import { ContractRepository } from "../persistence/versionContractRepositories.js";
import { commercialService } from "../domain/commercialService.js";

const workspaces = new WorkspaceRepository();
const contracts = new ContractRepository();

function slugify(v: unknown): string {
  return String(v ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}

export async function handleContractRoutes(
  req: IncomingMessage, res: ServerResponse, cid: string, url: URL, method: string
): Promise<boolean> {
  let m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/contracts\/([^/]+)$/);
  if (m && method === "GET") {
    const [, orgId, id] = m;
    const g = await guardOrgRoute(req, cid, orgId, "commercial.contract.read");
    return sendJson(res, 200, { data: await contracts.find(g.ctx, id), correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/contracts\/([^/]+)\/sign$/);
  if (m && method === "POST") {
    const [, orgId, id] = m;
    const g = await guardOrgRoute(req, cid, orgId, "commercial.contract.sign", "commercial.contract.sign");
    const body = await readJsonBody(req);
    if (body.version === undefined || !body.signedPackageHash || !body.idempotencyKey) throw new ValidationError("version, signedPackageHash, idempotencyKey required");
    const out = await commercialService.signContract(g.ctx, id, Number(body.version), String(body.signedPackageHash), String(body.idempotencyKey), g.principal.subjectId);
    return sendJson(res, 200, { data: out.contract, replayed: out.replayed, correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/contracts\/([^/]+)\/convert$/);
  if (m && method === "POST") {
    const [, orgId, id] = m;
    const g = await guardOrgRoute(req, cid, orgId, "commercial.contract.activate", "commercial.contract.activate");
    const body = await readJsonBody(req);
    if (body.version === undefined || !body.workspaceId || !body.name || !body.idempotencyKey) throw new ValidationError("version, workspaceId, name, idempotencyKey required");
    const ws = await workspaces.findById(g.ctx, String(body.workspaceId));
    assertWorkspaceInOrg(ws.organization_id, orgId);
    const out = await commercialService.activateAndConvert(g.ctx, id, Number(body.version), ws.id,
      String(body.name), slugify(body.slug ?? body.name), String(body.idempotencyKey), g.principal.subjectId);
    return sendJson(res, out.replayed ? 200 : 201, { data: out.result, replayed: out.replayed, correlationId: cid }, cid), true;
  }
  return false;
}
