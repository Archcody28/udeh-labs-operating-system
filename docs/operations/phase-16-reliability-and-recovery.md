# Phase 16 Reliability, Resilience and Disaster Recovery

Date 2026-10-20. Operational contract for Phase 16: bounded execution,
graceful shutdown, crash recovery, degraded modes, and the runbook for
backup/restore, integrity checks and escalation.

This phase adds **no new infrastructure**. Every mechanism below extends
mechanisms that already exist (PostgreSQL-backed outbox, leases, retry
policy, idempotency ledger, health/readiness probes, structured logging and
metrics). No Redis, no Kafka, no second queue, no duplicate worker.

## 1. What changed and why

| Failure domain | Before | After |
|---|---|---|
| Process shutdown | `worker.stop()` was synchronous; in-flight work was abandoned mid-claim; no deadline | Ordered drain (`stop_http` -> `stop_worker` -> `close_pool`) bounded by `SHUTDOWN_TIMEOUT_MS`; a second signal forces the exit |
| Crash / OOM kill | Rows stuck in `processing` until their lease expired | `recoverStaleClaims()` runs before the worker starts and reclaims expired claims immediately |
| Hung provider | `provider.send()` had no deadline; one slow provider pinned a worker slot and its delivery lease | Every provider call is bounded by `NOTIFICATION_PROVIDER_TIMEOUT_MS`; a timeout is a **retryable** `timeout` failure, never a dead-letter |
| Hung dependency probe | `SELECT 1` with no deadline; a hanging probe looked like a hang, not a failure | Readiness check is bounded by `READINESS_TIMEOUT_MS` and **fails closed** (timed-out dependency = down) |
| Database outage | Pool `error` events were unhandled -> Node crashed the process on an idle-client failure | Pool errors are observed and logged; the process survives and keeps serving |
| Slow query | One pathological query could pin a pool slot forever | `statement_timeout` on every pooled connection (`PG_STATEMENT_TIMEOUT_MS`, default 15s) |
| Dispatch hot loop | A failed tick retried at the same rate forever | Consecutive failures escalate the tick delay exponentially (capped) and reset on success |
| Transient DB errors | Every transient error surfaced to the caller | `isRetryableDbError()` classifies transient vs terminal; `withDbRetry()` retries only the safe ones |
| **Double delivery** | The provider deadline and the claim lease were independent, so a slow provider could outlive its lease and a second worker would re-claim the row and send the notification **twice** | The effective lease is always at least twice the provider deadline, so a provider call can never outlive its claim |
| Slow client | No socket deadlines; a client that never sent a request pinned a file descriptor | `requestTimeout` / `headersTimeout` / `keepAliveTimeout` on the HTTP server |
| Oversized body | The body reader kept accumulating after rejecting, so a hostile client could still stream unbounded data into memory | The reader becomes inert once the limit is exceeded |

## 2. Configuration

All knobs are environment variables, clamped to a safe range. Out-of-range
values are clamped, never trusted.

| Variable | Default | Range | Meaning |
|---|---|---|---|
| `SHUTDOWN_TIMEOUT_MS` | 10 000 | 100 - 300 000 | Hard deadline for the whole shutdown drain |
| `READINESS_TIMEOUT_MS` | 2 000 | 100 - 60 000 | Deadline for the readiness dependency check |
| `NOTIFICATION_PROVIDER_TIMEOUT_MS` | 10 000 | 100 - 600 000 | Deadline for a single provider call |
| `NOTIFICATION_LEASE_MS` | 60 000 | 1 000 - 3 600 000 | Claim lease on an outbox / delivery row |
| `PG_STATEMENT_TIMEOUT_MS` | 15 000 | 1 000 - 600 000 | Server-side statement timeout on pooled connections |
| `NOTIFICATION_WORKER_ENABLED` | `true` | boolean | Run the in-process dispatcher |
| `NOTIFICATION_WORKER_INTERVAL_MS` | 1 000 | 50 - 600 000 | Dispatch tick period |
| `NOTIFICATION_WORKER_BATCH_SIZE` | 25 | 1 - 100 | Rows claimed per stage per tick |

**Sizing guidance.** `SHUTDOWN_TIMEOUT_MS` must be **less than** the
orchestrator's termination grace period (Kubernetes `terminationGracePeriodSeconds`,
default 30s), otherwise the orchestrator SIGKILLs the process before the
drain finishes and the graceful path never completes. A safe default is
`SHUTDOWN_TIMEOUT_MS = 10000` with a grace period of at least 20s.

### The lease / provider-deadline invariant

**`NOTIFICATION_PROVIDER_TIMEOUT_MS` must be strictly less than the
effective lease.** The platform enforces this itself: the effective lease is
`max(NOTIFICATION_LEASE_MS, 2 * NOTIFICATION_PROVIDER_TIMEOUT_MS)`.

