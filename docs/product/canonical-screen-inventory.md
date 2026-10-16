# Canonical Screen Inventory — Phase 3 (part 1)
Date 2026-10-16. IDs SCR-001…. Status: Canonical / Variant / Human decision required.

| ID | Surface | Screen | Actor | Purpose | Source artifacts | Status |
|---|---|---|---|---|---|---|
| SCR-001 | Identity | Login | user | credential entry | `stitch…/udehlabs_login/` | Canonical |
| SCR-002 | Identity | Sign-up | user | enrollment | `…/udehlabs_sign_up/` | Canonical |
| SCR-003 | Identity | Verify identity | user | verification step | `…/udehlabs_verify_identity/` | Canonical |
| SCR-004 | Identity | Invitation accept | invited user | join org via token | `…/udehlabs_organization_invitation/`, org-arch-doc | Canonical |
| SCR-005 | Identity | Members & roles | org-admin | manage membership | `…/udehlabs_members_roles_1/`, `_2/`, `…/udehlabs_member_management/` | Canonical family; iteration gated |
| SCR-006 | Identity | Access governance matrix | sec-admin | zero-trust review | `…/udehlabs_access_governance_zero_trust_matrix/` | Canonical |
| SCR-010 | Org/Workspace | Create organization | user | provision tenant+workspace | `…/udehlabs_create_organization/`, org-arch-doc | Canonical |
| SCR-011 | Org/Workspace | Organization dashboard | owner/member | org home | `…/udehlabs_organization_dashboard_1/`,`_2/`,`_3/` | Canonical family; iteration gated |
| SCR-012 | Org/Workspace | Organization settings | admin | configure org | `…/udehlabs_organization_settings/` | Canonical |
| SCR-013 | Org/Workspace | Organization switcher | multi-org user | switch context | `…/udehlabs_organization_switcher/` | Canonical |
| SCR-014 | Org/Workspace | Create workspace | member | provision scope | `…/udehlabs_create_workspace/`,`…/udehlabs_ai_workspace/` | Canonical family |
| SCR-020 | Commercial | New software request | client | intake | `…/new_software_request_1/` family | Canonical |
| SCR-030 | Engineering | Project overview | developer/lead | delivery home | `…/project_overview_1/` x3 | Canonical family; gated |
| SCR-031 | Engineering | Execution workspace | developer/agent | implement+review | `…/engineering_execution_workspace_1/`,`_2/`, A.8/A.9 | Canonical family |
| SCR-032 | Engineering | Sprint board+milestones | lead | plan/track | `…/sprint_board_1/`,`…/project_milestones_roadmap/` | Canonical |
| SCR-033 | Engineering | Code review | developer | review change | `…/ai_assisted_code_review/` | Canonical |
| SCR-034 | Engineering | Deployment center | developer/SRE | promote+observe | `…/deployment_center_environment_overview/` | Canonical |
| SCR-035 | Engineering | Developer home | developer | focus view | `…/developer_dashboard/` + `_overview_1/2/3` | Canonical family; gated |
| SCR-036 | Engineering | Developer Workforce profile | EM/admin | skills/assignment | `…/developer_profile_skills/`, portal doc_1 | Canonical (HD-04) |
| SCR-040 | AI/Agents | Agent creator | AI-eng | define agent+policy | `…/ai_agent_creator/`, A.21 | Canonical |
| SCR-041 | AI/Agents | Agent run monitor | operator | observe runs | `…/live_agent_run_mesh_monitor/`, A.21 | Canonical |
| SCR-042 | AI/Agents | Handoff approval | approver | HITL gate | `…/agent_handoff_approval/`, A.21 | Canonical |
| SCR-043 | AI/Agents | Workflow builder+monitor | AI-eng | automation | `…/workflow_builder/`, A.21 | Canonical |
| SCR-044 | AI/Agents | Orchestrator execution | operator | coordination (A.9) | `…/ai_orchestrator_execution/`, A.9 | Canonical layer |
| SCR-050 | Operations | Command center | SRE/ops | control | `…/operations_command_center/`, `…/delivery_command_center/` | Canonical pattern; count gated |
| SCR-051 | Operations | Incident workspace | SRE | investigate | `…/sre_incident_workspace_rca/` | Canonical |
| SCR-052 | Operations | Verification center | rel-mgr | readiness gate | `…/verification_center_1/`, A.17 | Canonical family |
| SCR-053 | Operations | Quality/release center | rel-mgr | release | `…/quality_command_center_1/`, `…/quality_release_center/` | Canonical family |
| SCR-054 | Operations | Security center+audit | SecOps | posture | `…/security_command_center/`, A.33 | Canonical |
| SCR-055 | Operations | SRE platform health | SRE | health | `…/sre_command_center_platform_health_1/`, `…/nexus_sre_command_1/` | Canonical pattern; gated |
| SCR-060 | Data/Intel | Data catalog+lineage | steward | govern data | `…/data_inventory_catalog_1/`, A.64 | Canonical |
| SCR-061 | Data/Intel | Org intelligence hub | exec | decisions | `…/organizational_intelligence_hub_1/`, A.67 | Canonical family |
| SCR-062 | Data/Intel | Engineering intelligence | EM | insight | `…/engineering_intelligence_center/`, A.10 | Canonical |
| SCR-070 | Platform/Admin | Admin console | platform-admin | platform ops | `…/platform_administration_console_1/` | Canonical family |
| SCR-071 | Platform/Admin | API catalog | partner/dev | ecosystem | `…/api_catalog_explorer/` | Canonical |
| SCR-072 | Platform/Admin | Audit registry | auditor | timeline | `…/security_audit_compliance_registry/` | Canonical |

Excluded: `cyber_*`,`kinetic_*`,`obsidian_*`,`surgical_*`,`synthetic_intelligence`,`command_horizon`,`technical_high_density_orchestrator` — no arch counterpart (HD-08).
| SCR-021 | Commercial | Requirements brief | sales/ops | discovery | `…/request_details_requirements_1/` family | Canonical |
| SCR-022 | Commercial | Proposal review | client/ops | approve version | `…/proposal_detail_review_1/` family, A.43 | Canonical |
| SCR-023 | Commercial | Contract center | ops/client | authorization | `…/contract_center_review/`, A.43 | Canonical |
| SCR-024 | Commercial | Client dashboard | client | visibility | `…/udehlabs_client_dashboard_1/`,`_2/` | Canonical family; gated |
