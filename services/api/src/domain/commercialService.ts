import { createHash } from "node:crypto";
import { PoolClient } from "pg";
import { TenantContext } from "../domain/tenancy.js";
import { ProposalRepository } from "../persistence/proposalRepository.js";
import { ProposalVersionRepository, ContractRepository } from "../persistence/versionContractRepositories.js";
import { IdempotencyRepository } from "../persistence/idempotencyRepository.js";
import { ProjectRepository } from "../persistence/projectRepository.js";
import { AuditRepository } from "../persistence/auditRepository.ts";
import { withTransaction } from "../persistence/db.ts";
import { ConflictError } from "../domain/errors.ts";
import { getPool } from "../persistence/db.ts";

const proposals = new ProposalRepository();
const versions = new ProposalVersionRepository();
const contracts = new ContractRepository();
const idem = new IdempotencyRepository();
const projects = new ProjectRepository();
const audits = new AuditRepository();

function hashBody(body: unknown): string {
  return createHash("sha256").update(JSON.stringify(body ?? {})).digest("hex");
}

/** Domain service: cross-aggregate commercial workflows live here, never in controllers. */
export class CommercialService {
  async acceptProposal(ctx: TenantContext, proposalId: string, versionId: string, version: number, idemKey: string, actorId: string) {
    return withTransaction(async (tx: PoolClient) => {
      const prior = await idem.check(ctx, "proposal.accept", idemKey, tx);
      if (prior) return { replayed: true as const, contract: prior };
      await proposals.find(ctx, proposalId, tx);
      const ver = await versions.find(ctx, versionId, tx) as { proposal_id: string; status: string; version: number };
      if (ver.proposal_id !== proposalId) throw new ConflictError("version outside proposal");
      const approved = await versions.approve(ctx, versionId, ver.version, tx);
      await versions.markSuperseded(ctx, proposalId, versionId, tx);
      await proposals.transition(ctx, proposalId, version, "approved", tx);
      await proposals.pinAcceptedVersion(proposalId, versionId, tx);
      const c = await tx.query(
        "INSERT INTO contracts(organization_id, proposal_id, accepted_version_id, status, idempotency_key) VALUES ($1,$2,$3,'ready',$4) RETURNING *",
        [ctx.organizationId, proposalId, versionId, `accept:${idemKey}`]);
      const contract = c.rows[0];
      const payload = { contractId: contract.id, versionId: (approved as { id: string }).id };
      await idem.save(ctx, "proposal.accept", idemKey, payload, tx);
      await audits.append({ ...ctx, actorId, principalType: "human" }, "proposal.accepted", "proposal", proposalId, "success", payload, tx);
      await audits.append({ ...ctx, actorId, principalType: "human" }, "contract.created", "contract", contract.id, "success", payload, tx);
      return { replayed: false as const, contract: payload };
    });
  }

  async signContract(ctx: TenantContext, contractId: string, version: number, pkgHash: string, idemKey: string, actorId: string) {
    return withTransaction(async (tx: PoolClient) => {
      const prior = await idem.check(ctx, "contract.sign", idemKey, tx);
      if (prior) return { replayed: true as const, contract: prior };
      const signed = await contracts.transition(ctx, contractId, version, "signed", tx);
      await tx.query("UPDATE contracts SET signed_package_hash=$2 WHERE id=$1", [contractId, pkgHash]);
      const payload = { contractId, status: (signed as { status: string }).status };
      await idem.save(ctx, "contract.sign", idemKey, payload, tx);
      await audits.append({ ...ctx, actorId, principalType: "human" }, "contract.signed", "contract", contractId, "success", payload, tx);
      return { replayed: false as const, contract: payload };
    });
  }

  async activateAndConvert(ctx: TenantContext, contractId: string, version: number, workspaceId: string, name: string, slug: string, idemKey: string, actorId: string) {
    return withTransaction(async (tx: PoolClient) => {
      const prior = await idem.check(ctx, "contract.convert", idemKey, tx);
      if (prior) return { replayed: true as const, result: prior };
      await contracts.transition(ctx, contractId, version, "active", tx);
      const project = await projects.create(ctx, workspaceId, name, slug, tx);
      await tx.query("UPDATE contracts SET project_id=$2 WHERE id=$1", [contractId, project.id]);
      await tx.query("UPDATE projects SET contract_id=$2 WHERE id=$1", [project.id, contractId]);
      const payload = { contractId, projectId: project.id };
      await idem.save(ctx, "contract.convert", idemKey, payload, tx);
      await audits.append({ ...ctx, workspaceId, actorId, principalType: "human" }, "contract.activated", "contract", contractId, "success", payload, tx);
      await audits.append({ ...ctx, workspaceId, projectId: project.id, actorId, principalType: "human" }, "project.converted", "project", project.id, "success", payload, tx);
      return { replayed: false as const, result: payload };
    });
  }
}

export const commercialService = new CommercialService();
export { hashBody };
export const requests = null;
export const requirements = null;
export const proposalRepos = { proposals, versions };
void getPool;
