# Canonical Domain Map — Phase 2 (domain only; no schema/SQL/ORM)
Date 2026-10-16. Entities only where arch docs name them.
## Domains + entities (doc source in parens)
- Identity: User, Member, Role, Permission, DeveloperProfile, Skill, DeveloperSkill, DeveloperAvailability, DeveloperAssignment (dev-portal doc_1, A.51). Tenant: organizationId.
- Tenancy: Organization, Workspace, Team (organization_architecture_doc, A.67 tiers Personal/Team/Project/Org). Boundary org-vs-workspace UNRESOLVED HD-02.
- Commercial: ClientRequest, Requirement, Feature, Proposal, ProposalVersion, Estimate, CommercialTerm, Contract, Approval (A.43, A.42). Chain: Request->Discovery->Proposal->Approval->Project.
- Engineering: Project, Milestone, EngineeringTask, ExecutionTask, OrchestrationSession, CodePatch, Review, Deployment, VerificationRun (A.8, A.9, A.16/17/18, dev-portal doc_2).
- Agents: Agent, AgentVersion, AgentRun, AgentPlan, AgentPolicy, AgentResult, AgentTask, AgentDelegation, AgentMemory, MemoryPolicy, Workflow (A.21, A.9, workforce doc). Fork UNRESOLVED HD-05.
- Operations: Incident, Release, Environment, Deployment, ObservabilityEvent, AuditEvent, Policy (A.51, A.63, A.65).
- Data/Intel: Dataset, Lineage, QualityContract, DataPolicy, OrganizationalContext, Decision, DecisionParticipant, Outcome, Briefing (A.64, A.67).
- Platform: ApiKey/OAuthClient, Integration, Notification, Invoice (billing dirs only, weak).
## Cross-domain
- organizationId scoping EXPLICIT in A.43, dev-portal doc_1, A.67. Approval gates EXPLICIT in A.43 + A.21. Audit trail EXPLICIT in A.21. Org<->Workspace ownership UNRESOLVED; AgentRun identity attribution UNRESOLVED.

