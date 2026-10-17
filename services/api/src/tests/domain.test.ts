// Phase 8 domain unit tests: pure, no DB.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assertTransition } from "../domain/lifecycle.js";
import { permissionsFor, requiresStepUp } from "../domain/authorization.js";

describe("phase8 lifecycles", () => {
  it("client request flows submitted->elaborated->closed", () => {
    assertTransition("client_request", "submitted", "elaborated");
    assertTransition("client_request", "elaborated", "closed");
    assert.throws(() => assertTransition("client_request", "submitted", "closed"));
  });
  it("requirement draft->accepted only", () => {
    assertTransition("requirement", "draft", "accepted");
    assert.throws(() => assertTransition("requirement", "accepted", "draft"));
  });
  it("proposal version draft->sent->approved", () => {
    assertTransition("proposal_version", "draft", "sent");
    assert.throws(() => assertTransition("proposal_version", "draft", "approved"));
  });
  it("contract ready->signed->active", () => {
    assertTransition("contract", "ready", "signed");
    assertTransition("contract", "signed", "active");
    assert.throws(() => assertTransition("contract", "ready", "active"));
  });
  it("rejects raw terminal transitions", () => {
    assert.throws(() => assertTransition("proposal", "approved", "draft"));
    assert.throws(() => assertTransition("engineering_task", "done", "planned"));
  });
});

describe("phase8 authorization", () => {
  it("developer cannot accept proposals; manager can", () => {
    assert.ok(!permissionsFor("developer").includes("commercial.proposal.accept"));
    assert.ok(permissionsFor("manager").includes("commercial.proposal.accept"));
  });
  it("client is read-only commercial", () => {
    assert.ok(permissionsFor("client").includes("commercial.proposal.read"));
    assert.ok(!permissionsFor("client").includes("commercial.proposal.create"));
  });
  it("commercial accept/sign/convert require step-up", () => {
    assert.equal(requiresStepUp("commercial.proposal.accept"), true);
    assert.equal(requiresStepUp("commercial.contract.sign"), true);
    assert.equal(requiresStepUp("commercial.contract.activate"), true);
  });
});
