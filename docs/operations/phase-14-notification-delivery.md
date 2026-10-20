# Phase 14 Notification Delivery — Operations Guide

Date 2026-10-20. Operational contract for the Phase 14 tenant-safe, durable
notification/event-delivery pipeline. Extends (never rewrites) the Phase 5
persistence and transaction conventions.

Scope: how to run the dispatcher, configure providers, roll the migrations
forward, validate them, and monitor failures.

## 1. Architecture at a glance

Two-stage, database-backed pipeline. Every stage is durable and restartable.

```
business mutation
  └─ publishDomainEvent(tx, ...)   ── ONE transaction ──┐
       ├─ domain_events row (immutable, append-only)    │
       └─ outbox_events row (1:1, dispatch state)        │
                                                         ▼
                              Stage 1 — ROUTE (dispatcher)
                              claim outbox (FOR UPDATE SKIP LOCKED)
                              resolve route → resolve+authorize recipients
                              create notification + delivery rows (idempotent)
                              mark outbox dispatched
                                                         ▼
                              Stage 2 — DELIVER (dispatcher)
                              claim deliveries (FOR UPDATE SKIP LOCKED)
                              re-verify recipient (membership + user status)
                              provider.send(...)   ← OUTSIDE any transaction
                              record provider operation
                              success | bounded backoff retry | dead-letter
```

Hard rules, enforced in code and covered by tests:

- **No transaction is ever held open across a provider call.** Stage 2 calls
  `provider.send()` outside any DB transaction; the provider operation ledger
  is written afterwards.

## 2. Running the dispatcher

The dispatcher runs in-process by default. It is safe to run several API
processes concurrently — claiming is atomic.

| Env var | Default | Meaning |
| --- | --- | --- |
| `NOTIFICATION_WORKER_ENABLED` | `true` | Run the dispatcher in this process. Set `false` to run it as a separate deployment and keep the API process as read/write only. |
| `NOTIFICATION_WORKER_INTERVAL_MS` | `1000` | Tick period of one dispatch cycle. Clamped to `50..600000`. |
| `NOTIFICATION_WORKER_BATCH_SIZE` | `25` | Max rows claimed per stage per tick. Clamped to `1..100`. |

Recommended split at scale: run the API with `NOTIFICATION_WORKER_ENABLED=false`
and run one or more dedicated worker processes with it enabled. Shutdown is
graceful — `SIGINT`/`SIGTERM` stops the tick loop and closes the pool.

Tick failures never kill the loop: a failing tick is logged
(`notification dispatch tick failed`) and the next tick retries. A row that
fails routing is retried at the outbox level with backoff.

## 3. Provider configuration

The core is provider-neutral: it MUST NOT import SendGrid/Resend/SES types.
Adapters live in `services/api/src/domain/notificationProviders/`.

- **`in_app`** — always registered, never needs credentials. This is the
  default provider in CI and local runs. The in-app channel is "delivered" the
  moment the notification row exists, but it still travels the full
  claim → provider → ledger → completion path so the pipeline is exercised
  uniformly.
- **`email`** — registered always, but sends only when BOTH a transport and a
  credential are wired:
  - transport: injected at composition time via `setEmailTransport(transport)`
    in `notificationBootstrap.ts`;
  - credential: resolved **by reference** through the existing `SecretVault`
    under `notification:email:provider-credential`
    (`EMAIL_CREDENTIAL_REF` in `emailProvider.ts`).

With no transport or no credential, email deliveries fail closed with the
terminal code `provider_unavailable` and are dead-lettered — they are never
silently dropped, and in-app delivery is unaffected. Credentials are never
written to rows, logs, or payloads; only safe error codes and request
fingerprints are stored in `notification_provider_operations`.

Adding a real provider (SendGrid, Resend, SES) means replacing the body of
`EmailProvider.send` — or registering a new provider and pointing the channel

## 4. Migration rollout

Phase 14 ships two forward-only migrations:

| Migration | Contents |
| --- | --- |
| `022_notifications_outbox.sql` | `domain_events`, `outbox_events`, `notifications`, `notification_deliveries`, `notification_preferences`, `notification_provider_operations` + immutability triggers and indexes. |
| `023_notifications_outbox_actor_fix.sql` | Relaxes `domain_events.actor_user_id` from `UUID REFERENCES users(id)` to `TEXT` and drops the incompatible FK. |

### 4.1 Why `023` exists