The reason is a double delivery. A delivery row is claimed with a lease. If a
provider call is still in flight when the lease expires, another worker
re-claims the row and calls the provider a second time. The delivery id is the
provider idempotency key, so a duplicate call *may* be deduplicated by the
provider - but the platform must not depend on a provider honouring that key
to avoid sending a user two copies of the same notification.

The invariant is enforced in two places, so it holds regardless of the entry
point:

- `loadConfig()` derives the effective lease and clamps the provider deadline
  to it (`services/api/src/config.ts`);
- `dispatchOnce()` derives them again from its own options
  (`services/api/src/domain/notificationService.ts`), so a direct call with
  conflicting values is still safe.

The regression test `stretches the lease so a slow provider call cannot be
re-claimed` in `services/api/src/tests/reliability.integration.test.ts` fails
if the stretch is removed.


## 3. Graceful shutdown

`SIGINT` / `SIGTERM` trigger one ordered sequence:

1. `stop_http` - close the listener; idle keep-alive sockets are closed too.
2. `stop_worker` - stop the dispatch timer and **await the in-flight tick**, so
   no claim is abandoned mid-processing.
3. `close_pool` - release all PostgreSQL connections.

Properties:

- **Failure isolated.** A step that throws is recorded and the sequence
  continues; one broken resource cannot prevent the others from being released.
- **Deadline enforced.** If the whole drain exceeds `SHUTDOWN_TIMEOUT_MS`
  the process exits immediately with code 1 and the `forced` outcome is
  recorded. A hung shutdown is worse than a truncated one.
- **Idempotent.** A second signal escalates to an immediate forced exit.

Metric: `udehlabs_shutdown_events_total{result="graceful"|"forced"|"step_failed"}`.

## 4. Crash recovery

The durable pipeline is at-least-once with a lease. A row in `processing`
whose `claim_expires_at` is in the past was abandoned by a crash.

`recoverStaleClaims()` (called at process start, before the worker starts):

- resets expired `processing` rows in `outbox_events` and
  `notification_deliveries` to `retryable_failure` with
  `next_attempt_at = now()`, releasing `claimed_by` and recording
  `last_error_code = 'stale_claim'`;
- **never** touches a row whose claim is still live - another worker may
  legitimately be mid-flight;
- **never** marks a row complete - recovered work is re-dispatched, not
  falsely reported as successful.

Because recovery is idempotent and creation is idempotent (unique per
`(notification, channel)`; provider idempotency key = delivery id), a
recovered event produces exactly one notification and one delivery.

Metrics: `udehlabs_notification_worker_ticks_total{result="recovery"}`,
`udehlabs_notification_recovered_claims_total{kind="outbox"|"delivery"}`.

**Note:** recovery is a convenience, not the safety net. The lease expiry
alone already guarantees eventual reclamation; recovery just makes it happen
immediately instead of after up to one lease period.

### What recovery deliberately does NOT do

- It does not mark a row `dispatched` or `delivered`. Recovered work is
  re-dispatched; a recovered row is never falsely reported as successful.
- It does not touch a row whose claim is still live. Another worker may
  legitimately be mid-flight on it.
- It does not resurrect a dead-lettered row. A dead letter is terminal by
  design and is replayed only deliberately, by an operator, under the runbook
  in section 10.

The safety net underneath all of this is the **at-least-once** contract: a
row may be processed more than once, but it is never processed *less* than
once, and it is never processed *concurrently* by two workers (the claim is
exclusive, and the provider deadline always fits inside the lease).


## 5. Bounded execution contract

`withTimeout(fn, ms, operation)` **rejects** with `TimeoutError` when the
deadline is hit. It never resolves with a fabricated value, so a caller can
never mistake "timed out" for "succeeded".

`withRetry(fn, {attempts, isRetryable})` retries only failures the caller
classifies as transient, with bounded exponential backoff.

**Rule:** an operation with a non-idempotent external side effect must not be
retried unless it carries an idempotency key. The notification pipeline
satisfies this (the delivery id *is* the provider idempotency key); other
call sites must use the `domain_idempotency` ledger instead.

## 6. Degraded modes

The system is designed to degrade rather than fail hard.

