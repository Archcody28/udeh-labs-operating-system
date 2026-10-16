# Contract: Commercial (R-05..R-09) — conceptual
Date 2026-10-16. Evidence A.43.

## Submit request / Elaborate / Draft proposal / Revise (new version) / Internal review / Send / Client approve / Authorize contract
- Actor: client (submit/approve own), ops (draft), reviewer (gate).
- Required: org scope; prior artifact pin (e.g. proposalId+version for approval).
- Validation: approval only on Sent version; revision→new ProposalVersion+diff (INV-CON-02); contract sign requires approved version pin.
- Scope: org (+workspace pipeline). Idempotency: send/approve/sign require key.
- Response: resource + state + version chain + approval refs + audit ref. Errors: VALIDATION/403/404/CONFLICT/STATE_TRANSITION_FAILED.
- Example (illustrative): approve proposal v3 → `{ proposalId, version: 3, state: ClientApproved, contract: Ready }`.
