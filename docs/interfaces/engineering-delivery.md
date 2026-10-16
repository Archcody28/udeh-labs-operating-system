# Interface Contract — Engineering Delivery (SCR-030..036)
## Actor: developer, lead/EM, reviewer.
## Inputs: architecture/requirements context, task scope, code patch, review decision.
## Outputs: Verified Change, Review record, Deployment trigger.
## Actions: plan sprint, execute in workspace, propose patch, request review, approve/apply, trigger deploy.
## Preconditions: project exists; task authorized path scope; A.17 verification available.
## Permissions: org-scoped developer; least-privilege repo paths (A.24).
## States: loading, empty (no tasks), populated, processing (running/verifying), success, failed (tests/conflict), stale (superseded patch), forbidden.
## Transitions: fail→replan/escalate; approve→deploy center; persistent fail→human escalation (A.9 supervisor).
## Data: Project, Milestone, EngineeringTask, ExecutionTask, CodePatch, Review, DeveloperProfile/Skill (conceptual).
## Audit: propose/review/apply + workforce assignment logged.
