# ADR 0020 - Provider Seam + GitHub Adapter (Phase 12)

**Status:** Accepted
**Date:** 2026-10-20
**Phase:** 12 (extends ADR 0019)

## 1. Provider-neutral seam

`domain/integrationProvider.ts` defines the narrow contract: installation
discovery, repository discovery, identity normalization, webhook
verify/normalize, plus `ProviderError` taxonomy (rate_limited,
retryable_transport, authentication_failed, authorization_failed, not_found,
validation_failed, provider_unavailable). Domain code never imports provider
SDK types. Unknown providers fail closed via the registry.

## 2. GitHub adapter boundary

`domain/integrationProviders/githubAdapter.ts` is the ONLY module that
understands GitHub shapes. Transport is injectable (`ProviderTransport`) so
tests are deterministic with fixtures; no heavyweight SDK added. Paths are
restricted to relative API paths (SSRF guard); pagination is bounded
(per_page <= 100, no auto-follow); tokens are resolved per-call via config
and never persisted in domain tables.

## 3. Credential abstraction

`domain/integrationSecrets.ts` (`SecretVault` / `EnvSecretVault`) holds
installation tokens and webhook secrets by reference
(`integration:<id>:installation-token`, `webhook:<id>:secret`).
`integration_credentials` stores only the reference; API projections strip
`config`; `sanitizeForAudit` redacts token/secret-shaped fields before audit.

## 4. Authorization layering

UdehLabs RBAC first (`integration.read/connect/disconnect`, `repository.link`;
granted to owner/admin; read/link subset to manager), then integration status
check (terminal/pending denies), then provider call. GitHub access never
implies UdehLabs permission. Tenant is resolved server-side from membership +
integration row; webhooks resolve tenant from the persisted integration, never
from payload.

## 5. Webhook trust model

HMAC-SHA256 (`X-Hub-Signature-256`) with constant-time compare; missing /
malformed / wrong-secret / wrong-algorithm rejected with `webhook.rejected`
audit. Delivery ID (`X-GitHub-Delivery`) stored via idempotent
`integration_events` unique key — replays return `duplicate: true` with no
second side effect.

## 6. Error normalization + retries

Adapter maps HTTP statuses to `ProviderError`; raw responses never escape.
`providerRetryPolicy`: reads may retry bounded (3, exponential backoff);
side-effecting ops never auto-retry unless explicitly idempotent; auth failures
never retry. No autonomous writes exist (no push/merge/approve/deploy/proxy).

## 7. Why no arbitrary GitHub passthrough / writes

Passthrough would bypass tenant scoping, audit, and the narrow permission
model, and would let provider authorization substitute for UdehLabs
authorization (confused deputy). Writes are deferred to a future phase with
its own approval design.

## 8. Consequences

New providers implement `IntegrationProvider` + registration; routes and
domain stay unchanged. Optional live contract test (`github.live.test.ts`)
runs only with `GITHUB_TEST_TOKEN`; CI never depends on personal credentials.
