/**
 * Provider-neutral authentication boundary (ADR 0013).
 *
 *   AuthProvider  →  AuthenticatedPrincipal  →  application
 *
 * Only this module (and AuthService) touches provider specifics.
 * Handlers depend on AuthPrincipal, never on provider objects.
 */
import { AuthAssurance, AuthPrincipal } from "../domain/principal.js";

export interface CredentialInput {
  email: string;
  password: string;
}

export interface VerifiedIdentity {
  userId: string;
  email: string;
  assurance: AuthAssurance;
}

export interface AuthProvider {
  readonly name: string;
  verifyCredential(input: CredentialInput): Promise<VerifiedIdentity | null>;
  assuranceOf(verified: VerifiedIdentity): AuthAssurance;
}

export interface MembershipSource {
  listForUser(userId: string): Promise<{ organizationId: string; role: string; status: string }[]>;
}

/** Build the application principal from a verified identity + memberships. */
export async function issuePrincipal(
  provider: AuthProvider,
  verified: VerifiedIdentity,
  source: MembershipSource,
  correlationId: string,
  sessionId?: string,
  assuranceOverride?: AuthAssurance
): Promise<AuthPrincipal> {
  const rows = await source.listForUser(verified.userId);
  return {
    kind: "human",
    subjectId: verified.userId,
    email: verified.email,
    sessionId,
    assurance: assuranceOverride ?? provider.assuranceOf(verified),
    memberships: rows.map((r) => ({
      organizationId: r.organizationId,
      role: r.role.toLowerCase(),
      status: (r.status === "active" ? "active" : r.status === "suspended" ? "suspended" : "removed") as
        "active" | "suspended" | "removed"
    })),
    correlationId
  };
}
