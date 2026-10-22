/**
 * Deterministic in-app notification provider (Phase 14).
 *
 * The in-app channel is "delivered" the moment the notification row exists —
 * no external network. This provider exists so the full pipeline (claim →
 * provider → operation ledger → completion) is exercised uniformly and is the
 * DEFAULT provider in CI. It never requires credentials.
 */
import {
  NotificationProvider, NotifyProviderError, NotifyRequest, NotifyResult,
} from "../notificationProvider.ts";
import { NotificationChannel } from "../notificationChannels.ts";

export class InAppProvider implements NotificationProvider {
  readonly name = "in_app";
  readonly channel: NotificationChannel = "in_app";

  async send(req: NotifyRequest): Promise<NotifyResult> {
    if (!req.recipient.userId) {
      throw new NotifyProviderError({
        provider: this.name, failure: "invalid_recipient", message: "in-app recipient missing",
      });
    }
    // Deterministic message id derived from the idempotency key — a replayed
    // delivery attempt yields the same id, so consumers can dedupe.
    return { providerMessageId: `inapp:${req.idempotencyKey}`, accepted: true };
  }

  async isAvailable(): Promise<boolean> {
    return true; // never requires credentials
  }
}
