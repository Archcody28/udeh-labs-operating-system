// Pure unit tests: no DB. Run: npm run build && node --test dist/tests/unit.test.js
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import "./ai.unit.test.js";
import "./engineeringExecution.unit.test.js";
import "./provider.unit.test.js";
import "./github.unit.test.js";
import { assertTransition, validateName } from "../domain/lifecycle.js";
import { toEnvelope, NotFoundError, ValidationError, AppError } from "../domain/errors.js";
import { hashPassword, verifyPassword, newOpaqueToken, sha256Hex } from "../domain/credentials.js";
import { anonymousPrincipal, isAuthenticated, membershipIn, toPublicPrincipal } from "../domain/principal.js";
import { permissionsFor, requirePermission, requireAssurance, requiresStepUp } from "../domain/authorization.js";
import { resolveTenantContext, assertWorkspaceInOrg, assertProjectInHierarchy } from "../domain/tenant.js";
import { RateLimiter } from "../domain/rateLimit.js";

describe("lifecycle", () => {
  it("allows valid workspace archive", () => assertTransition("workspace", "active", "archived"));
  it("rejects invalid transition with envelope fields", () => {
    assert.throws(() => assertTransition("approval", "approved", "denied"), /immutable|invalid transition/);
  });
  it("rejects blank names", () => {
    assert.throws(() => validateName("  "), (e: unknown) => e instanceof ValidationError);
  });
});

describe("errors", () => {
  it("maps NotFound to 404 envelope with correlation", () => {
    const { status, body } = toEnvelope(new NotFoundError("organizations"), "cid-1");
    assert.equal(status, 404);
    assert.equal(body.code, "NOT_FOUND");
    assert.equal(body.correlationId, "cid-1");
    assert.equal(body.retryable, false);
  });
  it("maps unknown to INTERNAL without leaking", () => {
    const { status, body } = toEnvelope(new Error("secret-token-abc"), "cid-2");
    assert.equal(status, 500);
    assert.equal(body.message, "internal error");
  });
});

describe("identity credentials", () => {
  it("hashes scrypt and verifies; wrong password fails", async () => {
    const hash = await hashPassword("correct-horse-12");
    assert.match(hash, /^scrypt\$16384\$/);
    assert.equal(await verifyPassword("correct-horse-12", hash), true);
    assert.equal(await verifyPassword("wrong-password-1", hash), false);
    assert.equal(await verifyPassword("x", "garbage"), false);
  });
  it("rejects short passwords at the boundary", async () => {
    await assert.rejects(() => hashPassword("short1"), (e: unknown) => e instanceof ValidationError);
  });
  it("opaque tokens are unique and hash-only comparable", () => {
    const a = newOpaqueToken();
    const b = newOpaqueToken();
    assert.notEqual(a.token, b.token);
    assert.equal(sha256Hex(a.token), a.tokenHash);
    assert.notEqual(a.tokenHash, b.tokenHash);
  });
});

describe("principal", () => {
  it("anonymous principal is unauthenticated", () => {
    const p = anonymousPrincipal("c");
    assert.equal(isAuthenticated(p), false);
    assert.equal(membershipIn(p, "org-1"), undefined);
  });
  it("public projection strips secrets", () => {
    const pub = toPublicPrincipal({
      kind: "human", subjectId: "u1", email: "a@b.c", assurance: "password",
      memberships: [{ organizationId: "o1", role: "owner", status: "active" }], correlationId: "c"
    });
    const json = JSON.stringify(pub);
    assert.ok(!/password_hash|token_hash|tokenHash|secret|accessToken/i.test(json));
    assert.ok(!("password_hash" in pub) && !("token" in pub));
    assert.equal((pub.organizations as { role: string }[])[0].role, "owner");
  });
});

describe("authorization", () => {
  const owner = {
    kind: "human" as const, subjectId: "u1", assurance: "password" as const,
    memberships: [{ organizationId: "o1", role: "owner", status: "active" as const }], correlationId: "c"
  };
  const client = {
    kind: "human" as const, subjectId: "u2", assurance: "password" as const,
    memberships: [{ organizationId: "o1", role: "client", status: "active" as const }], correlationId: "c"
  };
  it("owner holds member.manage; client does not", () => {
    assert.ok(permissionsFor("owner").includes("member.manage"));
    assert.ok(!permissionsFor("client").includes("member.manage"));
  });
  it("authenticated-but-unauthorized gets 403, anonymous gets 401", () => {
    assert.throws(() => requirePermission(client, "o1", "member.manage"),
      (e: unknown) => e instanceof AppError && (e as AppError).httpStatus === 403);
    assert.throws(() => requirePermission(anonymousPrincipal("c"), "o1", "member.read"),
      (e: unknown) => e instanceof AppError && (e as AppError).httpStatus === 401);
    requirePermission(owner, "o1", "member.manage");
  });
  it("cross-org membership does not authorize", () => {
    assert.throws(() => requirePermission(owner, "other-org", "org.read"),
      (e: unknown) => e instanceof AppError && (e as AppError).httpStatus === 403);
  });
  it("step-up required for high-risk actions only", () => {
    assert.equal(requiresStepUp("deployment.trigger"), true);
    assert.equal(requiresStepUp("project.read"), false);
    assert.throws(() => requireAssurance(owner, "deployment.trigger"),
      (e: unknown) => e instanceof AppError && (e as AppError).httpStatus === 403);
    requireAssurance({ ...owner, assurance: "stepped-up" }, "deployment.trigger");
  });
});

describe("tenant resolution", () => {
  const member = {
    kind: "human" as const, subjectId: "u1", assurance: "password" as const,
    memberships: [{ organizationId: "o1", role: "developer", status: "active" as const }], correlationId: "c"
  };
  it("resolves server context for members; spoofed org rejected", () => {
    const ctx = resolveTenantContext(member, "o1", "c");
    assert.equal(ctx.organizationId, "o1");
    assert.equal(ctx.actorId, "u1");
    assert.throws(() => resolveTenantContext(member, "evil-org", "c"),
      (e: unknown) => e instanceof AppError && (e as AppError).httpStatus === 403);
  });
  it("anonymous cannot resolve any tenant", () => {
    assert.throws(() => resolveTenantContext(anonymousPrincipal("c"), "o1", "c"),
      (e: unknown) => e instanceof AppError && (e as AppError).httpStatus === 401);
  });
  it("workspace/project hierarchy enforced", () => {
    assert.throws(() => assertWorkspaceInOrg("org-B", "org-A"),
      (e: unknown) => e instanceof AppError && (e as AppError).httpStatus === 403);
    assert.throws(() => assertProjectInHierarchy({ organization_id: "org-B", workspace_id: "w1" }, "org-A", "w1"),
      (e: unknown) => e instanceof AppError && (e as AppError).httpStatus === 403);
    assert.throws(() => assertProjectInHierarchy({ organization_id: "org-A", workspace_id: "w2" }, "org-A", "w1"),
      (e: unknown) => e instanceof AppError && (e as AppError).httpStatus === 403);
    assertWorkspaceInOrg("org-A", "org-A");
  });
});

describe("rate limiter", () => {
  it("caps attempts within the window", () => {
    const rl = new RateLimiter(3, 60_000);
    assert.equal(rl.attempt("k"), true);
    assert.equal(rl.attempt("k"), true);
    assert.equal(rl.attempt("k"), true);
    assert.equal(rl.attempt("k"), false);
    assert.equal(rl.attempt("other"), true);
  });
});
