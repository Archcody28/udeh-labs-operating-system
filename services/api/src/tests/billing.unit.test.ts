// Billing domain unit tests: no DB. Transitions, money math, entitlements.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertSubscriptionTransition, assertInvoiceTransition, assertPaymentTransition,
  lineTotal, invoiceTotal, decideEntitlement, validateCurrency, parseFeatures,
} from "../domain/billing.js";
import { assertTransition } from "../domain/lifecycle.js";

describe("billing subscription lifecycle", () => {
  it("trialing -> active -> past_due -> active -> canceled", () => {
    assertSubscriptionTransition("trialing", "active");
    assertSubscriptionTransition("active", "past_due");
    assertSubscriptionTransition("past_due", "active");
    assertSubscriptionTransition("active", "canceled");
    assertTransition("billing_subscription", "trialing", "active");
  });
  it("rejects canceled -> active and trialing -> paid", () => {
    assert.throws(() => assertSubscriptionTransition("canceled", "active"), /invalid transition/);
    assert.throws(() => assertSubscriptionTransition("trialing", "paid"), /invalid transition/);
  });
});

describe("billing invoice lifecycle", () => {
  it("draft -> open -> paid -> refunded", () => {
    assertInvoiceTransition("draft", "open");
    assertInvoiceTransition("open", "paid");
    assertInvoiceTransition("paid", "refunded");
    assertTransition("billing_invoice", "draft", "open");
  });
  it("rejects draft -> paid and paid -> void; void terminal", () => {
    assert.throws(() => assertInvoiceTransition("draft", "paid"), /invalid transition/);
    assert.throws(() => assertInvoiceTransition("paid", "void"), /invalid transition/);
    assert.throws(() => assertInvoiceTransition("void", "open"), /invalid transition/);
  });
});

describe("billing payment lifecycle", () => {
  it("pending -> succeeded terminal; failed may retry to pending", () => {
    assertPaymentTransition("pending", "succeeded");
    assertPaymentTransition("pending", "failed");
    assertPaymentTransition("failed", "pending");
    assertTransition("billing_payment", "pending", "succeeded");
  });
  it("rejects succeeded -> pending (no double-settle)", () => {
    assert.throws(() => assertPaymentTransition("succeeded", "pending"), /invalid transition/);
  });
});

describe("billing money math (integer minor units)", () => {
  it("line totals and invoice totals are integer-only", () => {
    assert.equal(lineTotal(3, 4900), 14700);
    const t = invoiceTotal([{ quantity: 2, unitAmountMinor: 4900 }, { quantity: 1, unitAmountMinor: 100 }], 50);
    assert.deepEqual(t, { subtotal: 9900, tax: 50, total: 9950 });
  });
  it("rejects fractional quantities and amounts", () => {
    assert.throws(() => lineTotal(1.5, 100), /positive integer/);
    assert.throws(() => lineTotal(1, 10.5), /non-negative integer/);
    assert.throws(() => invoiceTotal([{ quantity: 1, unitAmountMinor: 100 }], 1.5), /non-negative integer/);
  });
  it("validates ISO currency codes", () => {
    validateCurrency("USD");
    assert.throws(() => validateCurrency("usd"), /ISO 4217/);
  });
});

describe("billing entitlements (server-side decision)", () => {
  it("allows active/granted under cap; denies past_due, revoked, exhausted", () => {
    assert.deepEqual(
      decideEntitlement({ subscriptionStatus: "active", entitlementStatus: "granted", limit: 100, used: 10 }),
      { allowed: true, reason: "allowed" });
    assert.equal(decideEntitlement({ subscriptionStatus: "past_due", entitlementStatus: "granted", limit: 100, used: 1 }).allowed, false);
    assert.equal(decideEntitlement({ subscriptionStatus: "active", entitlementStatus: "revoked", limit: 100, used: 1 }).allowed, false);
    assert.deepEqual(
      decideEntitlement({ subscriptionStatus: "active", entitlementStatus: "granted", limit: 5, used: 5 }),
      { allowed: false, reason: "limit-exceeded" });
  });
  it("parses plan features to integer caps only", () => {
    assert.deepEqual(parseFeatures({ seats: 5, bad: 1.5, s: "x" }), { seats: 5 });
  });
});

describe("billing provider boundary (TestPay)", () => {
  it("registered as testpay; unknown providers fail closed", async () => {
    const { TestPayProvider, signTestWebhook, getBillingProvider } = await import("../domain/billingProvider.js");
    const p = getBillingProvider("testpay");
    assert.equal(p.name, "testpay");
    assert.throws(() => getBillingProvider("stripe-live"), /unsupported/);
    const ok = await new TestPayProvider().charge({ amountMinor: 100, currency: "USD", providerCustomerId: "c", invoiceId: "inv-1", idempotencyKey: "k" });
    assert.equal(ok.outcome, "succeeded");
    assert.ok(!/sk-|secret/i.test(JSON.stringify(ok)));
    const sec = "whsec-test-123";
    const raw = JSON.stringify({ eventId: "evt-1", type: "payment.succeeded", paymentId: "p", invoiceId: "i" });
    const sig = signTestWebhook(raw, sec);
    assert.equal(p.verifyWebhookSignature({ rawBody: raw, signatureHeader: sig, secret: sec }), true);
    assert.equal(p.verifyWebhookSignature({ rawBody: raw + "x", signatureHeader: sig, secret: sec }), false);
    assert.equal(p.verifyWebhookSignature({ rawBody: raw, signatureHeader: null, secret: sec }), false);
  });
});

describe("billing authorization", () => {
  it("role matrix and step-up boundaries", async () => {
    const { permissionsFor, requiresStepUp } = await import("../domain/authorization.js");
    assert.ok(permissionsFor("owner").includes("billing.admin"));
    assert.ok(!permissionsFor("developer").includes("billing.subscription.manage"));
    assert.ok(!permissionsFor("developer").includes("billing.invoice.manage"));
    assert.ok(permissionsFor("manager").includes("billing.subscription.manage"));
    assert.ok(permissionsFor("auditor").includes("billing.invoice.read"));
    assert.ok(!permissionsFor("auditor").includes("billing.invoice.manage"));
    assert.equal(requiresStepUp("billing.subscription.manage"), true);
    assert.equal(requiresStepUp("billing.invoice.manage"), true);
    assert.equal(requiresStepUp("billing.payment.manage"), true);
    assert.equal(requiresStepUp("billing.invoice.read"), false);
  });
});