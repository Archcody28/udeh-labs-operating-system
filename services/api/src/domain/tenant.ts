/**
 * Server-resolved TenantContext (INV-TEN-01/02). A client-supplied
 * organizationId is a REQUEST HINT only — context is established after
 * verifying principal ∈ organization. Never `user → project` skipping
 * org → workspace → project validation.
 */
import { TenantContext } from "./tenancy.js";
import { AuthPrincipal, membershipIn } from "./principal.js";
import { ForbiddenError, UnauthorizedError } from "./authorization.js";

export interface OrgMembershipRow {
  organization_id: string;
  role: string;
  status: string;
}

export interface HierarchyRow {
  projectId: string;
  workspaceId: string;
  organizationId: string;
}

/**
 * Resolve tenant context from an authenticated principal + requested org.
 * Throws 401 (no principal) / 403 (no active membership) — never 404 for
 * membership failure, so org existence is not oracled to outsiders.
 */
export function resolveTenantContext(
  principal: AuthPrincipal,
  requestedOrganizationId: string,
  correlationId: string
): TenantContext {
  if (principal.assurance === "none" || !principal.subjectId) {
    throw new UnauthorizedError();
  }
  if (!requestedOrganizationId) throw new ForbiddenError("organization context required");
  const m = membershipIn(principal, requestedOrganizationId);
  if (!m) throw new ForbiddenError();
  return {
    organizationId: requestedOrganizationId,
    actorId: principal.subjectId,
    principalType: principal.kind === "system" ? "system" : "human",
    correlationId
  };
}

/** Verify workspace ∈ org before scoping (step 4 of hierarchy check). */
export function assertWorkspaceInOrg(workspaceOrgId: string, ctxOrgId: string): void {
  if (workspaceOrgId !== ctxOrgId) throw new ForbiddenError("workspace outside organization");
}

/** Verify project ∈ workspace ∈ org before scoping (steps 5-6). */
export function assertProjectInHierarchy(
  row: { organization_id: string; workspace_id: string },
  ctxOrgId: string,
  ctxWorkspaceId?: string
): void {
  if (row.organization_id !== ctxOrgId) throw new ForbiddenError("project outside organization");
  if (ctxWorkspaceId && row.workspace_id !== ctxWorkspaceId) {
    throw new ForbiddenError("project outside workspace");
  }
}
