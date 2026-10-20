/** Integration service: UdehLabs authz -> integration check -> provider call. */
import { TenantContext } from "./tenancy.js";
import { ValidationError, NotFoundError } from "./errors.js";
import { ForbiddenError } from "./authorization.js";
import { getProvider } from "./integrationProvider.js";
import { integrationRepository } from "../persistence/integrationRepository.js";
import { sanitizeForAudit } from "./integrationSecrets.js";
import { AuditRepository } from "../persistence/auditRepository.js";

const audits = new AuditRepository();
const SUPPORTED = new Set(["github"]);
const TERMINAL = new Set(["revoked", "disconnected"]);

export const integrationService = {
  async create(ctx: TenantContext, kind: string, config: unknown) {
    if (!SUPPORTED.has(kind)) throw new ValidationError(`unsupported provider: ${kind}`);
    if (config && typeof config === "object" && /private[_-]?key|gh[pousr]_|-----BEGIN/i.test(JSON.stringify(config))) {
      throw new ValidationError("credentials must not be embedded in config");
    }
    const clean = (sanitizeForAudit(config && typeof config === "object" ? config : {}) ?? {}) as Record<string, unknown>;
    const row = await integrationRepository.create(ctx, kind, clean);
    await audits.append(ctx, "integration.created", "integration", row.id, "success", { kind });
    return row;
  },
  async get(ctx: TenantContext, id: string) {
    const row = await integrationRepository.find(ctx, id);
    if (!row) throw new ForbiddenError("integration not found");
    return { ...row, config: {} };
  },
  async list(ctx: TenantContext) {
    const rows = await integrationRepository.list(ctx);
    return rows.map((r: Record<string, unknown>) => ({ ...r, config: {} }));
  },
};
export { TERMINAL };
