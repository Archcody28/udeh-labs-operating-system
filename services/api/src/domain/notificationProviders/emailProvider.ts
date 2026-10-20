/**
 * Email provider seam (Phase 14). Provider-neutral: no SendGrid/Resend/SES
 * types leak in. Credentials are resolved by REFERENCE through the existing
 * SecretVault — never stored in rows, code, logs, or payloads. With no
 * credential configured the provider reports unavailable and the dispatcher
 * skips email (in-app still delivers), so CI and local runs never need real
 * email credentials.
 *
 * A future production adapter (SendGrid/Resend/etc.) replaces the body of
 * `send` and keeps this contract; nothing in the core changes.
 */
import {
  NotificationProvider, NotifyProviderError, NotifyRequest, NotifyResult,
} from "../notificationProvider.js";
import { NotificationChannel } from "../notificationChannels.js";
import { secretVault } from "../integrationSecrets.js";

/** SecretVault reference for the email provider credential (by reference only). */
export const EMAIL_CREDENTIAL_REF = "notification:email:provider-credential";

/** Outbound transport a concrete adapter implements. Injectable for tests. */
export interface EmailTransport {
  /** Must return a provider message id on success or throw NotifyProviderError. */
  send(args: {
    to: string; subject: string; text: string;
    idempotencyKey: string; credential: string;
  }): Promise<{ providerMessageId: string }>;
}

export class EmailProvider implements NotificationProvider {
  readonly name = "email";
  readonly channel: NotificationChannel = "email";

  constructor(private transport: EmailTransport | null = null) {}

  async isAvailable(): Promise<boolean> {
    // Available only when a credential reference resolves AND a transport is wired.
    return this.transport !== null && (await secretVault().get(EMAIL_CREDENTIAL_REF)) !== null;
  }

  async send(req: NotifyRequest): Promise<NotifyResult> {
    if (!req.recipient.address) {
      throw new NotifyProviderError({
        provider: this.name, failure: "invalid_recipient",
        message: "recipient has no email address",
      });
    }
    const credential = await secretVault().get(EMAIL_CREDENTIAL_REF);
    if (!credential) {
      throw new NotifyProviderError({
        provider: this.name, failure: "provider_unavailable",
        message: "email provider credential not configured",
      });
    }
    if (!this.transport) {
      throw new NotifyProviderError({
        provider: this.name, failure: "provider_unavailable",
        message: "email transport not configured",
      });
    }
    try {
      const out = await this.transport.send({
        to: req.recipient.address,
        subject: req.subject,
        text: req.bodyText,
        idempotencyKey: req.idempotencyKey,
        credential,
      });
      return { providerMessageId: out.providerMessageId, accepted: true };
    } catch (err) {
      // Never let a raw transport error escape the seam.
      if (err instanceof NotifyProviderError) throw err;
      throw new NotifyProviderError({
        provider: this.name, failure: "retryable_transport",
        message: "email transport failure", retryable: true,
      });
    }
  }
}
