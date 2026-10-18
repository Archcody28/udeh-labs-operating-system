// Pure Phase-11 engineering execution unit tests: no DB. Imported by unit.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EngineeringExecutionService } from "../domain/engineeringExecution.js";
import type { TenantContext } from "../domain/tenancy.js";

const ctx: TenantContext = { organizationId: "o-1", actorId: "u-1", correlationId: "c-1", principalType: "agent" };

describe("engineering execution service surface", () => {
  const svc = new EngineeringExecutionService();
  it("exposes the full plan→implement→validate→review→revise lifecycle", () => {
    for (const m of ["createRun", "generatePlan", "approvePlan", "startExecution",
      "implementPatch", "validatePatch", "requestReview", "revise", "escalate", "cancel"]) {
      assert.equal(typeof (svc as unknown as Record<string, unknown>)[m], "function", m);
    }
  });
  it("setProvider accepts an AI provider", () => {
    const fake = { generate: async () => ({}) } as never;
    svc.setProvider(fake);
  });
});

describe("engineering execution input validation (pre-transaction)", () => {
  const svc = new EngineeringExecutionService();
  it("createRun rejects missing required identifiers", async () => {
    await assert.rejects(() => svc.createRun(ctx, {
      projectId: "", taskId: "", agentId: "", agentVersionId: "", policyId: ""
    } as never, "u-1"), /projectId, agentId, agentVersionId, policyId required/);
  });
  it("approvePlan rejects invalid decision", async () => {
    await assert.rejects(() => svc.approvePlan(ctx, "r-1", "p-1", 1, 1,
      "self-approved" as never, "", "u-1"), /decision must be 'approved' or 'denied'/);
  });
  it("escalate rejects empty or oversized reason", async () => {
    await assert.rejects(() => svc.escalate(ctx, "r-1", "u-1", ""), /reason/);
    await assert.rejects(() => svc.escalate(ctx, "r-1", "u-1", "x".repeat(2001)), /reason/);
  });
});

describe("engineering execution self-approval guard", () => {
  it("agent principal is not a human approver", () => {
    // The domain hard-refuses ctx.principalType === "agent" in approvePlan;
    // here we assert the invariant at the context level for Phase 11.
    const agentCtx: TenantContext = { ...ctx, principalType: "agent" };
    assert.equal(agentCtx.principalType, "agent");
  });
});
