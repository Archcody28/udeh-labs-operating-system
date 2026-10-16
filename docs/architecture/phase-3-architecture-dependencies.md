# Phase 3 Architecture Dependencies
Date 2026-10-16. Built from org-arch-doc + A.33 + A.21/A.9 + A.43 + A.64.

```text
Identity (User, Member, Invitation)
  → Organization / Workspace (organizationId tenant; primary workspace auto)
    → Membership/Roles (OWNER..SUPPORT, org-scoped RBAC/ABAC)
      → Project (delivery unit)
        → Commercial (Request→Proposal→Contract→Project trigger)
        → Engineering (Task→Execution→Patch→Review→Deployment)
          → AI/Agents (A.9 coordination → A.21 runtime → verify/deploy as tools)
        → Operations (observe→incident→release; A.19/A.17/A.18)
      → Data/Intel (catalog→lineage→policy; A.64)
    → Security envelope (A.33 zero-trust wraps ALL layers; audit everywhere)
```

Future-phase mapping: identity mechanism + tenant enforcement → Phase 4 domain/API gate; agent runtime binding → AI gateway phase; observability/release policy → ops phase. No schemas defined here.
