/**
 * Notification provider bootstrap (Phase 14).
 *
 * Registers the deterministic in-app provider ALWAYS (it needs no
 * credentials, so CI and local runs work out of the box) and the email
 * provider only when an outbound transport has been wired.
 *
 * The email seam is deliberately transport-free in the core: an operator
 * supplies a transport via `setEmailTransport` at composition time. Without
 * one, email routes are created with the `unconfigured` provider and are
 * terminal-dead-lettered by the dispatcher rather than silently dropped.
 */
import { registerNotificationProvider, setChannelDefault } from "./notificationProvider.ts";
import { InAppProvider } from "./notificationProviders/inAppProvider.ts";
import { EmailProvider, EmailTransport } from "./notificationProviders/emailProvider.ts";

let emailTransport: EmailTransport | null = null;
let booted = false;

/** Wire the outbound email transport (composition-time injection). */
export function setEmailTransport(transport: EmailTransport | null): void {
  emailTransport = transport;
  registerNotificationProvider(new EmailProvider(emailTransport));
}

export function currentEmailTransport(): EmailTransport | null {
  return emailTransport;
}

/**
 * Idempotently register the notification providers. Safe to call from every
 * process start and from tests (the registry is keyed by provider name).
 */
export function bootstrapNotificationProviders(): void {
  if (booted) return;
  booted = true;
  registerNotificationProvider(new InAppProvider());
  registerNotificationProvider(new EmailProvider(emailTransport));
  setChannelDefault("in_app", "in_app");
  // The email default is the provider NAME; it stays mapped even when no
  // transport is wired so the dispatcher can record the terminal condition.
  setChannelDefault("email", "email");
}

/** Reset the bootstrap guard (tests only). */
export function resetNotificationBootstrapForTests(): void {
  booted = false;
  emailTransport = null;
}
