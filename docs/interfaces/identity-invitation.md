# Interface Contract — Identity & Invitation (SCR-001..006)
## Identity: login/sign-up/verify/invite/members/governance. Surface Identity.
## Actor: user, invited user, org-admin, sec-admin.
## Inputs: credentials (mechanism UNRESOLVED), verification factor, invitation token, role assignment.
## Outputs: session context (conceptual), membership Active, audit event.
## Actions: sign up, log in, verify, accept invitation, assign/suspend member, step-up auth.
## Preconditions: org exists (except create); invitation Sent (for accept).
## Permissions: self enroll; admin invite/manage; step-up for sensitive.
## States: loading, empty, populated, error, success, unauthorized, forbidden, processing, expired (invitation), revoked.
## Transitions: success→org dashboard/switcher; expired→resend; denied→forbidden+audited.
## Data: User, Member, Role, Invitation, AuditEvent (conceptual only, no schemas).
## Audit: every login, invite, role change, step-up logged (A.33).
