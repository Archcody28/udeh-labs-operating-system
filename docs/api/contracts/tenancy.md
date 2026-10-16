# Contract: Tenancy (R-01..R-04) — conceptual
Date 2026-10-16. Evidence org-arch-doc.

Create org (→auto primary workspace, creator=Owner); create workspace; create project; switch org context (server-side); invite/accept/suspend/change-role. Preconditions: authenticated identity (mechanism UNRESOLVED); membership for switch. Validation: names/config; token validity. Audit: create/transfer/switch/invite/role-change. Errors: 401 unauthenticated, 403 no-membership, CONFLICT duplicate, STATE_TRANSITION_FAILED (expired invite).
