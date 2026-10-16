# UdehLabs | Phase P.03 Monetization & Revenue Strategy

## 1. Monetization Model: Seat + Usage Hybrid
UdehLabs utilizes a hybrid SaaS model designed for high-compute AI engineering workloads.
- **Seat-Based**: Fixed monthly fee per user for platform access and collaboration.
- **Usage-Based (Credit System)**: AI-intensive operations (Inference, Simulation, Agent Runs) consume "Credits" or "Tokens" based on provider cost and task complexity.
- **Tiers**:
    - **Starter (Free)**: Individual experimentation with 2 AI agents and 5GB storage.
    - **Professional ($49/seat)**: Teams building production-grade AI with 20 agents and 50GB storage.
    - **Enterprise (Custom)**: Global organizations with unlimited agents, dedicated concierge, and advanced security (L5 isolation).

## 2. Revenue Engine Architecture
### Entitlement Engine (`IEntitlementService`)
- Authoritative server-side service that checks `organizationId` subscription state before any restricted operation.
- **Hard Limits**: Checked during request validation (e.g., "Cannot create more than 2 agents on Free tier").
- **Soft Limits**: Trigger notifications to Org Admins when usage reaches 80/90%.

### Usage Metering (`IUsageAccounting`)
- **Atomic Increments**: Every AI tool-call or workflow step records an idempotent usage event.
- **Provider-Neutral Metering**: Normalizes token costs across Gemini, OpenAI, and internal models into a unified "UdehLabs Credit" balance.

## 3. Financial State Machine
Subscriptions follow a strict lifecycle transition:
`TRIAL` -> `ACTIVE` -> `PAST_DUE` -> `CANCELED`.
- **Grace Period**: 7 days for `PAST_DUE` accounts before feature restriction occurs.
- **Invoicing**: Automatic generation of line-itemized invoices reflecting seat counts and metered overages.

## 4. Growth & Expansion Hooks
- **Upsell Triggers**: Reaching 90% of token quota or agent limits triggers a "Plan Upgrade" recommendation in the Command Center.
- **Expansion Metrics**: Tracking MRR growth per organization based on seat expansion and compute intensity.
