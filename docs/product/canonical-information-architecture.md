# Canonical Information Architecture — Phase 3
Date 2026-10-16. Evidence: `organization_architecture_doc.md` (tenancy), A.33 zero-trust (authZ), Phase 2 surface/workflow maps, DESIGN.md sidebar convention (240px rail). No runtime.

## 1. Global structure (RESOLVED where stated)

```text
Identity (User)
└── Organization (primary tenant, organizationId scope)
    ├── Workspace (technical scope, auto-provisioned primary)
    │   ├── Project (delivery unit)
    │   │   ├── Engineering (tasks, code, verification, deployments)
    │   │   └── AI/Agents (runs, plans, policies, results)
    │   ├── Commercial (requests, proposals, contracts)
    │   └── Operations (incidents, releases, observability)
    ├── Membership/Invitation (org-scoped roles)
    └── Administration (settings, billing, audit)
```

Authority: `organization_architecture_doc.md` — "Organizations serve as the primary security and administrative boundary. A Workspace is a technical environment belonging to an organization." Every record scoped by `organizationId`; server resolves `currentOrganization` per request. HD-02 RESOLVED.

## 2. Navigation model

- Global: organization switcher (EXPLICIT dir `udehlabs_organization_switcher`) + sidebar rail 240px (EXPLICIT DESIGN.md convention, e.g. Nexus SRE Command). Full shell composition UNRESOLVED → HD-07 retained (narrowed).
- Contextual levels: org → workspace → project (EXPLICIT per tenancy doc + `project_overview_*` / `*_execution_workspace_*` dirs).
- Role homes (EXPLICIT dirs): developer, client, organization, command, admin. Each is a landing surface, not a separate product.
- Command pattern (EXPLICIT): `*_command_center` = operational control surface; `*_dashboard` = read view; `*_workspace` = interactive scope (per terminology.md).
- Settings/admin: `organization_settings`, `platform_administration_console_1-2`, `adr_registry_decision_workspace` (EXPLICIT dirs).

## 3. Screen hierarchy (summary; full inventory in canonical-screen-inventory.md)

| Surface | Canonical screens (IDs) | Actor | Parent |
|---|---|---|---|
| Identity | SCR-001 login, SCR-002 sign-up, SCR-003 verify-identity, SCR-004 invitation-accept, SCR-005 members-roles, SCR-006 access-governance | user/org-admin/sec-admin | product entry |
| Org/Workspace | SCR-010 create-org, SCR-011 org-dashboard, SCR-012 org-settings, SCR-013 org-switcher, SCR-014 create-workspace | owner/member | Organization |
| Commercial | SCR-020 intake-request, SCR-021 requirements-brief, SCR-022 proposal-review, SCR-023 contract-center | client/sales | Workspace→Project pipeline |
| Engineering | SCR-030 project-overview, SCR-031 execution-workspace, SCR-032 sprint-board, SCR-033 code-review, SCR-034 deployment-center | developer/lead | Project |
| AI/Agents | SCR-040 agent-creator, SCR-041 agent-run-monitor, SCR-042 handoff-approval, SCR-043 workflow-builder | AI-eng/operator/approver | Project |
| Operations | SCR-050 command-center, SCR-051 incident-workspace, SCR-052 verification-center, SCR-053 quality-release, SCR-054 security-center | SRE/SecOps | Organization |
| Data/Intel | SCR-060 data-catalog, SCR-061 lineage-view, SCR-062 org-intelligence-hub | steward/exec | Organization |
| Platform/Admin | SCR-070 admin-console, SCR-071 api-catalog, SCR-072 audit-trail | platform-admin | Organization |

Each screen: entry via sidebar/switcher/context; exit via parent surface; permissions org-scoped conceptual (see role-surface-matrix.md); related workflows W-01…W-13.
