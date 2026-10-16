/**
 * Tenant context — server-resolved only (INV-TEN-01/02).
 * Never populated from client-supplied organizationId.
 */
export interface TenantContext {
  organizationId: string;
  workspaceId?: string;
  projectId?: string;
  actorId?: string;
  principalType?: "human" | "agent" | "system";
  correlationId: string;
}

export function assertSameOrganization(a: string, b: string, what = "cross-tenant relationship"): void {
  if (a !== b) throw new Error(`${what} prohibited (INV-TEN-02)`);
}
