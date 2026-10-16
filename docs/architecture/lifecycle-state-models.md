# Lifecycle / State Models — Phase 4
Date 2026-10-16. Conceptual only. PROPOSED labels marked where interface states inferred.

## Proposal/Contract (EXPLICIT A.43)
Proposal: Draft→InternalReview→Sent→ClientApproved/Rejected; revision→new ProposalVersion+diff. Contract: Ready→Signed→Active. Actors: ops draft, reviewer gates, client signs. Audit each gate, version-pinned.
## Engineering (EXPLICIT A.8/A.9)
EngineeringTask: Planned→InProgress→InReview→Done. ExecutionTask: Queued→Running→Verified/Failed; fail→replan/escalate. CodePatch: Proposed→Approved/Applied/Superseded. Review: Requested→Approved/ChangesRequested. Deployment (PROPOSED labels): Triggered→Running→Succeeded/Failed→RolledBack.
## Agent lifecycle (EXPLICIT A.21)
AgentRun: Planning→WaitingApproval→Executing→Succeeded/Failed/Halted. Plan: Proposed→Approved/Denied/Superseded. Denial→replan; budget breach→halt; every tool call audited. Approval: Requested→Approved/Denied (immutable).
## Verification/Release (A.17 EXPLICIT verify; gate policy UNRESOLVED)
VerificationRun: Queued→Running→Passed/Failed. Release (PROPOSED): Staged→Gated→Released/Rejected.
## Incident (INFERRED dirs + A.19 refs; severity UNRESOLVED → PROPOSED)
Detected→Triaged→Investigating→Remediated→Resolved; escalate on failure; timeline audited.
## Invitation/Membership (EXPLICIT org-arch-doc)
Invitation: Sent→Accepted/Expired/Revoked; expired→resend. Membership: Active→Suspended→Removed.
## Data governance (EXPLICIT A.64; steward roles UNRESOLVED)
Dataset: Cataloged→Governed; QualityContract: Active→Violated; Policy: Active→Revoked; enforcement audited.
