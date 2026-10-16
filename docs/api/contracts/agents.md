# Contract: Agents (R-13/R-14) — conceptual
Date 2026-10-16. Evidence A.21 (runtime) under A.9 coordination. Planes separate.

Define/provision agent; bind policy; propose plan; request approval; execute; halt; verify result. Actor: AI-eng/operator/approver; agent as scoped principal. Required: policy bound + budget + pinned agent/policy/plan versions (INV-AI-04). High-risk→HITL (INV-AI-03); L5 banned; budget breach→halt. Idempotency: run-start + approval decisions single-decision semantics. Audit: every tool call. Errors incl. FORBIDDEN (out-of-policy), CONFLICT (double decision), STATE_TRANSITION_FAILED.
