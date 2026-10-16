# Interface Contract — Commercial Intake to Contract (SCR-020..024)
## Actor: client, sales/ops, approver.
## Inputs: request brief, requirements, proposal draft, signature.
## Outputs: ProposalVersion chain, Contract package, Project creation trigger.
## Actions: submit request, elaborate requirements, draft/revise proposal, internal review, send, client approve, authorize contract.
## Preconditions: org context; prior stage artifact pinned.
## Permissions: client submits/approves own; ops drafts; internal review role-gated.
## States: loading, empty, populated, error, processing (review), success (approved/contract-ready), failed (rejected→revision), stale (superseded version).
## Transitions: revision→new version+diff; approval→contract; contract→project trigger.
## Data: ClientRequest, Requirement, Proposal, ProposalVersion, Contract, Approval (conceptual).
## Audit: every review/approval immutable + version-pinned (A.43).
