import { createHash } from "node:crypto";
import { UserRepository } from "../persistence/userRepository.js";
import { SessionRepository } from "../persistence/sessionRepository.js";
import { MembershipRepository } from "../persistence/membershipRepository.js";
import { InvitationRepository } from "../persistence/invitationRepository.js";
import { AuditRepository } from "../persistence/auditRepository.js";
import { OrganizationRepository } from "../persistence/tenancyRepositories.js";
import { withTransaction } from "../persistence/db.js";
import { hashPassword, newOpaqueToken, sha256Hex } from "../domain/credentials.js";
import { validatePasswordPolicy, validateEmail, verifyPassword } from "../domain/credentials.js";
import { AuthPrincipal } from "../domain/principal.js";
import { ForbiddenError, UnauthorizedError } from "../domain/authorization.js";
import { normalizeRole, requirePermission } from "../domain/authorization.js";
import { LocalPasswordProvider } from "./localProvider.js";
import { issuePrincipal } from "./provider.js";
import { ValidationError } from "../domain/errors.js";
import { validateName } from "../domain/lifecycle.js";

const GENERIC_FAILURE = "invalid email or password";

export class AuthService {
  private users = new UserRepository();
  private sessions = new SessionRepository();
  private memberships = new MembershipRepository();
  private invitations = new InvitationRepository();
  private audits = new AuditRepository();
  private orgs = new OrganizationRepository();
  private bootstrapOrg: { id: string } | null = null;

  async register(email: string, password: string, displayName: string, correlationId: string) {
    const clean = validateEmail(email);
    validatePasswordPolicy(password);
    validateName(displayName, "display_name");
    const existing = await this.users.findByEmail(clean);
    if (existing) throw new ValidationError("email already registered", [{ field: "email", issue: "taken" }]);
    const user = await this.users.create(clean, displayName, await hashPassword(password));
    await this.audits.append(
      { organizationId: (await this.ensureBootstrapOrg()).id, actorId: user.id, principalType: "human", correlationId },
      "auth.register", "user", user.id, "success", {});
    return { id: user.id, email: clean, displayName: user.display_name };
  }

  async login(email: string, password: string, correlationId: string, meta: { userAgent?: string; ip?: string } = {}) {
    const provider = new LocalPasswordProvider(this.users);
    let clean = "";
    try {
      clean = validateEmail(email);
    } catch {
      await this.auditLogin(null, correlationId, "failed");
      throw new UnauthorizedError(GENERIC_FAILURE);
    }
    const verified = await provider.verifyCredential({ email: clean, password });
    if (!verified) {
      await this.auditLogin(null, correlationId, "failed");
      throw new UnauthorizedError(GENERIC_FAILURE);
    }
    const pair = newOpaqueToken();
    const session = await this.sessions.create(verified.userId, pair.tokenHash, {
      userAgent: meta.userAgent?.slice(0, 300),
      ipHash: meta.ip ? createHash("sha256").update(meta.ip).digest("hex") : undefined
    });
    const principal = await issuePrincipal(provider, verified,
      { listForUser: (uid) => this.membershipRows(uid) }, correlationId, session.id);
    await this.audits.append(
      { organizationId: await this.actorOrgScope(verified.userId), actorId: verified.userId, principalType: "human", correlationId },
      "auth.login", "session", session.id, "success", {});
    return { token: pair.token, sessionId: session.id, principal };
  }

  async principalForToken(token: string, correlationId: string): Promise<AuthPrincipal | null> {
    if (!token || token.length < 20) return null;
    const row = await this.sessions.findActiveByTokenHash(sha256Hex(token));
    if (!row) return null;
    const user = await this.users.findById(row.user_id);
    if (!user || user.status !== "active") return null;
    await this.sessions.touch(row.id);
    const provider = new LocalPasswordProvider(this.users);
    const assurance = row.assurance as "password" | "stepped-up";
    return issuePrincipal(provider,
      { userId: user.id, email: user.email ?? "", assurance },
      { listForUser: (uid) => this.membershipRows(uid) }, correlationId, row.id, assurance);
  }

  async logout(token: string, correlationId: string): Promise<void> {
    const row = await this.sessions.findActiveByTokenHash(sha256Hex(token)).catch(() => null);
    if (row) {
      await this.sessions.revoke(row.id);
      await this.audits.append(
        { organizationId: await this.actorOrgScope(row.user_id), actorId: row.user_id, principalType: "human", correlationId },
        "auth.logout", "session", row.id, "success", {});
    }
  }

