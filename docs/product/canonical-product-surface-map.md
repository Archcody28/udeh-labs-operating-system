# Canonical Product Surface Map — Phase 2
Date 2026-10-16. Evidence: stitch dirs (252), root arch docs (~70), ADR 0001-0010. No runtime.
## 1 Hierarchy (evidence-backed; suffixed _1/_2/_3 = iterations per ADR 0010)
- 1 Identity & Access: login, sign_up, verify_identity, invite_member, members_roles_1-2, member_management, organization_invitation, permissions_access_matrix, access_governance_zero_trust_matrix, enhanced_access_governance_matrix, zero_trust_governance_ai_sovereignty_matrix
- 2 Organization & Workspace: create_organization, organization_dashboard_1-3, organization_settings, organization_switcher; create_workspace, ai_workspace, personal_ai_workspace, engineering_workspace
- 3 Commercial & Client: new_software_request_1-3, request_details_requirements_1-3, requirements_project_brief; proposal_detail_review_1-2, proposal_pipeline_*, proposal_version_comparison_*, contract_center_review (A.43); client_dashboard_1-2, client_documents_files, client_progress_report, client_portal_support_portal; pricing_plans*, billing_usage*, commercial_intelligence_*
- 4 Engineering Execution: engineering_planning*, engineering_plan_builder, sprint_board_1-2, project_milestones_roadmap, new_project_initialization; engineering_execution_workspace_1-2, project_engineering_workspace, ai_implementation_workspace; connect_repository, ai_assisted_code_review, ai_debugging_logs, code_intelligence_overview; delivery_pipeline_detail_execution_workspace, live_deployment_step_logs, deployment_center_environment_overview; developer_profile_skills, team_composition_squad_setup
- 5 AI & Agent Platform: ai_agent_creator, ai_agent_provisioning, agent_intelligence_profile, agent_handoff_approval, live_agent_run_mesh_monitor; agent_reasoning_mesh_runtime, agent_memory_knowledge_governance, decision_memory_lineage_workspace_1-2, knowledge_graph_explorer; ai_orchestrator_execution, ai_workflow_library, workflow_builder, workflow_execution_monitor, enterprise_automation (A.9 vs A.21 fork); advanced_model_tuning, ai_performance_benchmarking
- 6 Operations Reliability Security: ai_command_center, ai_engineering_command_center, delivery_command_center, operations_command_center, nexus_command, sre_command_center_platform_health_1-2, nexus_sre_command_1-3 (variants); reliability_center, observability_center, sre_incident_workspace_rca, verification_center_1-2, quality_command_center_1-2, quality_release_center, release_intelligence_readiness, production_*, resilience_disaster_recovery_control; security_command_center*, security_investigation_workspace, security_logs_audit_trail, security_audit_compliance_registry, ai_security_trust_center, ai_governance_dashboard, data_governance_*, app_credential_control_plane (A.51)
- 7 Data & Intelligence: data_inventory_catalog_1-2, data_lineage_flow_intelligence, data_quality_contracts, data_policy_ai_governance (A.64); engineering_intelligence_center[_2], engineering_intelligence_dashboard, ai_intelligence_overview, ai_delivery_intelligence, project_intelligence_causal_* (A.10); organizational_intelligence_hub_1-2, team_intelligence_resource_explorer_1-2, resource_ai_intelligence (A.67); advanced_analytics_deep_dive, executive_intelligence_dashboard, customer_success_command_center
- 8 Platform Ecosystem Admin: platform_administration_console_1-2, internal_service_console, adr_registry[_decision_workspace]; api_catalog_explorer, api_agent_marketplace, api_database_discovery, api_documentation, sdks_developer_tools; system_architecture, system_map_drift_detection, system_unification_final_integration; localization_i18n_management, mobile_operations_companion, support_operations_hub
- Excluded Weak (no arch counterpart): command_horizon, cyber_*, kinetic_*, obsidian_*, surgical_*, synthetic_intelligence, technical_high_density_orchestrator (see HD-08).
## 2 Ownership
- S1 Identity: actors user/org-admin/sec-admin; workflows W-01 W-02 W-13; entities User Member Role Permission Approval; docs A.51, P.08; canonical NONE (HD-01).
- S2 Org/Workspace: owner/member; W-02 W-03; Organization Workspace Member; organization_architecture_doc, A.67; NONE (HD-02).
- S3 Commercial/Client: client/sales/lead; W-04 W-05; ClientRequest Requirement Proposal ProposalVersion Contract Milestone; A.43 pair (content canonical), A.40/41/42; filename open (HD-03).
- S4 Engineering: developer/lead/EM; W-06 W-07; Project Task CodePatch Review Deployment; A.8 A.9 A.14 A.16 A.17 A.18; portal NONE (HD-04).
- S5 AI/Agents: AI-eng/operator/approver; W-08 W-09; Agent AgentRun AgentPlan AgentPolicy AgentResult Workflow Memory; A.9 vs A.21 FORK, A.20, A.66; NONE (HD-05).
- S6 Ops/Security: SRE/SecOps/rel-mgr; W-10 W-11 W-13; Incident Release Deployment AuditEvent; A.51 A.63 A.65; NONE (HD-06).
- S7 Data/Intel: steward/leader/exec; W-12; Dataset Lineage Decision Outcome; A.64 pair + A.10 pair (content canonical), A.67; filenames open (HD-03).
- S8 Platform/Admin: platform-admin/partner; W-13; ApiKey Integration AuditEvent; A.1, P.11; NONE (HD-07).
## 3 Navigation (evidence only)
- Global nav: INFERRED weak, no shell mockup; recurring headers suggest sidebar; UNRESOLVED HD-07.
- Role homes EXPLICIT (developer/client/org/command/admin); variant-vs-product UNRESOLVED HD-06.
- Project context EXPLICIT (project_overview_*, *_execution_workspace_*); relation to switcher UNRESOLVED HD-02.
- Command pattern EXPLICIT (*_command_center); count UNRESOLVED HD-06. No new nav designed.



