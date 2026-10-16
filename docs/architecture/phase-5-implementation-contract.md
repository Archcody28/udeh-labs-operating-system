# Phase 5 Implementation Gate — Phase 4
Date 2026-10-16. Binding on Phase 5.

## Approved for Phase 5
Canonical entities (ENT-*) persistence design; database architecture; migrations; repository/data-access layer; API foundation per docs/api contracts.

## Must remain provider-neutral
Auth provider, AI/model provider, billing provider, deployment/telemetry provider — unless later ADRs explicitly establish them (HD-01narrow, HD-06narrow, HD-07narrow, HD-08 open).

## Must preserve
Org→workspace→project hierarchy; org isolation; server-resolved context; audit append-only + per-tool-call audit; lifecycle rules; A.9/A.21 separation; version-pinned approvals/execution; L5 ban.

## Still blocked
Anything under HD-01narrow (auth mechanism/onboarding), HD-06narrow (dashboard iteration/SRE consolidation), HD-07narrow (shell composition), HD-08 (themes), billing canonical status, severity/SLO + gate/promotion policies.
Phase 5 MUST NOT implement blocked areas beyond persistence/API scaffolding that preserves UNRESOLVED markers.
