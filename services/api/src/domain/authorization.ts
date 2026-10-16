/**
 * Authorization: Principal → Membership → Role → Permission → Action (Phase 6).
 * RBAC core with ABAC-ready conditions; centralized evaluation — never
 * `if (authenticated) allow`. Unknown policy areas stay explicit denials.
 */
import { AuthPrincipal, membershipIn } from "./principal.js";
import { AppError } from "./errors.js";

export class UnauthorizedError extends AppError {
  constructor(message = "authentication required") {
    super("UNAUTHORIZED", message, 401, false);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "forbidden") {
    super("FORBIDDEN", message, 403, false);
  }
}

/** Canonical org roles (role-surface-matrix). Lowercase canonical form. */
export const CANONICAL_ROLES = [
  "owner", "admin", "manager", "developer", "designer", "client", "support", "auditor"
] as const;
export type CanonicalRole = (typeof CANONICAL_ROLES)[number];

export function normalizeRole(role: string): CanonicalRole {
  const r = role.trim().toLowerCase();
  if ((CANONICAL_ROLES as readonly string[]).includes(r)) return r as CanonicalRole;
  throw new ForbiddenError(`unknown role: ${role}`);
}

/** Minimal evidenced permission set. NOT a full matrix (documented gap). */
export type Permission =
  | "org.manage" | "org.read"
  | "member.manage" | "member.read"
  | "workspace.create" | "workspace.read"
  | "project.create" | "project.read"
  | "commercial.approve" | "commercial.read"
  | "engineering.manage" | "engineering.read"
  | "deployment.trigger"
  | "agent.approve" | "agent.invoke"
  | "audit.read"
  | "invitation.create";

const ROLE_PERMISSIONS: Record<CanonicalRole, Permission[]> = {
  owner: ["org.manage", "org.read", "member.manage", "member.read", "workspace.create",
    "workspace.read", "project.create", "project.read", "commercial.approve", "commercial.read",
    "engineering.manage", "engineering.read", "deployment.trigger", "agent.approve",
    "agent.invoke", "audit.read", "invitation.create"],
  admin: ["org.read", "member.manage", "member.read", "workspace.create",
    "workspace.read", "project.create", "project.read", "commercial.read",
    "engineering.read", "agent.approve", "agent.invoke", "audit.read", "invitation.create"],
  manager: ["org.read", "member.read", "workspace.read", "project.create", "project.read",
    "commercial.read", "engineering.manage", "engineering.read", "agent.invoke"],
  developer: ["org.read", "member.read", "workspace.read", "project.read",
    "engineering.read", "agent.invoke"],
  designer: ["org.read", "member.read", "workspace.read", "project.read", "engineering.read"],
  client: ["org.read", "workspace.read", "project.read", "commercial.read"],
  support: ["org.read", "member.read", "workspace.read", "project.read", "engineering.read"],
  auditor: ["org.read", "member.read", "workspace.read", "project.read", "commercial.read",
    "engineering.read", "audit.read"]
};

export function permissionsFor(role: string): Permission[] {
  return ROLE_PERMISSIONS[normalizeRole(role)] ?? [];
}

export function canInOrg(principal: AuthPrincipal, organizationId: string, permission: Permission): boolean {
  const m = membershipIn(principal, organizationId);
  if (!m) return false;
  return permissionsFor(m.role).includes(permission);
}

/** Central guard: throws 401 (unauthenticated) or 403 (unauthorized). */
export function requirePermission(
  principal: AuthPrincipal, organizationId: string, permission: Permission
): void {
  if (principal.assurance === "none" || !principal.subjectId) {
    throw new UnauthorizedError();
  }
  if (!canInOrg(principal, organizationId, permission)) {
    throw new ForbiddenError();
  }
}

/**
 * Step-up hook (INV-SEC-01). High-risk actions require `stepped-up`
 * assurance. The MFA/TOTP/WebAuthn verifier is unresolved — the hook and
 * enforcement point are real; `elevateForTests`/future verifier flips the
 * flag after out-of-band verification.
 */
const STEP_UP_ACTIONS: ReadonlySet<string> = new Set([
  "commercial.approve", "deployment.trigger", "member.manage",
  "org.manage", "agent.approve", "credential.rotate"
]);

export function requiresStepUp(action: string): boolean {
  return STEP_UP_ACTIONS.has(action);
}

export function requireAssurance(principal: AuthPrincipal, action: string): void {
  if (requiresStepUp(action) && principal.assurance !== "stepped-up") {
    throw new ForbiddenError("step-up authentication required");
  }
}
