/** Phase 12 provider-neutral integration seam.
 * Canonical domain MUST NOT import GitHub SDK/client types.
 * GitHub specifics live in integrationProviders/githubAdapter.ts.
 */
import { AppError } from "./errors.js";

/** Provider-neutral failure categories (no raw provider internals escape). */
export const PROVIDER_FAILURES = [
  "rate_limited",
  "retryable_transport",
  "authentication_failed",
  "authorization_failed",
  "not_found",
  "validation_failed",
  "provider_unavailable",
] as const;
export type ProviderFailure = (typeof PROVIDER_FAILURES)[number];

export class ProviderError extends AppError {
  readonly failure: ProviderFailure;
  readonly provider: string;
  readonly retryableFlag: boolean;
  readonly retryAfterMs: number | null;
  constructor(args: {
    provider: string; failure: ProviderFailure; message: string;
    retryable?: boolean; retryAfterMs?: number | null; httpStatus?: number;
  }) {
    const status = args.httpStatus ?? statusForFailure(args.failure);
    super(codeForFailure(args.failure), args.message, status, args.retryable ?? false);
    this.failure = args.failure;
    this.provider = args.provider;
    this.retryableFlag = args.retryable ?? false;
    this.retryAfterMs = args.retryAfterMs ?? null;
  }
}

function codeForFailure(f: ProviderFailure): "RATE_LIMITED" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_FAILED" | "INTERNAL" | "CONFLICT" {
  switch (f) {
    case "rate_limited": return "RATE_LIMITED";
    case "authentication_failed": return "UNAUTHORIZED";
    case "authorization_failed": return "FORBIDDEN";
    case "not_found": return "NOT_FOUND";
    case "validation_failed": return "VALIDATION_FAILED";
    default: return "INTERNAL";
  }
}

function statusForFailure(f: ProviderFailure): number {
  switch (f) {
    case "rate_limited": return 429;
    case "authentication_failed": return 401;
    case "authorization_failed": return 403;
    case "not_found": return 404;
    case "validation_failed": return 422;
    case "retryable_transport": return 502;
    case "provider_unavailable": return 503;
    default: return 500;
  }
}

/** Provider-neutral account/installation identity. */
export interface ProviderAccount {
  provider: string;
  installationId: string;
  accountId: string;
  accountLogin: string;
  accountType: string;
  displayName: string;
}

/** Provider-neutral repository metadata. No passthrough of raw API payloads. */
export interface ProviderRepository {
  provider: string;
  providerRepositoryId: string;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string | null;
  visibility: "public" | "private" | "unknown";
  externalUrl: string | null;
}

/** Normalized external identity for mapping to a UdehLabs user. */
export interface ProviderIdentity {
  provider: string;
  externalUserId: string;
  login: string;
  displayName: string | null;
  email: string | null;
}

/** Provider-neutral webhook envelope. Tenant is derived server-side, never trusted from payload. */
export interface ProviderWebhookEnvelope {
  provider: string;
  eventType: string;
  eventId: string;
  deliveryId: string;
  occurredAt: string | null;
  repository: { providerRepositoryId: string; owner: string; name: string } | null;
  sender: { externalUserId: string; login: string } | null;
}

/** Minimal transport surface the adapter may use (injectable for deterministic tests). */
export interface ProviderTransport {
  request(path: string, opts?: { method?: string; headers?: Record<string, string> }): Promise<{
    status: number; headers: Record<string, string>; body: unknown;
  }>;
}

/** Narrow provider contract: only capabilities required by the current architecture. */
export interface IntegrationProvider {
  readonly name: string;
  resolveInstallation(input: { installationId: string }): Promise<ProviderAccount>;
  getAuthenticatedIdentity(): Promise<ProviderIdentity>;
  validateInstallationAccess(installationId: string): Promise<boolean>;
  listRepositories(installationId: string, opts?: { limit?: number }): Promise<ProviderRepository[]>;
  getRepository(installationId: string, repo: { owner: string; name: string } | { providerRepositoryId: string }): Promise<ProviderRepository>;
  verifyWebhookSignature(args: { rawBody: string; signatureHeader: string | null; secret: string }): boolean;
  normalizeWebhook(args: { rawBody: string; eventHeader: string | null; deliveryHeader: string | null }): ProviderWebhookEnvelope;
}

/** Retry policy: reads may retry bounded; writes never auto-retry unless explicitly idempotent. */
export function providerRetryPolicy(args: {
  failure: ProviderFailure; sideEffecting: boolean; idempotent: boolean; attempt: number;
}): { retry: boolean; backoffMs: number } {
  if (args.sideEffecting && !args.idempotent) return { retry: false, backoffMs: 0 };
  if (args.failure === "authentication_failed" || args.failure === "authorization_failed") {
    return { retry: false, backoffMs: 0 };
  }
  if (args.failure === "rate_limited" || args.failure === "retryable_transport") {
    if (args.attempt >= 3) return { retry: false, backoffMs: 0 };
    return { retry: true, backoffMs: Math.min(1000 * 2 ** args.attempt, 8000) };
  }
  return { retry: false, backoffMs: 0 };
}

/** Registry keeps provider lookup explicit; unknown providers fail closed. */
const registry = new Map<string, IntegrationProvider>();
export function registerProvider(p: IntegrationProvider): void { registry.set(p.name, p); }
export function getProvider(name: string): IntegrationProvider {
  const p = registry.get(name);
  if (!p) throw new ProviderError({ provider: name, failure: "validation_failed", message: `unknown provider: ${name}` });
  return p;
}
export function clearProvidersForTests(): void { registry.clear(); }
