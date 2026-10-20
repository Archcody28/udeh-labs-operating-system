/** Phase 12 canonical integration model. No raw secrets anywhere in this layer. */
import { StateTransitionError } from "./errors.js";

export type IntegrationStatus =
  | "pending" | "connected" | "active" | "degraded" | "revoked" | "disconnected";

export const INTEGRATION_TRANSITIONS: Record<IntegrationStatus, IntegrationStatus[]> = {
  pending: ["connected", "revoked", "disconnected"],
  connected: ["active", "degraded", "revoked", "disconnected"],
  active: ["degraded", "revoked", "disconnected"],
  degraded: ["active", "revoked", "disconnected"],
  revoked: [],
  disconnected: [],
};

export interface Integration {
  id: string; organization_id: string; kind: string;
  config: Record<string, unknown>; status: IntegrationStatus;
  version: number; created_at: string; updated_at: string;
}

export type CredentialReferenceStatus = "active" | "revoked" | "expired";

export interface IntegrationCredential {
  id: string; integration_id: string; provider: string;
  credential_name: string; credential_reference: string;
  status: CredentialReferenceStatus;
  version: number; created_at: string; updated_at: string;
}

export type ExternalAccountStatus = "connected" | "disconnected" | "revoked";

export interface ExternalAccount {
  id: string; integration_id: string; provider: string;
  external_account_id: string; external_owner: string; account_label: string;
  status: ExternalAccountStatus; correlation_id: string;
  version: number; created_at: string; updated_at: string;
}

export type ExternalResourceStatus = "approved" | "pending" | "suspended" | "revoked";

export interface ExternalResource {
  id: string; integration_id: string; external_account_id: string;
  provider: string; provider_resource_id: string;
  resource_owner: string; resource_name: string; resource_type: string;
  status: ExternalResourceStatus; correlation_id: string;
  version: number; created_at: string; updated_at: string;
}

export type RepositoryLinkStatus = "linked" | "pending" | "suspended" | "unlinked";

export interface RepositoryLink {
  id: string; organization_id: string; project_id: string;
  integration_id: string; external_account_id: string; external_resource_id: string;
  authorized_principal: string; authorized_scope: string;
  status: RepositoryLinkStatus; correlation_id: string;
  version: number; created_at: string; updated_at: string;
}

export type WebhookEndpointStatus = "active" | "inactive" | "revoked";

export interface WebhookEndpoint {
  id: string; integration_id: string; provider: string;
  endpoint_path: string; secret_hash: string;
  status: WebhookEndpointStatus;
  version: number; created_at: string; updated_at: string;
}

export interface IntegrationEvent {
  id: string; integration_id: string; provider: string;
  external_event_id: string; event_type: string;
  payload: Record<string, unknown>; delivered: boolean;
  correlation_id: string;
  version: number; created_at: string; updated_at: string;
}

export type IntegrationOperationStatus =
  | "pending" | "processing" | "completed" | "failed" | "cancelled";

export interface IntegrationOperation {
  id: string; organization_id: string; integration_id: string;
  provider: string; operation_type: string;
  actor: string; actor_type: string; idempotency_key: string;
  payload: Record<string, unknown>;
  status: IntegrationOperationStatus;
  result: Record<string, unknown>; error_code: string | null;
  retryable: boolean; retry_count: number; max_retries: number;
  started_at: string | null; completed_at: string | null;
  correlation_id: string;
  version: number; created_at: string; updated_at: string;
}

/** Retry classification reused from the Phase 10 failure/retry principles. */
export type RetryClass = "safe" | "idempotent" | "unsafe" | "non-idempotent";

export function classifyOperationRetry(args: {
  operationType: string; idempotencyKey?: string; retryable: boolean;
}): { retryClass: RetryClass; maxRetries: number; terminalOnRateLimit: boolean } {
  const readish = /^(discover|read|get|list|describe|metadata|verify)/i.test(args.operationType);
  if (args.idempotencyKey && args.idempotencyKey.length > 0) {
    return { retryClass: "idempotent", maxRetries: 3, terminalOnRateLimit: false };
  }
  if (readish && args.retryable) return { retryClass: "safe", maxRetries: 3, terminalOnRateLimit: false };
  if (!args.retryable) return { retryClass: "unsafe", maxRetries: 0, terminalOnRateLimit: true };
  return { retryClass: "non-idempotent", maxRetries: 1, terminalOnRateLimit: false };
}

/** Assert a lifecycle transition is legal before touching the database. */
export function assertIntegrationTransition(from: IntegrationStatus, to: IntegrationStatus): void {
  const allowed = INTEGRATION_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new StateTransitionError(from, allowed);
  }
}
