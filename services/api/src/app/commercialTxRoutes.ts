import { IncomingMessage, ServerResponse } from "node:http";
import { sendJson, readJsonBody, page } from "../api/http.js";
import { ValidationError } from "../domain/errors.js";
import { guardOrgRoute } from "../auth/guards.js";
import { assertWorkspaceInOrg } from "../domain/tenant.js";
import { WorkspaceRepository } from "../persistence/tenancyRepositories.js";
import { ProposalRepository } from "../persistence/proposalRepository.js";
import { ProposalVersionRepository, ContractRepository } from "../persistence/versionContractRepositories.js";
import { commercialService, hashBody } from "../domain/commercialService.js";
import { AuditRepository } from "../persistence/auditRepository.js";

const workspaces = new WorkspaceRepository();
const proposals = new ProposalRepository();
const versions = new ProposalVersionRepository();
const contracts = new ContractRepository();
const audits = new AuditRepository();

export async function handleCommercialTxRoutes(
  req: IncomingMessage, res: ServerResponse, cid: string, url: URL, method: string
): Promise<boolean> {
  let m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/proposals\/([^/]+)\/transition$/);
  if (m && method === "POST") {
    const [, orgId, id] = m;
    const g = await guardOrgRoute(req, cid, orgId, "commercial.proposal.update");
    const body = await readJsonBody(req);
    if (!body.to || body.version === undefined) throw new ValidationError("to and version required");
    const row = await proposals.transition(g.ctx, id, Number(body.version), String(body.to));
    await audits.append({ ...g.ctx, actorId: g.principal.subjectId, principalType: "human" },
      "proposal.transitioned", "proposal", id, "success", { to: body.to });
    return sendJson(res, 200, { data: row, correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/proposals\/([^/]+)\/versions$/);
  if (m) {
    const [, orgId, pid] = m;
    if (method === "POST") {
      const g = await guardOrgRoute(req, cid, orgId, "commercial.proposal.create");
      const body = await readJsonBody(req);
      const content = (body.body ?? {}) as Record<string, unknown>;
      const row = await versions.createVersion(g.ctx, pid, content, hashBody(content));
      await audits.append({ ...g.ctx, actorId: g.principal.subjectId, principalType: "human" },
        "proposal.version.created", "proposal_version", row.id, "success", {});
      return sendJson(res, 201, { data: row, correlationId: cid }, cid), true;
    }
    if (method === "GET") {
      const g = await guardOrgRoute(req, cid, orgId, "commercial.proposal.read");
      await proposals.find(g.ctx, pid);
      return sendJson(res, 200, { ...page(await versions.list(g.ctx, pid), null, 50), correlationId: cid }, cid), true;
    }
    return false;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/proposal-versions\/([^/]+)\/send$/);
  if (m && method === "POST") {
    const [, orgId, id] = m;
    const g = await guardOrgRoute(req, cid, orgId, "commercial.proposal.update");
    const body = await readJsonBody(req);
    if (body.version === undefined) throw new ValidationError("version required");
    const row = await versions.send(g.ctx, id, Number(body.version));
    await audits.append({ ...g.ctx, actorId: g.principal.subjectId, principalType: "human" },
      "proposal.version.sent", "proposal_version", id, "success", {});
    return sendJson(res, 200, { data: row, correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/proposals\/([^/]+)\/accept$/);
  if (m && method === "POST") {
    const [, orgId, pid] = m;
    const g = await guardOrgRoute(req, cid, orgId, "commercial.proposal.accept", "commercial.proposal.accept");
    const body = await readJsonBody(req);
    if (!body.versionId || body.version === undefined || !body.idempotencyKey) throw new ValidationError("versionId, version, idempotencyKey required");
    const out = await commercialService.acceptProposal(g.ctx, pid, String(body.versionId), Number(body.version), String(body.idempotencyKey), g.principal.subjectId);
    return sendJson(res, out.replayed ? 200 : 201, { data: out.contract, replayed: out.replayed, correlationId: cid }, cid), true;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/contracts$/);
  if (m && method === "GET") {
    const [, orgId] = m;
    const g = await guardOrgRoute(req, cid, orgId, "commercial.contract.read");
    return sendJson(res, 200, { ...page(await contracts.list(g.ctx), null, 20), correlationId: cid }, cid), true;
  }
  return false;
}
