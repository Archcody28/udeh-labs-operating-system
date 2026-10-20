/** Integration lifecycle ops: connect/disconnect/accounts/repos/link. */
import { TenantContext } from "./tenancy.js";
import { ValidationError, NotFoundError } from "./errors.js";
import { ForbiddenError } from "./authorization.js";
import { getProvider } from "./integrationProvider.js";
import { integrationRepository } from "../persistence/integrationRepository.js";
import { saveCredentialRef, upsertAccount, upsertResource, listAccounts } from "../persistence/integrationRefs.js";
import { secretVault } from "./integrationSecrets.js";
import { withTransaction, getPool } from "../persistence/db.js";
import { AuditRepository } from "../persistence/auditRepository.js";
import { TERMINAL } from "./integrationService.js";
import { publishDomainEvent } from "./domainEvents.js";

const audits = new AuditRepository();

export const integrationLifecycle = {
  async connect(ctx: TenantContext, id: string, version: number, installationId: string) {
    const cur = await integrationRepository.find(ctx, id);
    if (!cur) throw new ForbiddenError("integration not found");
    if (TERMINAL.has(cur.status)) throw new ForbiddenError("integration is terminal");
    if (!installationId) throw new ValidationError("installationId required");
    const provider = getProvider(cur.kind);
    if (!(await provider.validateInstallationAccess(installationId))) throw new ForbiddenError("provider authorization failed");
    const acct = await provider.resolveInstallation({ installationId });
    const out = await withTransaction(async (tx) => {
      const moved = await integrationRepository.transition(ctx, id, version, cur.status === "pending" ? "connected" : "active", tx);
      const ref = `integration:${id}:installation-token`;
      await secretVault().put(ref, `installation:${installationId}`);
      await saveCredentialRef(id, cur.kind, "installation-token", ref, tx);
      const acc = await upsertAccount(id, cur.kind, acct.installationId, acct.accountLogin, acct.displayName, ctx.correlationId, tx);
      return { moved, acc };
    });
    await audits.append(ctx, "integration.connected", "integration", id, "success", { provider: cur.kind });
    return out.moved;
  },
  async disconnect(ctx: TenantContext, id: string, version: number, to: "revoked" | "disconnected") {
    const cur = await integrationRepository.find(ctx, id);
    if (!cur) throw new ForbiddenError("integration not found");
    const moved = await withTransaction(async (tx) => {
      const m = await integrationRepository.transition(ctx, id, version, to, tx);
      await integrationRepository.revokeCredentials(id, tx);
      // INV-EVT-01: the disconnect/revocation event commits atomically with
      // the state transition, so no notification can be lost.
      await publishDomainEvent(tx, {
        organizationId: ctx.organizationId,
        workspaceId: ctx.workspaceId ?? null,
        eventType: to === "revoked" ? "integration.revoked" : "integration.disconnected",
        aggregateType: "integration",
        aggregateId: id,
        actorUserId: ctx.actorId ?? null,
        principalType: ctx.principalType ?? "human",
        payload: { integrationId: id, kind: String(cur.kind) },
        correlationId: ctx.correlationId,
      });
      return m;
    });
    await secretVault().revoke(`integration:${id}:installation-token`);
    await audits.append(ctx, to === "revoked" ? "integration.revoked" : "integration.disconnected", "integration", id, "success", { provider: cur.kind });
    return moved;
  },
  async accounts(ctx: TenantContext, id: string) {
    const cur = await integrationRepository.find(ctx, id);
    if (!cur) throw new ForbiddenError("integration not found");
    if (TERMINAL.has(cur.status)) throw new ForbiddenError("integration is not connected");
    return listAccounts(id);
  },
  async repositories(ctx: TenantContext, id: string, installationId: string) {
    const cur = await integrationRepository.find(ctx, id);
    if (!cur) throw new ForbiddenError("integration not found");
    if (TERMINAL.has(cur.status) || cur.status === "pending") throw new ForbiddenError("integration is not connected");
    return getProvider(cur.kind).listRepositories(installationId, { limit: 30 });
  },
  async linkRepository(ctx: TenantContext, projectId: string, integrationId: string, resource: { provider: string; pid: string; owner: string; name: string }) {
    const integ = await integrationRepository.find(ctx, integrationId);
    if (!integ) throw new ForbiddenError("integration not found");
    if (TERMINAL.has(integ.status) || integ.status === "pending") throw new ForbiddenError("integration is not connected");
    const pool = getPool();
    const proj = await pool.query("SELECT organization_id FROM projects WHERE id=$1", [projectId]);
    if (!proj.rowCount) throw new NotFoundError("projects");
    if (proj.rows[0].organization_id !== ctx.organizationId) throw new ForbiddenError("cross-organization repository mapping prohibited");
    const acc = await pool.query("SELECT id FROM external_accounts WHERE integration_id=$1 LIMIT 1", [integrationId]);
    if (!acc.rowCount) throw new ValidationError("no provider account registered for integration");
    const res = await upsertResource(integrationId, acc.rows[0].id as string, { ...resource, type: "repository" }, ctx.correlationId);
    const link = await pool.query(
      "INSERT INTO repository_links(organization_id, project_id, integration_id, external_account_id, external_resource_id, authorized_principal, authorized_scope, correlation_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING RETURNING *",
      [ctx.organizationId, projectId, integrationId, acc.rows[0].id, res.id, ctx.actorId ?? "", "repository:read", ctx.correlationId]);
    const row = link.rowCount ? link.rows[0] : (await pool.query("SELECT * FROM repository_links WHERE project_id=$1 AND integration_id=$2", [projectId, integrationId])).rows[0];
    await audits.append({ ...ctx, projectId }, "repository.linked", "repository_link", row.id as string, "success", { provider: resource.provider });
    return { link: row, duplicate: !link.rowCount };
  },
};
