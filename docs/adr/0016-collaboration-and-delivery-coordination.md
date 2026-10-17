# ADR 0016 — Collaboration & Delivery Coordination (Phase 9)

- **Status:** Accepted
- **Date:** 2026-10-17
- **Phase:** 9

## 1. Context

Phase 8 established the domain kernel
`Organization → Workspace → Project → ClientRequest → Requirement → Proposal →
Contract → Task → Patch → Review → Deployment`. Multiple humans must now work
together on that kernel without introducing AI runtime, billing, or messaging
infrastructure. Evidence: project grants (`010_project_grants.sql`),
single-assignee `engineering_tasks.assignee_user_id` (013), append-only audit,
`domain_idempotency` ledger, optimistic `version` columns, cursor conventions
(default 20, max 100).

## 2. Decision — collaboration boundary

Phase 9 owns: project participation (derived), task assignment, comments,
mentions (validated, undelivered), activity timeline, human approvals/review
collaboration, delivery-visibility reads, audit, and a notification intent seam
(`activity_events` rows only — no providers, workers, or brokers).

## 3. Participation (derived, not duplicated)

No new membership table. Participation is derived:
`Principal → Membership (active, org-scoped) → Project Grant (active,
org-bound by DB trigger) → Collaboration Action`.
`GET members` projects distinct users with membership status + active grants.
Add/remove participant = grant/revoke; suspend/remove = membership
transitions. Revoked/suspended identities fail closed for new actions;
history keeps `author_user_id`.

## 4. Assignment (single assignee)

`engineering_tasks.assignee_user_id` stays canonical; `task_assignments` is an
append-only history ledger mirrored onto the task row in one transaction.
Multi-assignee rejected (no evidence). Assignee needs active membership AND
task-update authority; cross-org or suspended assignees are 409. Only holders
of new `engineering.task.assign` (owner/manager/developer) may assign.

## 5. Comments

`comments`: immutable `author_user_id`, server-derived org+project from the
target, allowlisted `target_type` (project|task|requirement|proposal|patch|
review), body 1..4000, `mentions TEXT[]`, `status active|edited|archived`,
`version`. Org/project equality verified in-transaction; mismatch is 409.
Edits are version-pinned (author or member.update holder); deletes tombstone
(status → archived, body retained).
## 6. Activity + notification seam

`activity_events`: tenant+project scoped, actor-aware, keyset-ordered
`(created_at DESC, id DESC)`, secret-free `summary JSONB`. Types cover
project/participant/task/comment/review/patch/contract/deployment milestones.
Written in the SAME transaction as the mutation. Audit stays the security
record; activity is the human projection. A later phase consumes these rows
as intents — no providers/workers now.

## 7. Mentions, approvals, authz

Mentions are validated references: each user needs active org membership;
cross-org/hidden users are 409 and never enumerated. Approvals are domain
operations via version-pinned `reviews.decide` with server-stamped actor;
`Review != Comment`. New permissions: `engineering.task.assign`,
`collaboration.comment.read|create|update`, `collaboration.activity.read`
(owner/manager/developer full; designer read/create; client/support/auditor
read-only). Cross-tenant reads are 403, never 404 oracles.

## 8. Retention, concurrency, idempotency, pagination

No hard deletes; retention windows UNRESOLVED/deferred. Optimistic `version`
(stale gives 409). Retry-safe mutations accept `Idempotency-Key` via the
existing `domain_idempotency` ledger (`collab:*` scopes). Keyset cursor over
`(created_at DESC, id DESC)`, base64url, default 20 max 100.

## 9. Rejected / deferred

Rejected: separate project_members table, multi-assignee, free-form
polymorphism, hard deletes, brokers, email/SMS/push, duplicating audit as
activity, second task system. Deferred: notification delivery, AI runtime,
GitHub, billing, frontend, mobile, observability, retention policy.