`022` originally typed the actor column as a `users` FK. That is too narrow:
an actor may be a human user id, an agent run id, or the literal `"system"`
for service-initiated actions. Storing those raised `22P02` and aborted the
business transaction that published the event.

`domain_events.actor_user_id` is now `TEXT` — an **opaque principal
reference**, matching the repo-wide convention already used by
`audit_events.actor_id` and `engineering_runs.principal_id`.

### 4.2 Rollout order

1. Deploy the code that publishes events (it tolerates both column types).
2. Apply migrations: `npm run migrate --prefix services/api`.
3. Verify: `node scripts/verify-migrations.mjs` (from `services/api`).
4. Deploy/roll the dispatcher.

`023` is idempotent and forward-only: on a database where `022` already ran
with the `UUID` column it drops the FK and converts the column; on a fresh
database where `022` now creates `TEXT` it is a no-op. There is no down
migration — rollback is a forward fix.

### 4.3 Validation

Step 1 — migrations applied. Expect `applied migrations: 23`:

```powershell
node scripts/verify-migrations.mjs
```

Step 2 — the actor column is `TEXT`. Expect `text`:

```powershell
psql -c "SELECT data_type FROM information_schema.columns
         WHERE table_name='domain_events' AND column_name='actor_user_id';"
```

Step 3 — no stray users FK on the actor column. Expect 0 rows:

```powershell
psql -c "SELECT c.conname FROM pg_constraint c
         JOIN pg_class t ON t.oid=c.conrelid
         JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum=c.conkey[1]
         WHERE t.relname='domain_events' AND a.attname='actor_user_id'
           AND c.contype='f';"
```

### 4.4 Rollback / forward-fix procedure

There are no down migrations. If a rollout must be halted:

1. Stop the dispatcher (`NOTIFICATION_WORKER_ENABLED=false`, or stop the
   worker deployment). Events continue to accumulate in `outbox_events` as
   `pending` — nothing is lost, because the outbox row is committed in the
   same transaction as the business mutation.
2. Leave the schema in place. `022`/`023` are additive and the new tables do
   not change existing behaviour.
3. Re-enable the dispatcher once the cause is fixed. Pending rows are picked up
   on the next tick; `next_attempt_at` bounds when they become due.

If `023` itself must be corrected, write a NEW forward migration (`024_…`) —
never edit an applied migration.

default at it with `setChannelDefault`. No core change is required.


## 5. Monitoring failures

All queries below are read-only and safe to run against production.

### 5.1 Outbox backlog (Stage 1)

```sql
SELECT status, count(*), min(next_attempt_at) AS oldest_due
FROM outbox_events
GROUP BY status ORDER BY status;
```

`pending` rows that are not draining mean the dispatcher is down or the
`domain_events` → route mapping is missing for that event type.

### 5.2 Delivery backlog and dead letters (Stage 2)

```sql
SELECT status, count(*)
FROM notification_deliveries
GROUP BY status ORDER BY status;
```

```sql
-- Dead letters with their terminal reason
SELECT d.id, d.channel, d.provider, d.attempt_count,
       d.last_error_code, d.last_error_message, d.dead_lettered_at
FROM notification_deliveries d
WHERE d.status = 'dead_letter'
ORDER BY d.dead_lettered_at DESC
LIMIT 50;
```

### 5.3 Provider outcome histogram

```sql
SELECT provider, channel, result, error_code, count(*)
FROM notification_provider_operations
WHERE created_at > now() - interval '24 hours'
GROUP BY provider, channel, result, error_code
ORDER BY count(*) DESC;
```

Common codes:

| `error_code` | Meaning | Action |
| --- | --- | --- |
| `provider_unavailable` | No transport or credential wired. | Configure transport + `SecretVault` credential. Terminal by design. |
| `invalid_recipient` | Recipient has no address for the channel. | Data issue, not a retry. |
| `authentication_failed` | Provider credentials rejected. | Fix credentials; do not retry blindly. |
| `rate_limited` / `timeout` / `retryable_transport` | Transient. | Retries are automatic with backoff. |
| `recipient_unavailable` | Member removed or suspended between routing and delivery. | Expected during offboarding; no action. |
| `notification_missing` | Parent notification row absent. | Data integrity issue — investigate. |

### 5.4 Expired claims (stuck workers)

```sql
SELECT status, count(*)
FROM outbox_events
WHERE status = 'processing' AND claim_expires_at < now()
GROUP BY status;
```

A non-zero count means a worker died while holding a claim. The lease expires
and the row is reclaimed automatically — this is expected after a crash and
should not be alerted on unless it grows continuously.

