# Transaction Conventions — Phase 5

Use `withTransaction(tx)` from `persistence/db.ts`. Boundaries are explicit at the
use-case level, never hidden inside single-row repositories.

Must be transactional: organization + primary workspace; contract + triggered project;
proposal version + status change; approval decision + audit append; agent run start +
plan pin; deployment trigger + audit. Single-row reads/writes: no transaction.
Never hold a transaction across network calls. Isolation: default READ COMMITTED +
`version` optimistic checks; escalate only with documented reason.
Rollback: any throw → ROLLBACK; callers distinguish `AppError` (domain) from driver
errors (infrastructure).
