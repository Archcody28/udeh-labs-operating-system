/**
 * Authenticated principal — application-level identity (ADR 0013).
 * Provider-neutral: no IdP types leak past the AuthProvider seam.
 * NEVER carries secrets, password hashes, or raw provider tokens.
 */
export type PrincipalKind = "human" | "agent" | "system";
export type AuthAssurance = "none" | "password" | "stepped-up";

export interface MembershipClaim {
  organizationId: string;
  role: string; // normalized lowercase canonical role
  status: "active" | "suspended" | "removed";
}

export interface AuthPrincipal {
  kind: PrincipalKind;
  /** Human user id; "system" for service actions; agent run id for agents. */
  subjectId: string;
  /** Email when known (safe display field, not an authority). */
  email?: string;
  sessionId?: string;
  assurance: AuthAssurance;
  authenticatedAt?: string;
  memberships: MembershipClaim[];
  correlationId: string;
}

export function anonymousPrincipal(correlationId: string): AuthPrincipal {
  return { kind: "human", subjectId: "", assurance: "none", memberships: [], correlationId };
}

export function isAuthenticated(p: AuthPrincipal): boolean {
  return p.assurance !== "none" && p.subjectId !== "";
}

export function membershipIn(p: AuthPrincipal, organizationId: string): MembershipClaim | undefined {
  return p.memberships.find(
    (m) => m.organizationId === organizationId && m.status === "active"
  );
}

/** Safe /me projection — no secrets, hashes, tokens, or provider internals. */
export function toPublicPrincipal(p: AuthPrincipal): Record<string, unknown> {
  return {
    subjectId: p.subjectId,
    kind: p.kind,
    email: p.email ?? null,
    assurance: p.assurance,
    authenticatedAt: p.authenticatedAt ?? null,
    organizations: p.memberships.map((m) => ({
      organizationId: m.organizationId, role: m.role, status: m.status
    }))
  };
}
