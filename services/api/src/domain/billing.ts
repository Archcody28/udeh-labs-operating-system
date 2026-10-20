/** Billing lifecycle: plans, subscriptions, invoices, payments (Phase 13).
 * Money in integer minor units only. Status strings are closed sets here
 * and mirrored by DB CHECK constraints in 021_billing.sql.
 */
import { StateTransitionError, ValidationError } from "./errors.js";

export const BillingSubscriptionStatus = ["trialing", "active", "past_due", "canceled"] as const;
export const BillingInvoiceStatus = ["draft", "open", "paid", "void", "refunded"] as const;
export const BillingPaymentStatus = ["pending", "succeeded", "failed", "canceled"] as const;

export function assertSubscriptionTransition(from: string, to: string): void {
  const allowed: Record<string, string[]> = {
    trialing: ["active", "canceled"],
    active: ["past_due", "canceled"],
    past_due: ["active", "canceled"],
    canceled: [],
  };
  if (!(allowed[from] ?? []).includes(to)) throw new StateTransitionError(from, allowed[from] ?? []);
}

export function assertInvoiceTransition(from: string, to: string): void {
  const allowed: Record<string, string[]> = {
    draft: ["open", "void"],
    open: ["paid", "void"],
    paid: ["refunded"],
    void: [],
    refunded: [],
  };
  if (!(allowed[from] ?? []).includes(to)) throw new StateTransitionError(from, allowed[from] ?? []);
}

export function assertPaymentTransition(from: string, to: string): void {
  const allowed: Record<string, string[]> = {
    pending: ["succeeded", "failed", "canceled"],
    failed: ["pending"],
    succeeded: [],
    canceled: [],
  };
  if (!(allowed[from] ?? []).includes(to)) throw new StateTransitionError(from, allowed[from] ?? []);
}

/** Integer-only money math. All inputs/outputs are minor units (cents). */
export function lineTotal(quantity: number, unitAmountMinor: number): number {
  if (!Number.isInteger(quantity) || quantity <= 0) throw new ValidationError("quantity must be a positive integer");
  if (!Number.isInteger(unitAmountMinor) || unitAmountMinor < 0) throw new ValidationError("unit amount must be a non-negative integer");
  return quantity * unitAmountMinor;
}

export function invoiceTotal(lines: { quantity: number; unitAmountMinor: number }[], taxMinor: number): { subtotal: number; tax: number; total: number } {
  if (!Number.isInteger(taxMinor) || taxMinor < 0) throw new ValidationError("tax must be a non-negative integer");
  let subtotal = 0;
  for (const l of lines) subtotal += lineTotal(l.quantity, l.unitAmountMinor);
  return { subtotal, tax: taxMinor, total: subtotal + taxMinor };
}

export function parseFeatures(features: unknown): Record<string, number> {
  if (!features || typeof features !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(features as Record<string, unknown>)) {
    if (typeof v === "number" && Number.isInteger(v) && v >= 0) out[k] = v;
  }
  return out;
}

/** Server-side entitlement decision: subscription must be usable, feature
 * granted, and (when limited) usage within the cap. Never trust client claims. */
export function decideEntitlement(args: {
  subscriptionStatus: string;
  entitlementStatus: string;
  limit: number | null;
  used: number;
}): { allowed: boolean; reason: string } {
  if (args.subscriptionStatus !== "active" && args.subscriptionStatus !== "trialing") {
    return { allowed: false, reason: `subscription-${args.subscriptionStatus}` };
  }
  if (args.entitlementStatus !== "granted") return { allowed: false, reason: `entitlement-${args.entitlementStatus}` };
  if (args.limit !== null && args.limit >= 0 && args.used >= args.limit) {
    return { allowed: false, reason: "limit-exceeded" };
  }
  return { allowed: true, reason: "allowed" };
}

export function validateCurrency(currency: string): void {
  if (!/^[A-Z]{3}$/.test(currency)) throw new ValidationError("currency must be ISO 4217 (3 uppercase letters)");
}
