# Idempotency and Concurrency — Phase 4
Date 2026-10-16. Conceptual; no implementation.

- Require idempotency key (PROPOSED header `Idempotency-Key`) for: proposal send/approve, contract sign, deployment trigger, agent run start, approval decision, incident remediate actions.
- Behavior: duplicate key+same payload→return original result; same key+different payload→CONFLICT.
- Optimistic concurrency (PROPOSED): version/ETag on ProposalVersion, AgentPlan, Contract, Release gate; stale write→CONFLICT + current version.
- Agent/approval actions: single-decision semantics (second decision→CONFLICT, audited).
- Deployment: retry creates new attempt linked to same intent; rollback is separate action, not delete.
