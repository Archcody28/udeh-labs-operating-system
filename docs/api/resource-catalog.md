# API Resource Catalog — Phase 4 (updated Phase 9: implemented collaboration)

Date 2026-10-16, Phase 9 additions 2026-10-17.

| ID | Resource | Domain | Entity | Scope | Ops (conceptual) | Workflows |
|---|---|---|---|---|---|---|
| R-01 | organizations | D-02 | ENT-004 | tenant | create/read/update, switch-context | W-02/W-03 |
| R-02 | workspaces | D-02 | ENT-005 | org | create/read/archive | W-03 |
| R-03 | projects | D-02 | ENT-006 | org+ws | create/read/archive | W-04 trigger |
| R-04 | memberships/invitations | D-01/D-02 | ENT-002/003 | org | invite/accept/role-change/suspend | W-02 |
| R-05 | client-requests | D-03 | ENT-007 | org/ws | submit/read/elaborate | W-04 |
| R-06 | requirements | D-03 | ENT-008 | org/ws | create/accept | W-04/W-06 |
| R-07 | proposals+versions | D-03 | ENT-009/010 | org | draft/revise/review/send/approve | W-04 |
| R-08 | contracts | D-03 | ENT-011 | org | authorize/sign/read | W-04 |
| R-09 | approvals | shared | ENT-012 | org+target | request/decide/read | W-04/W-09 |
| R-10 | tasks (eng+exec) | D-04 | ENT-014/015 | project | plan/start/verify | W-06 |
| R-11 | patches+reviews | D-04 | ENT-016/017 | project | propose/review/apply | W-06 |
| R-12 | deployments | D-04/D-06 | ENT-018 | project+env | trigger/read/retry/rollback-concept | W-07/W-11 |
| R-13 | agents/versions/policies | D-05 | ENT-020/021/024 | project | define/provision/bind/revoke | W-08 |
| R-14 | agent-runs/plans/results | D-05 | ENT-022/023/025 | project | plan/request-approval/execute/halt/verify | W-08/W-09 |
| R-15 | orchestration-sessions | D-05 coord | ENT-019 | project | open/assign/escalate/close | W-06 |
| R-16 | incidents | D-06 | ENT-029 | org(+proj) | detect/triage/remediate/resolve | W-10 |
| R-17 | releases/verification-runs | D-06 | ENT-030/032 | project | run-suite/gate/release | W-07/W-11 |
| R-18 | datasets/lineage/quality/policies | D-07 | ENT-035-038 | org | catalog/record/evaluate/enforce | W-12 |
| R-19 | decisions/outcomes/briefings | D-07 | ENT-039 | org | record/read | W-12 |
| R-20 | audit-events | D-08 | ENT-034 | org(+ws/proj) | read-only (append by system) | all |
| R-21 | api-credentials/integrations | D-08 | ENT-041/042 | org | issue/revoke/configure | W-13 |
| R-22 | workforce (profiles/skills) | D-04 | ENT-040 | org | assign/update-availability | W-02/W-06 |


| R-23 | project-members (derived) | D-04 collab | grants+memberships | project | list (grants manage via existing endpoints) | W-06 |
| R-24 | task-assignments | D-04 collab | engineering_task + ledger | project | assign/reassign/unassign (idempotent, version-pinned) | W-06 |
| R-25 | comments | D-04 collab | comment | project+target | create/list/edit/tombstone, validated mentions | W-06 |
| R-26 | activity-timeline | D-04 collab | activity_event (intent seam) | project | read keyset feed, filter by type | W-06 |
| R-27 | delivery-summary | D-04 collab | engineering_task projection | project | read-only aggregation | W-06 |

Invoice/billing excluded (weak evidence, UNRESOLVED). Each resource maps to entity + owning domain per checklist.