| Condition | Behaviour | Operator signal |
|---|---|---|
| PostgreSQL unreachable | `/ready` returns 503 (fails closed); `/health` still returns 200 (liveness is dependency-free, so the orchestrator does not restart a healthy process) | `udehlabs_readiness_dependency_up{dependency="postgres"} = 0` |
| Readiness probe hangs | The check times out and the dependency is reported **down** | Same gauge; the probe never hangs |
| A provider hangs | The call is abandoned at the deadline, the delivery is rescheduled with backoff | `udehlabs_notification_provider_timeouts_total{channel=...}` |
| A provider is misconfigured | The delivery is dead-lettered with a terminal code (`provider_unavailable`, `authentication_failed`) - retried work is not retried forever | `udehlabs_notification_dispatch_total{result="dead_letter"}` |
| The dispatcher is down | Events accumulate in `outbox_events` as `pending`; no data is lost, and the backlog drains when a worker returns | `udehlabs_notification_worker_ticks_total{result="ok"}` stops advancing |
| A worker crashes mid-batch | The abandoned rows are reclaimed at startup (see section 4) | `udehlabs_notification_recovered_claims_total` |
| An idle pooled connection dies | The pool discards the client and reconnects; the process does **not** crash | `db.pool_error` log record |
| A slow query | The server cancels it after `PG_STATEMENT_TIMEOUT_MS` | PostgreSQL log; `isRetryableDbError` classifies `57014` as transient |

**Escalation ladder.** A stuck dispatcher is a backlog problem, not an outage:
the API stays healthy and the backlog drains on recovery. Escalate to a
page only when `/ready` is failing (the API cannot serve) or when the
dead-letter rate is sustained (the pipeline is lossy).

## 7. Backup and restore

The system of record is PostgreSQL. Backups are the operator's
responsibility; this section states the minimum contract.

- **Backup type:** a physical base backup (or `pg_dump` for small instances)
  taken at least daily, plus continuous WAL archiving for a production
  instance. Point-in-time recovery requires WAL archiving; a nightly dump
  alone gives only RPO = 24h.
- **Scope:** the whole database. `domain_events`, `outbox_events`,
  `notifications` and `notification_deliveries` must be restored together -
  they are referentially linked, and restoring one without the others
  produces an inconsistent pipeline.

## 8. RPO / RTO

| Objective | Target | Basis |
|---|---|---|
| **RPO** (max data loss) | 5 minutes | WAL archiving interval; the outbox means an unsent event is not lost, only delayed |
| **RTO** (max downtime) | 30 minutes | Detection + restore + migration verification |
| Notification delivery lag | < 5 minutes under normal operation | Dispatch tick is 1s; the backlog drains at the batch rate |
| Recovery of stranded work | < 1 lease period (60s), or immediately on restart | Lease expiry plus startup recovery |

The outbox is what makes the RPO achievable without distributed transactions:
a business mutation and its event commit in ONE database transaction, so
either both are durable or neither is. A notification is therefore never
"sent but not recorded" nor "recorded but never sendable".

## 9. Integrity checks

Run after every restore and at least weekly in production.

```sql
-- 1. Every outbox row references a real event (FK RESTRICT guarantees it,
--    but assert the count explicitly).
SELECT count(*) FROM outbox_events o
  LEFT JOIN domain_events e ON e.id = o.event_id WHERE e.id IS NULL;

-- 2. No row is stranded in `processing` with an expired claim
--    (should be zero after startup recovery has run).
SELECT count(*) FROM outbox_events
  WHERE status = 'processing' AND claim_expires_at <= now();
SELECT count(*) FROM notification_deliveries
  WHERE status = 'processing' AND claim_expires_at <= now();

-- 3. No delivery is orphaned from its notification.
SELECT count(*) FROM notification_deliveries d
  LEFT JOIN notifications n ON n.id = d.notification_id WHERE n.id IS NULL;

-- 4. The append-only ledgers are intact (a mutation here means tampering).
--    The immutability triggers raise on UPDATE/DELETE; a non-zero count
--    would mean the trigger was removed.
SELECT count(*) FROM domain_events;
SELECT count(*) FROM notification_provider_operations;
```

Also verify the migration journal is complete:

```bash
npm run migrate --prefix services/api
node services/api/scripts/verify-migrations.mjs
```

The migration count is asserted by `scripts/verify-migrations.mjs`; update
that assertion whenever a migration is added.

## 10. Escalation runbook

**Symptom: `/ready` returns 503.**

1. Check `udehlabs_readiness_dependency_up{dependency="postgres"}`.
2. Check the database: is it up, is it accepting connections, is it out of
   connections (`53300`)?
3. Check the pool: `PGPOOL_MAX` (default 10). A saturated pool plus a slow
   query looks like an outage; `PG_STATEMENT_TIMEOUT_MS` bounds it.
4. Check `db.pool_error` log records - a burst means the database is
   dropping connections (restart, failover, network).

**Symptom: notifications are not being delivered, but the API is healthy.**

1. Check `udehlabs_notification_worker_ticks_total` - is it advancing?
   If not, the worker is dead or the database is unreachable from it.
2. Check `outbox_events` for rows in `pending` (backlog) vs
   `retryable_failure` (repeated failures).
