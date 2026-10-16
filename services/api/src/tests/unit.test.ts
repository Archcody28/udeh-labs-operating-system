// Pure unit tests: no DB. Run: npm run build && node --test dist/tests/unit.test.js
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assertTransition, validateName } from "../domain/lifecycle.js";
import { toEnvelope, NotFoundError, ValidationError } from "../domain/errors.js";

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
