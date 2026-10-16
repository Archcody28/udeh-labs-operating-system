# Canonical Workflow Map — Phase 2 (docs only)
Date 2026-10-16. Labels: EXPLICIT = in arch doc text; INFERRED = from mockup names; UNRESOLVED = no evidence.
## W-04 Intake to contract (EXPLICIT, A.43)
Actor client + ops. Trigger new_software_request. Steps: request -> discovery requirements -> proposal DRAFT -> INTERNAL_REVIEW -> SENT_TO_CLIENT -> CLIENT_APPROVED -> CONTRACT_READY -> authorization -> Project. Approvals: internal review + client signature (version-pinned) + internal sign-off. Audit: ProposalReview/Approval immutable. Failure: revision creates new ProposalVersion with diff. Evidence: proposal_contract_doc_1 (33 lines verified).
## W-06 Engineering delivery (EXPLICIT, A.8/A.9)
Actor developer/agent. Steps: Requirement -> Architecture -> EngineeringTask -> ExecutionTask -> AgentRun -> Verified Change -> Review -> Approval. L5 autonomy disabled (A.9). HITL on high-risk. Locks via ResourceLockManager. UNRESOLVED: A.9 vs A.21 runtime binding (HD-05).
## Others (condensed)
- W-01 Auth (INFERRED; login/verify/zero-trust dirs; A.51 step-up+MFA): trigger credential; UNRESOLVED model/flows (HD-01).
- W-02 Onboarding (INFERRED; client/developer/welcome dirs + dev-portal doc_1 steps): init identity -> skills -> availability -> assignment; UNRESOLVED one flow or three (HD-01).
- W-03 Org setup (INFERRED; create_organization/switcher/settings): create -> invite -> role assign; org-vs-workspace UNRESOLVED (HD-02).
- W-05 Delivery reporting (INFERRED; client dashboards/milestone_review): publish progress -> client review; cadence UNRESOLVED.
- W-07 Verification (EXPLICIT A.17/A.18 refs; verification_center dirs): run suite -> readiness gate -> release; gate policy UNRESOLVED (HD-06).
- W-09 Automation approval (EXPLICIT A.21 HITL + agent_handoff_approval dir): propose -> approval -> execute; approver matrix UNRESOLVED.
- W-10 Incident (INFERRED; sre_incident_workspace_rca + A.19 refs): detect -> investigate -> remediate; severity/SLO UNRESOLVED.
- W-11 Release (INFERRED; release_intelligence_readiness + production_* + P.07): readiness -> deploy -> validate; promotion policy UNRESOLVED.
- W-12 Data governance (EXPLICIT A.64 + data_quality_contracts dirs): catalog -> lineage -> quality check -> policy enforce; steward roles UNRESOLVED.
- W-13 Access review (EXPLICIT A.51 + governance matrix dirs): evaluate identity/device/sensitivity -> step-up -> grant/deny; review cadence UNRESOLVED.

## W-08 Agent lifecycle (EXPLICIT, A.21 + workforce doc)
Actor AI-eng/operator. Steps: define Agent -> provision (AgentPolicy) -> PLANNING -> WAITING_APPROVAL -> EXECUTING -> AgentResult -> verification (A.17)/deploy (A.18) as tools. Budgets enforced. Every tool call audited. Handoff via HandoffManager + ApprovalRequest.

