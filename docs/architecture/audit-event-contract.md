# Audit / Event Contract — Phase 4
Date 2026-10-16. No infrastructure.

AuditEvent (immutable, append-only): eventId, correlationId, timestamp, actor (userId or agentRunId), principalType (human|agent|system), organizationId, workspaceId?, projectId?, action, target {type,id,version?}, result (success/denied/failed), metadata (non-sensitive), prevHash? (PROPOSED chain, optional).
Domain event vs audit event vs app log: domain event = state fact (consumed internally); audit event = immutable compliance record of who-did-what; app log = ephemeral diagnostics (never compliance source).
Producers: every approval, agent tool call, security decision, contract action, membership change, deployment.
Consumers: SCR-072 audit registry, SCR-054 security center (conceptual reads via R-20).
