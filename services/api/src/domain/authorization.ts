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

/** Canonical Phase-7 permission set (dotted actions). Legacy Phase-6 aliases
 * (org.manage, member.manage, ...) are preserved and mapped narrowly. */
export type Permission =
  | "organization.read" | "organization.update"
  | "member.read" | "member.update" | "member.remove"
  | "workspace.read" | "workspace.create" | "workspace.update" | "workspace.archive"
  | "project.read" | "project.create" | "project.update" | "project.archive"
  | "audit.read"
  | "invitation.create" | "invitation.accept"
  | "commercial.request.read" | "commercial.request.create" | "commercial.request.update"
  | "commercial.requirement.read" | "commercial.requirement.create" | "commercial.requirement.update"
  | "commercial.proposal.read" | "commercial.proposal.create" | "commercial.proposal.update" | "commercial.proposal.accept"
  | "commercial.contract.read" | "commercial.contract.create" | "commercial.contract.sign" | "commercial.contract.activate"
  | "engineering.task.read" | "engineering.task.create" | "engineering.task.update" | "engineering.task.assign"
  | "engineering.patch.read" | "engineering.patch.create" | "engineering.patch.approve"
  | "engineering.review.read" | "engineering.review.create" | "engineering.review.decide"
  | "collaboration.comment.read" | "collaboration.comment.create" | "collaboration.comment.update"
  | "collaboration.activity.read"
  | "deployment.read" | "deployment.create"
  | "agent.run" | "agent.read" | "agent.approve"
  | "org.manage" | "org.read" | "member.manage"
  | "commercial.approve" | "commercial.read"
  | "engineering.manage" | "engineering.read"
  | "deployment.trigger" | "agent.invoke";

export type CanonicalPermission =
  | "organization.read" | "organization.update"
  | "member.read" | "member.update" | "member.remove"
  | "workspace.read" | "workspace.create" | "workspace.update" | "workspace.archive"
  | "project.read" | "project.create" | "project.update" | "project.archive"
  | "audit.read" | "invitation.create" | "invitation.accept"
  | "commercial.request.read" | "commercial.request.create" | "commercial.request.update"
  | "commercial.requirement.read" | "commercial.requirement.create" | "commercial.requirement.update"
  | "commercial.proposal.read" | "commercial.proposal.create" | "commercial.proposal.update" | "commercial.proposal.accept"
  | "commercial.contract.read" | "commercial.contract.create" | "commercial.contract.sign" | "commercial.contract.activate"
  | "engineering.task.read" | "engineering.task.create" | "engineering.task.update" | "engineering.task.assign"
  | "engineering.patch.read" | "engineering.patch.create" | "engineering.patch.approve"
  | "engineering.review.read" | "engineering.review.create" | "engineering.review.decide"
  | "collaboration.comment.read" | "collaboration.comment.create" | "collaboration.comment.update"
  | "collaboration.activity.read"
  | "deployment.read" | "deployment.create"
  | "agent.run" | "agent.read" | "agent.approve";

const LEGACY_ALIAS: Record<string, CanonicalPermission[]> = {
  "org.manage": ["organization.update"],
  "org.read": ["organization.read"],
  "member.manage": ["member.update", "member.remove", "invitation.create"],
  "commercial.approve": ["commercial.proposal.accept", "commercial.contract.sign", "commercial.contract.activate"],
  "commercial.read": ["commercial.proposal.read", "commercial.contract.read", "commercial.request.read", "commercial.requirement.read"],
  "engineering.manage": ["engineering.task.create", "engineering.task.update", "engineering.patch.create", "engineering.review.create"],
  "engineering.read": ["engineering.task.read", "engineering.review.read", "engineering.patch.read"],
  "deployment.trigger": ["deployment.create"],
  "agent.invoke": ["agent.run"],
};

const COMMERCIAL_ALL: CanonicalPermission[] = ["commercial.request.read", "commercial.request.create", "commercial.request.update",
  "commercial.requirement.read", "commercial.requirement.create", "commercial.requirement.update",
  "commercial.proposal.read", "commercial.proposal.create", "commercial.proposal.update", "commercial.proposal.accept",
  "commercial.contract.read", "commercial.contract.create", "commercial.contract.sign", "commercial.contract.activate"];
const ENG_ALL: CanonicalPermission[] = ["engineering.task.read", "engineering.task.create", "engineering.task.update",
  "engineering.task.assign", "engineering.patch.read", "engineering.patch.create", "engineering.patch.approve",
  "engineering.review.read", "engineering.review.create", "engineering.review.decide",
  "collaboration.comment.read", "collaboration.comment.create", "collaboration.comment.update",
  "collaboration.activity.read"];