3. Check `notification_deliveries` for `dead_letter` rows and read
   `last_error_code`:
   - `provider_unavailable` / `authentication_failed` - operator error
     (credential or transport not wired). Fix the configuration.
   - `invalid_recipient` / `recipient_unavailable` - terminal, expected.
   - `timeout` - the provider is slow; consider raising
     `NOTIFICATION_PROVIDER_TIMEOUT_MS`.
4. A `dead_letter` row is terminal by design. To replay one after fixing
   the cause, reset it deliberately:
   `UPDATE notification_deliveries SET status='pending', attempt_count=0, next_attempt_at=now() WHERE id = '<id>';`
   Record the replay in the change log - dead-letter replay is a manual,
   audited operation, not an automatic one.

**Symptom: the process is restarting repeatedly.**

1. Distinguish a crash from an orchestrator restart: check for
   `shutdown.signal` / `shutdown.complete` log records (graceful) versus
   `db.pool_error` or a stack trace (crash).
2. If the process is being killed without a `shutdown.signal` record, the
   orchestrator's grace period is too short or the drain exceeded
   `SHUTDOWN_TIMEOUT_MS`. Raise the grace period first, then the timeout.

**Symptom: recovery after a crash.**

1. The new process logs `notification.startup_recovery` with the recovered
   counts.
2. Verify with the integrity checks in section 9 (checks 2 and 3).
3. Confirm the backlog drains: `udehlabs_notification_worker_ticks_total`
   advances and `outbox_events` pending count falls.

**Symptom: a user reports receiving the same notification twice.**

This is the highest-severity symptom of this phase. The platform is designed
so it cannot happen (exclusive claim + a provider deadline that always fits
inside the lease), so investigate it as a configuration or version problem.

1. Confirm the deployed `NOTIFICATION_PROVIDER_TIMEOUT_MS` and
   `NOTIFICATION_LEASE_MS`. The effective lease is
   `max(NOTIFICATION_LEASE_MS, 2 * NOTIFICATION_PROVIDER_TIMEOUT_MS)`, so a
   provider deadline above the lease is the first thing to rule out.
2. Check `notification_provider_operations` for the delivery: it is
   append-only and records every provider attempt. More than one `accepted`
   row for the same `delivery_id` means the provider was called twice.
3. Check whether two dispatcher processes were running against the same
   database with different configuration. Two workers are safe ONLY if they
   share the same effective lease; a worker on old configuration (short
   lease) racing a worker on new configuration (long provider deadline) can
   double-deliver.
4. Check `udehlabs_notification_provider_timeouts_total`. A timeout
   immediately followed by a second call for the same delivery is the
   signature of a provider call that outlived its claim.

**Symptom: the process is killed without a graceful shutdown.**

1. No `shutdown.signal` record means the process did not receive a signal -
   it was SIGKILLed (OOM) or the orchestrator's grace period expired.
2. Check for an OOM kill first: the `statement_timeout` and the bounded
   provider deadline exist partly to stop a single operation from exhausting
   memory.
3. If the grace period expired, raise `terminationGracePeriodSeconds`
   (not `SHUTDOWN_TIMEOUT_MS`) so the drain can finish.

## 11. Verification

The Phase 16 suites are deterministic and run in CI on every push:

| Suite | Kind | Covers |
|---|---|---|
| `dist/tests/reliability.unit.test.js` | no DB | bounded execution, retry classification, shutdown ordering and failure isolation, the real-socket drain, config clamping, the lease/provider invariant, metric vocabulary |
| `dist/tests/reliability.integration.test.js` | real PostgreSQL | crash recovery, stale-claim reclamation, live-claim safety, no double delivery under a worker race, the lease stretch, provider deadline handling |

Both are wired into `.github/workflows/runtime-foundation.yml`.

To reproduce locally against a real PostgreSQL:

```bash
npm run build --prefix services/api
export DATABASE_URL=postgresql://udehlabs:udehlabs_dev@localhost:5432/udehlabs_dev
node services/api/dist/persistence/migrate.js
node --test services/api/dist/tests/reliability.unit.test.js
node --test services/api/dist/tests/reliability.integration.test.js
```

## 12. Related documents

- `docs/operations/phase-15-observability.md` - logging, metrics, probes.
- `docs/operations/phase-14-notification-delivery.md` - the notification pipeline.
- `docs/architecture/transaction-conventions.md` - transaction boundaries.
- `docs/architecture/persistence-architecture.md` - persistence boundaries.
- `docs/development/database.md` - local database and migration commands.
- `docs/api/idempotency-and-concurrency.md` - idempotency guarantees.

### Backup verification and encryption

- **Verification:** a backup that has never been restored is not a backup.
  Restore into a scratch instance at least quarterly and run the migration
  verification plus the integration suites against it.
- **Encryption:** backups and WAL archives contain PII (names, email
  addresses, notification bodies). They must be encrypted at rest and
  access-controlled to the same standard as the primary database.
