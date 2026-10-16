# Domain Boundaries — Phase 4
Date 2026-10-16. Contract design only; no runtime. Evidence: Phase 2/3 canonical maps, `docs/interfaces/*`, ADRs 0001–0011.

## D-01 Identity
- Purpose: establish who/what acts. Responsibilities: enrollment, verification, invitation acceptance, membership lifecycle (conceptual).
- Owned: User, Invitation, Membership (conceptual pointers to ENT-*).
- Consumed: Organization (scope target), AuditEvent (produced to).
- Events: IdentityEnrolled, InvitationSent/Accepted/Revoked, MemberRoleChanged.
- Dependencies: none selected (provider-neutral; HD-01narrow open).
- Invariants: INV-SEC-01/02 (see domain-invariants.md).
- Sensitivity: High (credentials, tokens — never logged).
- Tenant scope: pre-tenant for enrollment; org-scoped thereafter.
- Screens: SCR-001..006. Workflows: W-01, W-02, W-13.

## D-02 Tenancy (Organization / Workspace / Project)
- Purpose: own isolation hierarchy User→Organization→Workspace→Project.
- Owned: Organization, Workspace, Project, Membership, Role (assignment).
- Consumed: Identity (actors).
- Events: OrganizationCreated, WorkspaceProvisioned, ProjectCreated, OrganizationSwitched.
- Dependencies: none.
- Invariants: INV-TEN-01..04.
- Sensitivity: High (boundary enforcement).
- Tenant scope: IS the tenant scope.
- Screens: SCR-010..014. Workflows: W-02, W-03.

## D-03 Commercial
- Purpose: intake→contract→project trigger. Responsibilities: request, requirements, versioned proposals, contract authorization (A.43).
- Owned: ClientRequest, Requirement, Proposal, ProposalVersion, Contract, Approval (commercial scope).
- Consumed: Organization/Workspace/Project (scope), AuditEvent.
- Events: RequestSubmitted, ProposalVersioned/Sent/Approved, ContractAuthorized, ProjectTriggered.
- Dependencies: none external.
- Invariants: INV-CON-01/02, INV-AUD-01.
- Sensitivity: Medium-High (commercial terms, signatures).
- Tenant scope: organizationId; workspace pipeline; project trigger.
- Screens: SCR-020..024. Workflows: W-04, W-05.

## D-04 Engineering
- Purpose: plan→implement→review→deploy delivery (A.8/A.9).
- Owned: Milestone, EngineeringTask, ExecutionTask, CodePatch, Review, Deployment (engineering scope), OrchestrationSession (coordination ref — co-owned with D-05, coordination side).
- Consumed: Project, Requirement, AgentResult (as input evidence), VerificationRun.
- Events: TaskPlanned, PatchProposed/Approved, DeploymentTriggered/Completed.
- Dependencies: verification tooling (conceptual), repository (UNRESOLVED provider).
- Invariants: INV-LIF-01, INV-AUD-01.
- Sensitivity: Medium (code, deploy targets).
- Tenant scope: project-scoped; org isolation.
- Screens: SCR-030..036. Workflows: W-06, W-07.

## D-05 AI / Agents (coordination A.9 + runtime A.21 — SEPARATE planes)
- Purpose: governed agent definition, planning, approval-gated execution, verified results.
- Owned: Agent, AgentVersion, AgentRun, AgentPlan, AgentPolicy, AgentResult, AgentDelegation, AgentMemory/MemoryPolicy, Workflow/Automation.
- Consumed: Project (scope), OrchestrationSession (A.9 coordination input), verification/deployment tools (as tools, not owned).
- Events: AgentDefined/Provisioned, PlanProposed, ApprovalRequested/Decided, RunStarted/Halted/Completed, ResultVerified.
- Dependencies: model provider — NONE selected (must remain neutral); verification tools (conceptual).
- Invariants: INV-AI-01..04 (L5 ban, HITL, version pin, budget halt).
- Sensitivity: High (autonomy, tool use, secrets adjacency).
- Tenant scope: project-scoped execution; org isolation; AI principal scoped per A.33.
- Screens: SCR-040..044. Workflows: W-08, W-09.

## D-06 Operations (reliability + release + security response)
- Purpose: observe→triage→remediate; readiness-gated releases; security investigation.
- Owned: Incident, Release, Environment, ObservabilityEvent, VerificationRun (consumer view; owned jointly — canonical owner D-06 for runs, consumed by D-04/D-05).
- Consumed: Deployment, Project, AuditEvent.
- Events: IncidentDetected/Triaged/Resolved, ReleaseGated/Promoted, EnvironmentObserved.
- Dependencies: telemetry provider — none selected.
- Invariants: INV-LIF-02/03, INV-AUD-01.
- Sensitivity: High (prod health, security findings).
- Tenant scope: org-scoped observability; project-scoped releases.
- Screens: SCR-050..055. Workflows: W-07, W-10, W-11.

## D-07 Data / Intelligence
- Purpose: governed catalog→lineage→quality→policy; decision intelligence (A.64/A.67/A.10).
- Owned: Dataset, LineageEdge, QualityContract, DataPolicy, Decision, Outcome, Briefing.
- Consumed: Project/Organization context, AgentResult (evidence).
- Events: AssetCataloged, LineageRecorded, QualityEvaluated, PolicyEnforced, DecisionRecorded.
- Dependencies: none selected.
- Invariants: INV-CON-03 (lineage immutable), INV-AUD-01.
- Sensitivity: High (org knowledge, governed data).
- Tenant scope: org-scoped with project attribution.
- Screens: SCR-060..062. Workflows: W-12.

## D-08 Platform / Administration
- Purpose: platform config, ecosystem (API catalog/marketplace), audit registry, notifications/integrations.
- Owned: ApiKey/OAuthClient (conceptual), Integration, Notification, PlatformSetting; Invoice — WEAK evidence (billing dirs only) → marked UNRESOLVED, not canonical.
- Consumed: all domains (read audit/config).
- Events: IntegrationConfigured, ApiCredentialIssued/Revoked, AdminSettingChanged.
- Dependencies: billing provider — NONE (blocked, weak evidence).
- Invariants: INV-SEC-03, INV-AUD-01/02.
- Sensitivity: High (credentials, admin actions).
- Tenant scope: org-scoped admin; platform-level ops UNRESOLVED (HD-07narrow).
- Screens: SCR-070..072. Workflows: W-13.

UNRESOLVED: billing/invoice canonical status; platform-global vs org-admin boundary; SRE surface count (HD-06narrow).
