/** Local password provider — the Phase 6 AuthProvider (ADR 0013). */
import { AuthProvider, CredentialInput, VerifiedIdentity } from "./provider.js";
import { hashPassword, validateEmail, validatePasswordPolicy, verifyPassword } from "../domain/credentials.js";

export interface LocalUserLookup {
  findByEmail(email: string): Promise<{ id: string; email: string | null; status: string; password_hash: string | null } | null>;
}

export class LocalPasswordProvider implements AuthProvider {
  readonly name = "local-password";
  constructor(private users: LocalUserLookup) {}

  async verifyCredential(input: CredentialInput): Promise<VerifiedIdentity | null> {
    const email = validateEmail(input.email);
    const row = await this.users.findByEmail(email);
    // Constant response: missing user or missing hash still costs a verify-shaped path.
    if (!row || row.status !== "active" || !row.password_hash || !row.email) {
      await verifyPassword("dummy-padding-value", "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==").catch(() => false);
      return null;
    }
    const ok = await verifyPassword(input.password, row.password_hash);
    if (!ok) return null;
    return { userId: row.id, email: row.email, assurance: "password" };
  }

  assuranceOf(verified: VerifiedIdentity) {
    return verified.assurance;
  }

  async createCredentialHash(password: string): Promise<string> {
    validatePasswordPolicy(password);
    return hashPassword(password);
  }
}
