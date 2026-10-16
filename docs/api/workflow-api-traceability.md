# Workflow → API Traceability — Phase 4
Date 2026-10-16.

| Workflow | Screen | Entity | Resource | Transition | Audit |
|---|---|---|---|---|---|
| W-01 Auth | SCR-001/002/003 | ENT-001/002 | R-04 | verify→context | login/step-up |
| W-02 Onboarding | SCR-004/005 | ENT-002/003 | R-04 | Sent→Accepted | invite/role |
| W-03 Org setup | SCR-010/014/013 | ENT-004/005 | R-01/R-02 | create/switch | create/switch |
| W-04 Intake→contract | SCR-020/021/022/023 | ENT-007..011 | R-05..R-08 | version→sign | review/approval pinned |
| W-05 Delivery reporting | SCR-024(client dash) | ENT-014/030 | R-10/R-17 | publish→review | publish |
| W-06 Eng delivery | SCR-030/031/033 | ENT-014/015/016/017 | R-10/R-11/R-15 | plan→verify→review | propose/apply |
| W-07 Verification | SCR-052 | ENT-032/030 | R-17 | run→gate | gate evidence |
| W-08 Agent lifecycle | SCR-040/041 | ENT-020..025 | R-13/R-14 | plan→execute | every tool call |
| W-09 Approval | SCR-042 | ENT-012/023 | R-09/R-14 | request→decide | decision |
| W-10 Incident | SCR-051 | ENT-029/033 | R-16 | detect→resolve | timeline |
| W-11 Release | SCR-053/034 | ENT-030/018 | R-17/R-12 | gate→promote | gate+deploy |
| W-12 Data gov | SCR-060/061/062 | ENT-035..039 | R-18/R-19 | catalog→enforce | lineage/policy |
| W-13 Access review | SCR-006/072 | ENT-003/034 | R-04/R-20 | evaluate→grant/deny | grant/deny |

Coverage: all W-* mapped. UNRESOLVED: W-05 cadence, W-07 gate policy, W-10 severity/SLO, W-13 cadence.
