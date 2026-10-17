import { IncomingMessage, ServerResponse } from "node:http";
import { sendJson, readJsonBody, page } from "../api/http.js";
import { ValidationError } from "../domain/errors.js";
import { guardOrgRoute } from "../auth/guards.js";
import { ProposalRepository } from "../persistence/proposalRepository.js";
import { ProposalVersionRepository, ContractRepository } from "../persistence/versionContractRepositories.js";
import { commercialService, hashBody } from "../domain/commercialService.js";
import { AuditRepository } from "../persistence/auditRepository.js";
import { idemOf } from "./requestRoutes.js";

const proposals = new ProposalRepository();
const versions = new ProposalVersionRepository();
const contracts = new ContractRepository();
const audits = new AuditRepository();

export async function handleProposalRoutes(
  req: IncomingMessage, res: ServerResponse, cid: string, url: URL, method: string
): Promise<boolean> {
  let m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/proposals$/);
  if (m) {
    const [, orgId] = m;
    if (method === "POST") {
      const g = await guardOrgRoute(req, cid, orgId, "commercial.proposal.create");
      const body = await readJsonBody(req);
      if (!body.clientRequestId) throw new ValidationError("clientRequestId required");
      const row = await proposals.create(g.ctx, String(body.clientRequestId), idemOf(url, body));
      await audits.append({ ...g.ctx, actorId: g.principal.subjectId, principalType: "human" },
        "proposal.created", "proposal", row.id, "success", {});
      return sendJson(res, 201, { data: row, correlationId: cid }, cid), true;
    }
    if (method === "GET") {
      const g = await guardOrgRoute(req, cid, orgId, "commercial.proposal.read");
      return sendJson(res, 200, { ...page(await proposals.list(g.ctx), null, 20), correlationId: cid }, cid), true;
    }
    return false;
  }
  m = url.pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/proposals\/([^/]+)$/);
  if (m && method === "GET") {
    const [, orgId, id] = m;
    const g = await guardOrgRoute(req, cid, orgId, "commercial.proposal.read");
    return sendJson(res, 200, { data: await proposals.find(g.ctx, id), correlationId: cid }, cid), true;
  }
  return false;
}
