# Contract: Operations (R-12/R-16/R-17) — conceptual
Date 2026-10-16. Evidence A.17/A.18/A.19 refs + RCA dirs.

Trigger/retry deployment (new attempt per retry; rollback separate action); detect/triage/remediate/resolve incidents (PROPOSED states; severity UNRESOLVED); run suite → gate → release (gate policy UNRESOLVED). Actor: developer/SRE/rel-mgr. Scope: project+env (deploy), org(+project) incident. Idempotency on trigger/remediate. Audit: trigger+outcome, timeline, gate evidence.
