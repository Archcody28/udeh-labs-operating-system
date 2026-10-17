import { PoolClient } from "pg";
import { TenantContext } from "../domain/tenancy.js";
import { EngineeringTaskRepository } from "../persistence/taskRepository.js";
import { PatchRepository, ReviewRepository, DeploymentRepository } from "../persistence/engineeringRepositories.js";
import { AuditRepository } from "../persistence/auditRepository.js";
import { withTransaction } from "../persistence/db.js";
import { createHash } from "node:crypto";

const tasks = new EngineeringTaskRepository();
const patches = new PatchRepository();
const reviews = new ReviewRepository();
const deployments = new DeploymentRepository();
const audits = new AuditRepository();

/** Domain service: review-gated patch approval + task progression, atomically. */
export class EngineeringService {
  async approvePatch(ctx: TenantContext, projectId: string, patchId: string, reviewId: string,
    patchVersion: number, reviewVersion: number, note: string, actorId: string) {
    return withTransaction(async (tx: PoolClient) => {
      const decision = await reviews.decide(ctx, reviewId, reviewVersion, "approved", note, actorId, tx);
      const patch = await patches.transition(ctx, patchId, patchVersion, "approved", tx);
      await audits.append({ ...ctx, projectId, actorId, principalType: "human" },
        "review.approved", "review", reviewId, "success", { patchId }, tx);
      await audits.append({ ...ctx, projectId, actorId, principalType: "human" },
        "patch.approved", "code_patch", patchId, "success", {}, tx);
      return { decision, patch };
    });
  }
}

export const engineeringService = new EngineeringService();
export { tasks, patches, reviews, deployments };
export function diffHash(diff: string): string {
  return createHash("sha256").update(diff).digest("hex");
}