### 5.5 Retry policy

Bounded exponential backoff with **deterministic** jitter (derived from a
hash of the row id — no `Math.random`, fully reproducible):

- `maxAttempts`: 5 (`DEFAULT_RETRY_POLICY`)
- `baseDelayMs`: 1000

## 6. Tenant-safety guarantees

These are enforced server-side and covered by the Phase 14 security suite.

- **Recipients are server-resolved.** A user id in an event payload is a
  *hint* only. Before a notification row exists, the resolver verifies an
  ACTIVE membership in the event's organization AND an active user account.
  Cross-tenant ids, forged ids, and removed members resolve to nobody.
- **Malformed ids never reach the database.** Non-UUID payload ids and actor
  ids are rejected before any `uuid`-typed comparison, so they can never
  raise `22P02` or act as an existence oracle.
- **Addresses are never taken from the payload.** The email address is
  resolved server-side at delivery time.
- **Actors are opaque principals.** `system`, agent run ids, and user ids are
  all valid actors; a non-user actor simply has no user recipients.
- **Members only ever see their own notifications.** The list/read routes are
  scoped to the caller's subject id.
- **Cross-member preference reads are admin-only.** Reading another member's
  preferences via `?userId=` requires `notification.admin`; writing is always
  self-only. Without this, any member could enumerate another member's
  notification settings.
- **Unauthenticated requests are rejected** by the org guard on every route.

Permissions: `notification.read` and `notification.preferences.manage` are
granted to every authenticated member; `notification.admin` is owner/admin only.

## 7. API surface

All routes are org-scoped (`/api/v1/organizations/:orgId/...`).

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/notifications` | `notification.read` (own notifications only) |
| POST | `/notifications?action=read-all` | `notification.read` |
| POST | `/notifications/:id/read` | `notification.read` |
| GET | `/notification-preferences` | `notification.preferences.manage` (own; another member's requires `notification.admin`) |
| PUT | `/notification-preferences` | `notification.preferences.manage` (self-only write) |
| GET | `/members/:userId/notification-preferences` | `notification.admin` |

## 8. Auditing

The pipeline writes to the existing immutable `audit_events` log:

- `notification.recipient_unavailable` — delivery refused at delivery time.
- `notification.delivery_dead_lettered` — delivery exhausted its attempts.

Provider operations are recorded separately in
`notification_provider_operations`, an append-only ledger (update/delete are
rejected by trigger).

## 9. Failure modes and what to do

| Symptom | Likely cause | Action |
| --- | --- | --- |
| Outbox `pending` grows, nothing routed | Dispatcher not running | Check `NOTIFICATION_WORKER_ENABLED`; start the worker deployment. |
| Deliveries pile up as `retryable_failure` | Provider transient errors | Check the provider histogram; retries continue automatically. |
| Many `dead_letter` with `provider_unavailable` | Email transport/credential not wired | Configure the transport and the `SecretVault` reference. |
| Events published but never notified | Event type has no route | Add an explicit `RouteSpec` in `notificationRouting.ts`. Routing is explicit — an unknown type is never guessed. |
| Duplicate notifications for one event | Expected under at-least-once | Confirm the provider honours the idempotency key (the delivery id). |
| `22P02` on `domain_events` insert | An old deployment with the `UUID` actor column | Apply `023` and redeploy. |

## 10. Related documents

- `docs/architecture/transaction-conventions.md` — transaction boundaries.
- `docs/architecture/authorization-model.md` — permission model.
- `docs/architecture/tenancy-and-scope-contract.md` — tenant scoping.
- `docs/architecture/audit-event-contract.md` — audit obligations.
- `docs/development/database.md` — local database and migration commands.

- `maxDelayMs`: 300000 (5 minutes cap)
- `jitterRatio`: 0.2 (±20%)

After the attempt budget is exhausted the delivery is dead-lettered. Note the
outbox row itself carries `max_attempts = 8` and the delivery row
`max_attempts = 6`; the domain retry policy bounds the delivery attempts
actually taken.

- **Delivery is at-least-once**, not exactly-once. Provider-level idempotency
  is the mitigation: the delivery id *is* the idempotency key.
- **Two workers never double-deliver.** Claims use `FOR UPDATE SKIP LOCKED`
  plus an ownership token; every completion is guarded by `claimed_by = <token>`.
- **Recipients are re-verified at delivery time.** A member removed or suspended
  between routing and delivery receives nothing (dead-letter
  `recipient_unavailable`).
