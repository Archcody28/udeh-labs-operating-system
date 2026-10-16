# Canonical User Journeys — Phase 3
Date 2026-10-16. Labels EXPLICIT / INFERRED / UNRESOLVED.

## J-01 Identity enrollment + org creation (INFERRED, org-arch-doc creation flow EXPLICIT)
Actor user→owner. Goal provision tenant. Trigger sign-up. Entry SCR-002. Steps: sign-up→verify(SCR-003)→create-org(SCR-010)→auto primary workspace→owner role. Decision: single vs SSO UNRESOLVED. Approval: none. Success: Active org+membership. Failure: verification fail→retry. Exit: org dashboard. Refs W-01/W-02/W-03.

## J-02 Member invitation (EXPLICIT org-arch-doc)
Actor admin→invited user. Goal join org. Trigger invite. Entry SCR-005. Steps: send invitation→token link→accept(SCR-004)→role assign→audit log. Approval: admin send. Success: Active membership. Failure: expired/revoked→resend. Exit: workspace home. Refs W-02/W-03.

## J-03 Intake→contract→project (EXPLICIT A.43)
Actor client+ops. Goal authorized project. Entry SCR-020. Steps: request→requirements(SCR-021)→proposal draft→internal review→sent→client approved→contract ready(SCR-023)→project created. Approvals: internal review + client signature (version-pinned) + sign-off. Success: Project. Failure: revision→new ProposalVersion+diff. Refs W-04.

## J-04 Engineering delivery (EXPLICIT A.8/A.9)
Actor developer/agent. Goal verified change. Entry SCR-030. Steps: architecture→task→execution task→agent run→verified change→review(SCR-033)→approval→deploy(SCR-034). Decision: autonomy L0-L4 (L5 banned). Approval: HITL high-risk. Success: Completed+verified. Failure: conflict→replan; persistent fail→escalate. Refs W-06.

## J-05 Agent lifecycle with approval (EXPLICIT A.21)
Actor AI-eng/operator/approver. Goal governed outcome. Entry SCR-040. Steps: define→provision(policy)→planning→waiting-approval(SCR-042)→executing→result→verify as tool. Approval: high-risk ops pause for human. Success: AgentResult+evidence. Failure: budget exceeded→halt; denial→replan. Refs W-08/W-09.

## J-06 Incident response (INFERRED dirs + A.19 refs)
Actor SRE. Goal restore service. Entry SCR-050/051. Steps: detect→triage→investigate(RCA)→remediate→verify. Severity/SLO UNRESOLVED. Success: resolved+audited. Failure: escalate. Refs W-10.

## J-07 Release readiness (INFERRED + A.17 EXPLICIT verify)
Actor rel-mgr. Goal safe release. Entry SCR-052/053. Steps: suite run→readiness gate→release→deploy validate. Gate policy UNRESOLVED. Refs W-07/W-11.

## J-08 Data governance (EXPLICIT A.64)
Actor steward. Goal governed data. Entry SCR-060. Steps: catalog→lineage→quality check→policy enforce. Steward roles UNRESOLVED. Refs W-12.

## J-09 Access review (EXPLICIT A.33/A.51)
Actor sec-admin. Goal grant/deny. Entry SCR-006. Steps: evaluate identity/device/sensitivity→step-up MFA→grant/deny→audit. Cadence UNRESOLVED. Refs W-13.