const ROLE_PERMISSIONS: Record<CanonicalRole, CanonicalPermission[]> = {
  owner: ["organization.read", "organization.update", "member.read", "member.update",
    "member.remove", "workspace.read", "workspace.create", "workspace.update",
    "workspace.archive", "project.read", "project.create", "project.update",
    "project.archive", "audit.read", "invitation.create", "invitation.accept",
    ...COMMERCIAL_ALL, ...ENG_ALL,
    "deployment.read", "deployment.create", "agent.run", "agent.read", "agent.approve"],
  admin: ["organization.read", "member.read", "member.update", "member.remove",
    "workspace.read", "workspace.create", "workspace.update",
    "project.read", "project.create", "project.update",
    "audit.read", "invitation.create", "invitation.accept",
    ...COMMERCIAL_ALL, "engineering.task.read", "engineering.patch.read", "engineering.review.read",
    "deployment.read", "agent.read", "agent.approve", "agent.run"],
  manager: ["organization.read", "member.read",
    "workspace.read", "workspace.create",
    "project.read", "project.create", "project.update", "invitation.accept",
    ...COMMERCIAL_ALL, ...ENG_ALL,
    "deployment.read", "agent.run", "agent.read"],
  developer: ["organization.read", "member.read",
    "workspace.read", "project.read", "invitation.accept",
    "commercial.request.read", "commercial.requirement.read", "commercial.proposal.read", "commercial.contract.read",
    ...ENG_ALL, "deployment.read", "agent.run", "agent.read"],
  designer: ["organization.read", "member.read", "workspace.read", "project.read",
    "commercial.request.read", "commercial.requirement.read", "commercial.proposal.read",
    "engineering.task.read", "engineering.task.update", "agent.read", "invitation.accept",
    "collaboration.comment.read", "collaboration.comment.create", "collaboration.activity.read"],
  client: ["organization.read", "workspace.read", "project.read", "invitation.accept",
    "commercial.request.read", "commercial.proposal.read", "commercial.contract.read",
    "collaboration.comment.read", "collaboration.activity.read"],
  support: ["organization.read", "member.read", "workspace.read", "project.read",
    "commercial.request.read", "commercial.contract.read",
    "engineering.task.read", "deployment.read", "agent.read",
    "collaboration.comment.read", "collaboration.activity.read"],
  auditor: ["organization.read", "member.read", "workspace.read", "project.read",
    "audit.read", "commercial.request.read", "commercial.proposal.read", "commercial.contract.read",
    "engineering.task.read", "deployment.read", "agent.read",
    "collaboration.comment.read", "collaboration.activity.read"]
};

function canonicalize(p: Permission): CanonicalPermission[] {
  const hit = (LEGACY_ALIAS as Record<string, CanonicalPermission[]>)[p];
  if (hit) return hit;
  return [p as CanonicalPermission];
}

/** Held permissions for a role, in both canonical and legacy alias form.
 * Phase 6 routes/tests consume legacy names (org.manage, member.manage, ...);
 * the matrix below stays canonical — aliases that fully resolve against the
 * held canonical set are appended so both views agree. */
export function permissionsFor(role: string): Permission[] {
  const held = ROLE_PERMISSIONS[normalizeRole(role)];
  const set = new Set<CanonicalPermission>(held);
  const aliases = Object.entries(LEGACY_ALIAS)
    .filter(([, targets]) => targets.every((t) => set.has(t)))
    .map(([alias]) => alias as Permission);
  return [...held, ...aliases];
}

export function canInOrg(principal: AuthPrincipal, organizationId: string, permission: Permission): boolean {
  const m = membershipIn(principal, organizationId);
  if (!m) return false;
  const held = new Set<CanonicalPermission>(ROLE_PERMISSIONS[normalizeRole(m.role)] ?? []);
  return canonicalize(permission).some((c) => held.has(c));
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
  "organization.update", "org.manage",
  "member.update", "member.remove", "member.manage",
  "deployment.create", "deployment.trigger",
  "agent.approve", "agent.run",
  "project.archive", "workspace.archive",
  "credential.rotate", "commercial.approve", "commercial.proposal.accept",
  "commercial.contract.sign", "commercial.contract.activate",
]);

export function requiresStepUp(action: string): boolean {
  return STEP_UP_ACTIONS.has(action);
}

export function requireAssurance(principal: AuthPrincipal, action: string): void {
  if (requiresStepUp(action) && principal.assurance !== "stepped-up") {
    throw new ForbiddenError("step-up authentication required");
  }
}

export function canOnProject(
  principal: AuthPrincipal,
  organizationId: string,
  basePermission: Permission,
  grants: { organizationId: string; status: string; permission: string }[],
): boolean {
  if (!canInOrg(principal, organizationId, basePermission)) {
    const narrow = new Set(["engineering.task.read", "agent.read", "project.read"]);
    const wanted = canonicalize(basePermission);
    const hasGrant = grants.some((g) =>
      g.organizationId === organizationId && g.status === "active" &&
      (wanted as string[]).includes(g.permission) && narrow.has(g.permission));
    if (!hasGrant) return false;
    return membershipIn(principal, organizationId) !== undefined;
  }
  return true;
}
