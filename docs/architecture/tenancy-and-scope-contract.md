# Tenancy and Scope Contract — Phase 4
Date 2026-10-16. Provider-neutral. Authority: organization_architecture_doc + A.33.

Hierarchy: User → Organization → Workspace → Project. Organization = primary tenant; Workspace = technical scope auto-provisioned primary; Project = delivery unit.
- Organization ownership: creator becomes Owner; ownership transfer audited; server resolves currentOrganization per request, never client-trusted.
- Workspace ownership: belongs to exactly one Organization (organizationId immutable); additional workspaces member-provisioned.
- Project ownership: belongs to exactly one Workspace (hence one Organization); cross-workspace move UNRESOLVED (default: prohibited).
- Membership/role scope: org-scoped RBAC/ABAC (OWNER/Admin/Manager/Developer/Client/Support/Auditor per role-surface-matrix); project-level grants are refinements, never broaden org boundary.
- AI principal scope: AI agent is first-class principal (A.33), bound to org+project+policy; cannot cross org.
- Audit scope: every event carries organizationId + optional workspaceId/projectId + actor.
- Isolation: cross-organization access prohibited (INV-TEN-02); cross-workspace access requires explicit membership; project-level access requires workspace path.
- Switch: organization switcher updates server context; prior context discarded.

Open: auth mechanism (HD-01narrow); shell composition (HD-07narrow).
