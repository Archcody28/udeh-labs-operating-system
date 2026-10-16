# Entity Catalog — Phase 4 (conceptual; no tables/ORM/SQL)
Date 2026-10-16. Stable IDs (see rows below). Part 1: Identity/Tenancy/Commercial/Engineering.

| ID | Name | Domain | Parent | Tenant scope | Lifecycle | Sensitivity | Evidence |
|---|---|---|---|---|---|---|---|
| ENT-001 | User | D-01 | none | pre-tenant→multi-org | Active/Suspended (UNRESOLVED) | High | login dirs, A.51 |
| ENT-002 | Invitation | D-01 | Organization | org | Sent→Accepted/Expired/Revoked | High | org-arch-doc, SCR-004 |
| ENT-003 | Membership | D-02 | Organization+User | org | Active/Suspended/Removed | High | org-arch-doc, SCR-005 |
| ENT-004 | Organization | D-02 | none | IS tenant | Provisioning→Active/Suspended | High | org-arch-doc |
| ENT-005 | Workspace | D-02 | Organization | org | Active/Archived | High | org-arch-doc |
| ENT-006 | Project | D-02 | Workspace | org+workspace | Active/Archived (UNRESOLVED) | Medium | project_overview_*, A.43 |
| ENT-007 | ClientRequest | D-03 | Workspace | org/workspace | Submitted→Elaborated→Closed | Medium | A.43, SCR-020 |
| ENT-008 | Requirement | D-03 | ClientRequest | org/workspace | Draft→Accepted | Medium | A.42/A.43 |
| ENT-009 | Proposal | D-03 | ClientRequest | org | Draft→InReview→Sent→Approved/Rejected | Medium | A.43 |
| ENT-010 | ProposalVersion | D-03 | Proposal | org | Draft→Sent→Superseded/Approved; content-pin immutable | Medium | A.43 version-pin |
| ENT-011 | Contract | D-03 | Proposal | org | Ready→Signed→Active; signed package immutable | High | A.43 |
| ENT-012 | Approval | shared | target entity | org(+project) | Requested→Approved/Denied; decision immutable | High | A.43+A.21 |
| ENT-013 | Milestone | D-04 | Project | project | Planned→Active→Met/Missed (UNRESOLVED) | Low | milestones_roadmap |
| ENT-014 | EngineeringTask | D-04 | Project/Milestone | project | Planned→InProgress→InReview→Done | Low | A.8/A.9 |
| ENT-015 | ExecutionTask | D-04 | EngineeringTask | project | Queued→Running→Verified/Failed | Medium | A.9 |
| ENT-016 | CodePatch | D-04 | ExecutionTask | project | Proposed→Approved/Applied/Superseded; diff immutable | Medium | A.16, SCR-033 |
| ENT-017 | Review | D-04 | CodePatch | project | Requested→Approved/ChangesRequested | Medium | SCR-033 |
| ENT-018 | Deployment | D-04/D-06 | Project | project+env | Triggered→Running→Succeeded/Failed/RolledBack (PROPOSED) | High | A.18 |

Part 2: AI/Ops/Data/Platform.

| ENT-019 | OrchestrationSession | D-05 coord (A.9) | Project | project | Open→Closed/Escalated | Medium | A.9, ADR 0004 |
| ENT-020 | Agent | D-05 | Project | project | Defined→Provisioned→Retired | High | A.21 |
| ENT-021 | AgentVersion | D-05 | Agent | project | Pinned→Superseded; pin immutable | High | A.21 |
| ENT-022 | AgentRun | D-05 | Agent+Policy | project | Planning→WaitingApproval→Executing→Succeeded/Failed/Halted | High | A.21 |
| ENT-023 | AgentPlan | D-05 | AgentRun | project | Proposed→Approved/Denied/Superseded; content immutable | Medium | A.21 |
| ENT-024 | AgentPolicy | D-05 | Agent | project | Active/Revoked; execution pin immutable | High | A.21 |
| ENT-025 | AgentResult | D-05 | AgentRun | project | Produced→Verified/Rejected; payload immutable | Medium | A.21 |
| ENT-026 | AgentDelegation | D-05 | AgentRun | project | Requested→Accepted/Completed | Medium | workforce doc |
| ENT-027 | AgentMemory/MemoryPolicy | D-05 | Organization | org/project | Active/Governed/Purged (UNRESOLVED) | High | A.21 memory gov |
| ENT-028 | Workflow (Automation) | D-05 | Project/Org | org/project | Defined→Active→Disabled | Medium | workflow_builder |
| ENT-029 | Incident | D-06 | linked | org(+project) | Detected→Triaged→Investigating→Remediated→Resolved (PROPOSED) | High | RCA dirs |
| ENT-030 | Release | D-06 | Project | org/project | Staged→Gated→Released/Rejected (PROPOSED) | High | A.17 |
| ENT-031 | Environment | D-06 | Organization | org | Active/Decommissioned (UNRESOLVED) | High | A.18 |
| ENT-032 | VerificationRun | D-06 | Project/Release | project | Queued→Running→Passed/Failed; evidence immutable | Medium | A.17 |
| ENT-033 | ObservabilityEvent | D-06 | Environment | org | Observed→Triaged; payload immutable | Medium | A.63 refs |
| ENT-034 | AuditEvent | D-08 shared | target | org(+ws/project) | Recorded append-only; whole record immutable | High | A.21/A.33/A.43 |
| ENT-035 | Dataset | D-07 | Organization | org | Cataloged→Governed/Deprecated (UNRESOLVED) | High | A.64 |
| ENT-036 | LineageEdge | D-07 | Dataset | org | Recorded append-only | Medium | A.64 |
| ENT-037 | QualityContract | D-07 | Dataset | org | Active/Violated (UNRESOLVED) | Medium | data_quality dirs |
| ENT-038 | DataPolicy | D-07 | Organization | org | Active/Revoked | High | A.64 |
| ENT-039 | Decision/Outcome/Briefing | D-07 | Organization | org | Recorded→Superseded (UNRESOLVED) | Medium | A.67/A.10 |
| ENT-040 | DeveloperProfile/Skill/Assignment | D-04 | Organization | org | Active/Assigned/Unavailable (UNRESOLVED) | Medium | doc_1, ADR 0008 |
| ENT-041 | ApiCredential | D-08 | Organization | org | Issued→Active→Revoked | High | api_catalog dirs |
| ENT-042 | Integration/Notification/Setting | D-08 | Organization | org | Configured/Disabled (UNRESOLVED) | Medium | admin console |
| ENT-043 | Invoice | — | — | — | WEAK evidence, NOT canonical, UNRESOLVED | — | billing dirs only |

Terminology: developer≡engineer (DeveloperProfile canonical, ADR 0008); workspace≠project; proposal≠contract (A.43); deployment≠release; verification≠approval. A.9/A.21 layered (ADR 0004).
