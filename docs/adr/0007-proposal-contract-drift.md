# ADR 0007 — Proposal/Contract Architecture Drift

- **Status:** Proposed (unresolved — no canonical version selected)
- **Date:** 2026-10-16

## Conflicting artifacts

- `stitch_udehlabs_operating_system/udehlabs_proposal_contract_architecture_doc_1.md` (3294 bytes, 43 lines)
- `stitch_udehlabs_operating_system/udehlabs_proposal_contract_architecture_doc_2.md` (3295 bytes, 43 lines)

## Evidence

Both files verified by direct read on 2026-10-16. Identical H1 ("Phase
A.43: Proposal, Estimation & Contract Engine Architecture"), identical
43-line bodies: `IProposalOrchestrator`, `IEstimationEngine`,
`IReviewOrchestrator`, `IContractService`, identical data models
(Proposal/ProposalVersion, Estimate, CommercialTerm) and identical vertical
integrations (A.42, A.40/A.41, A.1). The 1-byte delta matches the pattern
of the execution-architecture pair (ADR 0002): trailing-newline duplication.

## Similarities

Content-identical across all sections.

## Differences

No substantive difference found (1-byte size delta only).

## Unresolved questions

1. Canonical file selection and duplicate disposal.

## Proposed decision

Deduplicate in a later phase. NOT decided here.

## Decision status

PROPOSED. Awaiting confirmation.
