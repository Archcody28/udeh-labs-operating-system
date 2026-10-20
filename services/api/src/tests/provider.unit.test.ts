// Pure Phase-12 provider seam tests: no DB, no live GitHub.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ProviderError, providerRetryPolicy, registerProvider, getProvider, clearProvidersForTests } from "../domain/integrationProvider.js";
import { classifyOperationRetry, assertIntegrationTransition } from "../domain/integration.js";
import { sanitizeForAudit } from "../domain/integrationSecrets.js";
import { permissionsFor } from "../domain/authorization.js";

describe("provider seam", () => {
  it("unknown provider fails closed", () => {
    clearProvidersForTests();
    assert.throws(() => getProvider("nope"), (e: unknown) => e instanceof ProviderError);
  });
  it("retry never auto-retries side effects", () => {
    assert.deepEqual(providerRetryPolicy({ failure: "rate_limited", sideEffecting: true, idempotent: false, attempt: 0 }), { retry: false, backoffMs: 0 });
    assert.equal(providerRetryPolicy({ failure: "rate_limited", sideEffecting: false, idempotent: true, attempt: 0 }).retry, true);
    assert.equal(providerRetryPolicy({ failure: "authentication_failed", sideEffecting: false, idempotent: true, attempt: 0 }).retry, false);
  });
  it("operation retry is conservative", () => {
    assert.equal(classifyOperationRetry({ operationType: "push", retryable: true }).maxRetries, 1);
    assert.equal(classifyOperationRetry({ operationType: "list-repos", retryable: true }).retryClass, "safe");
  });
  it("lifecycle enforced", () => {
    assertIntegrationTransition("pending", "connected");
    assert.throws(() => assertIntegrationTransition("revoked", "active"));
  });
  it("owner integrates, client cannot", () => {
    assert.ok(permissionsFor("owner").includes("integration.connect"));
    assert.ok(!permissionsFor("client").includes("integration.connect"));
  });
  it("audit sanitizer redacts", () => {
    const out = JSON.stringify(sanitizeForAudit({ token: "abc", ok: "fine" }));
    assert.ok(!out.includes("abc") && out.includes("fine"));
  });
  it("registry round-trips", () => {
    clearProvidersForTests();
    const fake = { name: "fake" } as never;
    registerProvider(fake);
    assert.equal(getProvider("fake"), fake);
    clearProvidersForTests();
  });
});
