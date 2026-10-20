/** Phase 13 payment-provider boundary (provider-neutral, test-only by default).
 * Mirrors the Phase 12 seam: canonical domain never imports provider SDKs.
 * Only capability modelled is a deterministic TestPay adapter; live money
 * movement is NOT enabled (no live adapter registered).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { AppError } from "./errors.js";

export type ChargeOutcome = "succeeded" | "failed" | "requires_action";

export interface ChargeRequest {
  amountMinor: number;
  currency: string;
  providerCustomerId: string;
  invoiceId: string;
  idempotencyKey: string;
}

export interface ChargeResult {
  providerPaymentId: string;
  outcome: ChargeOutcome;
  failureCode: string | null;
  retryable: boolean;
}

export type BillingWebhookEvent =
  | { kind: "payment_succeeded"; providerPaymentId: string; invoiceId: string }
  | { kind: "payment_failed"; providerPaymentId: string; invoiceId: string; failureCode: string }
  | { kind: "unknown"; providerPaymentId: string; invoiceId: string };

export interface BillingProvider {
  readonly name: string;
  charge(req: ChargeRequest): Promise<ChargeResult>;
  verifyWebhookSignature(args: { rawBody: string; signatureHeader: string | null; secret: string }): boolean;
  parseWebhook(rawBody: string): { externalEventId: string; eventType: string; event: BillingWebhookEvent };
}

/** Deterministic test adapter. Outcome derives from the invoice id — no network. */
export class TestPayProvider implements BillingProvider {
  readonly name = "testpay";
  async charge(req: ChargeRequest): Promise<ChargeResult> {
    if (!Number.isInteger(req.amountMinor) || req.amountMinor < 0) {
      throw new AppError("VALIDATION_FAILED", "invalid amount", 422, false);
    }
    const id = `testpay_${req.invoiceId}_${req.amountMinor}`;
    // Deterministic: invoices ending in 'fail' fail transiently; all else succeeds.
    if (req.invoiceId.endsWith("fail")) {
      return { providerPaymentId: id, outcome: "failed", failureCode: "testpay_transient", retryable: true };
    }
    return { providerPaymentId: id, outcome: "succeeded", failureCode: null, retryable: false };
  }
  verifyWebhookSignature(args: { rawBody: string; signatureHeader: string | null; secret: string }): boolean {
    if (!args.signatureHeader || !args.secret) return false;
    const expected = createHmac("sha256", args.secret).update(args.rawBody).digest("hex");
    const a = Buffer.from(args.signatureHeader);
    const b = Buffer.from(`sha256=${expected}`);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }
  parseWebhook(rawBody: string): { externalEventId: string; eventType: string; event: BillingWebhookEvent } {
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      throw new AppError("VALIDATION_FAILED", "invalid webhook body", 422, false);
    }
    const externalEventId = String(body.eventId ?? "");
    const eventType = String(body.type ?? "");
    const providerPaymentId = String(body.paymentId ?? "");
    const invoiceId = String(body.invoiceId ?? "");
    if (!externalEventId || !eventType) throw new AppError("VALIDATION_FAILED", "webhook missing event id/type", 422, false);
    if (eventType === "payment.succeeded") {
      return { externalEventId, eventType, event: { kind: "payment_succeeded", providerPaymentId, invoiceId } };
    }
    if (eventType === "payment.failed") {
      return { externalEventId, eventType, event: { kind: "payment_failed", providerPaymentId, invoiceId, failureCode: String(body.failureCode ?? "unknown") } };
    }
    return { externalEventId, eventType, event: { kind: "unknown", providerPaymentId, invoiceId } };
  }
}

export function signTestWebhook(rawBody: string, secret: string): string {
  return `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
}

const registry = new Map<string, BillingProvider>([["testpay", new TestPayProvider()]]);

export function getBillingProvider(name: string): BillingProvider {
  const p = registry.get(name);
  if (!p) throw new AppError("VALIDATION_FAILED", `unsupported billing provider: ${name}`, 422, false);
  return p;
}
