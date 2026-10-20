# ADR 0019 - Integrations Foundation (Phase 12)

**Status:** Accepted
**Date:** 2026-10-18
**Phase:** 12

## 1. Context

Phase 11 establishes controlled Autonomous Engineering. Phase 12 extends the platform so external systems (GitHub, identity providers, model providers, deployment providers, webhooks) can interact with UdehLabs safely.

## 2. Decision - Integration Boundary

External systems must never be alternate sources of truth for UdehLabs canonical state.

## 3. Decision - Canonical Integration Model

- integrations
- integration_credentials
- external_accounts
- external_resources
- repository_links
- webhook_endpoints
- integration_events
- integration_operations

## 4. Decision - Credentials / Secrets Boundary

CredentialReference + SecretProvider abstraction. No plaintext secrets in domain tables.

## 5. Decision - Integration Lifecycle

pending -> connected -> active -> degraded -> revoked -> disconnected

## 6. Decision - Provider Abstraction

IntegrationProvider interface. GitHubAdapter first.

## 7. Decision - GitHub Authorization

Organization -> Integration -> Installation -> Authorized Repository. AI requires separate authorization.

## 8. Decision - Webhook Architecture

Signature verification, tenant resolution from registered integration, event ID scoped to provider+integration, idempotency, audit.

## 9. Decision - Outbound Operations

Transactional outbox pattern. No distributed queue yet.

## 10. Decision - Retries and Rate Limiting

Phase 10 retry principles. Retry limit, backoff, terminal failure.

## 11. Decision - AI Boundary

AI cannot create integrations, acquire credentials, bypass authorization, or access other orgs.

## 12. Decision - Audit

Audit integration creation, connection, revocation, repository linking, webhook events, outbound operations.

## 13. Decision - Observability Seem

correlation_id, organization, integration, provider, operation, actor, result, failure category.

## 14. Consequences

New external systems require provider adapter, integration registration, webhook endpoint registration, and credential reference.

## 15. Explicit Non-Goals

autonomous GitHub merge/push, production deployment, unrestricted GitHub API, arbitrary shell/filesystem, credential exposure to AI, billing, Stripe, message brokers, Kubernetes, distributed workers, full webhook event bus, marketplace, frontend redesign, mobile, RAG, vector DB, long-term memory.