  async rotate(token: string): Promise<string> {
    const row = await this.sessions.findActiveByTokenHash(sha256Hex(token));
    if (!row) throw new UnauthorizedError("session expired");
    const next = newOpaqueToken();
    await this.sessions.rotate(row.id, next.tokenHash);
    return next.token;
  }

  async createOrganization(principal: AuthPrincipal, name: string, slug: string, correlationId: string) {
    if (principal.assurance === "none" || !principal.subjectId) throw new UnauthorizedError();
    const result = await this.orgs.createWithPrimaryWorkspace(
      name.trim(), slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-"));
    await this.memberships.upsertActive(
      { organizationId: result.org.id, correlationId } as never,
      principal.subjectId, "owner", principal.subjectId);
    await this.audits.append(
      { organizationId: result.org.id, actorId: principal.subjectId, principalType: "human", correlationId },
      "organization.created", "organization", result.org.id, "success", { slug: result.org.slug });
    return result;
  }

  async invite(principal: AuthPrincipal, organizationId: string, email: string, role: string, correlationId: string) {
    requirePermission(principal, organizationId, "invitation.create");
    const pair = newOpaqueToken();
    const row = await this.invitations.create(
      { organizationId, correlationId } as never, email, normalizeRole(role), pair.tokenHash, 72, principal.subjectId);
    await this.audits.append(
      { organizationId, actorId: principal.subjectId, principalType: "human", correlationId },
      "invitation.created", "invitation", row.id, "success", { role: row.role });
    return { invitationId: row.id, token: pair.token };
  }

  async acceptInvitation(token: string, password: string, displayName: string, correlationId: string) {
    const row = await this.invitations.findActiveByTokenHash(sha256Hex(token));
    if (!row) throw new ForbiddenError("invitation invalid or expired");
    let user = await this.users.findByEmail(row.email);
    if (!user) {
      validatePasswordPolicy(password);
      const created = await this.users.create(row.email, displayName || row.email, await hashPassword(password));
      user = { ...created, password_hash: "set" };
    } else if (user.status !== "active") {
      throw new ForbiddenError("invitation invalid or expired");
    }
    const userId = user.id as string;
    await withTransaction(async (tx) => {
      await this.invitations.accept(row.id, userId, row.version, tx);
      await this.memberships.upsertActive(
        { organizationId: row.organization_id, correlationId } as never, userId, row.role, userId, tx);
    });
    await this.verifyPasswordCheck(userId, password).catch(() => undefined);
    await this.audits.append(
      { organizationId: row.organization_id, actorId: userId, principalType: "human", correlationId },
      "invitation.accepted", "invitation", row.id, "success", { role: row.role });
    return this.login(row.email, password, correlationId);
  }

  private async membershipRows(userId: string) {
    const rows = await this.memberships.listForUser(userId);
    return rows.filter((r) => r.status === "active")
      .map((r) => ({ organizationId: r.organization_id, role: r.role, status: r.status }));
  }

  private async actorOrgScope(userId: string): Promise<string> {
    const rows = await this.memberships.listForUser(userId);
    if (rows[0]) return rows[0].organization_id;
    return (await this.ensureBootstrapOrg()).id;
  }

  private async ensureBootstrapOrg(): Promise<{ id: string }> {
    if (this.bootstrapOrg) return this.bootstrapOrg;
    const { getPool } = await import("../persistence/db.js");
    const res = await getPool().query("SELECT id FROM organizations ORDER BY created_at LIMIT 1");
    if (res.rowCount) {
      this.bootstrapOrg = { id: res.rows[0].id as string };
      return this.bootstrapOrg;
    }
    const created = await this.orgs.create("Identity Bootstrap Org", "identity-bootstrap");
    this.bootstrapOrg = { id: created.id };
    return this.bootstrapOrg;
  }

  private async verifyPasswordCheck(userId: string, password: string): Promise<void> {
    const { getPool } = await import("../persistence/db.js");
    const res = await getPool().query("SELECT password_hash FROM user_credentials WHERE user_id = $1", [userId]);
    const hash = res.rows[0]?.password_hash as string | undefined;
    if (hash && hash !== "set" && !(await verifyPassword(password, hash))) {
      throw new UnauthorizedError(GENERIC_FAILURE);
    }
  }

  private async auditLogin(userId: string | null, correlationId: string, result: "success" | "failed" | "denied") {
    try {
      const orgId = userId ? await this.actorOrgScope(userId) : (await this.ensureBootstrapOrg()).id;
      await this.audits.append(
        { organizationId: orgId, actorId: userId ?? undefined, principalType: "human", correlationId },
        "auth.login", "session", userId ?? "unknown", result, {});
    } catch { /* audit must never break the auth response */ }
  }
}
