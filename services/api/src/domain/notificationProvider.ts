/**
 * Phase 14 provider-neutral notification seam.
 *
 * The core notification system MUST NOT import SendGrid/Resend/Twilio/etc.
 * Provider-specific request/response shapes live inside adapters under
 * notificationProviders/. Unknown providers fail closed via the registry.
 *
 * Failure taxonomy mirrors the integration ProviderError pattern (ADR 0020):
 * no raw provider internals escape the adapter boundary.
 */
import { AppError } from "./errors.ts";
import { NotificationChannel } from "./notificationChannels.ts";

export const NOTIFY_FAILURES = [
  "rate_limited",
  "retryable_transport",
  "timeout",
  "invalid_recipient", // terminal: permanently rejected address/identity
  "provider_rejected", // terminal: provider refused the request permanently
  "authentication_failed", // terminal: bad credentials — do not retry
  "unsupported_channel", // terminal: channel not wired to a provider
  "provider_unavailable", // terminal: provider not registered/configured
] as const;
export type NotifyFailure = (typeof NOTIFY_FAILURES)[number];

const RETRYABLE: ReadonlySet<NotifyFailure> = new Set(["rate_limited", "retryable_transport", "timeout"]);

export function isRetryableFailure(f: NotifyFailure): boolean {
  return RETRYABLE.has(f);
}

/** Safe error code only — never a raw provider response. */
export class NotifyProviderError extends AppError {
  readonly failure: NotifyFailure;
  readonly provider: string;
  readonly retryableFlag: boolean;
  readonly retryAfterMs: number | null;
  constructor(args: {
    provider: string; failure: NotifyFailure; message: string;
    retryable?: boolean; retryAfterMs?: number | null;
  }) {
    super("INTERNAL", args.message, 502, args.retryable ?? isRetryableFailure(args.failure));
    this.failure = args.failure;
    this.provider = args.provider;
    this.retryableFlag = args.retryable ?? isRetryableFailure(args.failure);
    this.retryAfterMs = args.retryAfterMs ?? null;
  }
}

/** Provider-neutral delivery request. Only sanitized, structured content. */
export interface NotifyRequest {
  deliveryId: string;
  organizationId: string;
  channel: NotificationChannel;
  recipient: { userId: string; address: string | null };
  subject: string;
  bodyText: string;
  payload: Record<string, unknown>;
  priority: "low" | "normal" | "high" | "critical";
  /** Deterministic provider-level idempotency key (delivery id). */
  idempotencyKey: string;
}

export interface NotifyResult {
  providerMessageId: string | null;
  accepted: boolean;
}

/** Narrow provider contract: only what the dispatcher needs. */
export interface NotificationProvider {
  readonly name: string;
  readonly channel: NotificationChannel;
  /** Throws NotifyProviderError on failure. Must never throw raw SDK errors. */
  send(req: NotifyRequest): Promise<NotifyResult>;
  /** Optional liveness probe used before claiming (e.g., missing credentials). */
  isAvailable?(): Promise<boolean>;
}

const registry = new Map<string, NotificationProvider>();
/** Channel → provider name mapping; defaults to the provider with the same name. */
const channelDefaults = new Map<NotificationChannel, string>();

export function registerNotificationProvider(p: NotificationProvider): void {
  registry.set(p.name, p);
  if (!channelDefaults.has(p.channel)) channelDefaults.set(p.channel, p.name);
}

export function setChannelDefault(channel: NotificationChannel, providerName: string): void {
  channelDefaults.set(channel, providerName);
}

export function getNotificationProvider(name: string): NotificationProvider {
  const p = registry.get(name);
  if (!p) {
    throw new NotifyProviderError({
      provider: name, failure: "provider_unavailable",
      message: `notification provider not registered: ${name}`,
    });
  }
  return p;
}

export function providerForChannel(channel: NotificationChannel): NotificationProvider {
  const name = channelDefaults.get(channel);
  if (!name) {
    throw new NotifyProviderError({
      provider: channel, failure: "unsupported_channel",
      message: `no notification provider mapped for channel: ${channel}`,
    });
  }
  return getNotificationProvider(name);
}

export function clearNotificationProvidersForTests(): void {
  registry.clear();
  channelDefaults.clear();
}
