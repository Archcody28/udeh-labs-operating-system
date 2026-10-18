# Architecture Decision Records (ADRs)

## What is an ADR?

An Architecture Decision Record is a short, immutable document capturing one
architecturally significant decision: its context, the options considered,
the decision taken, and its consequences. Code outranks documentation, and
repository evidence outranks assumptions — an ADR records what was decided
and why, so future engineers never have to guess.

## When is an ADR required?

An ADR is REQUIRED before:

- selecting frameworks, databases, auth providers, AI providers, or hosting;
- defining service/API boundaries (`apps/*`, `services/*`, `packages/*`);
- resolving any conflict recorded as `Proposed` in this directory;
- changing a decision previously recorded as `Accepted`;
- migrating or restructuring the preserved Stitch prototype export.

An ADR is NOT required for typo fixes, formatting, or purely editorial docs.

## Naming convention

```
docs/adr/<NNNN>-<short-kebab-case-slug>.md
```

- Zero-padded sequence number (`0001`, `0002`, …). Never reuse a number.
- File name is immutable once merged.

## Status values

| Status      | Meaning                                                        |
|-------------|----------------------------------------------------------------|
| Proposed    | Documented conflict/option. NO decision has been made.         |
| Accepted    | Approved and binding on subsequent work.                       |
| Rejected    | Considered and explicitly turned down, with rationale.         |
| Superseded  | Replaced by a newer ADR (which MUST link back to this one).    |

## How decisions are approved

1. Author opens the ADR as `Proposed` with evidence and open questions.
2. At least one senior-engineer review validates the evidence against the
   repository (implemented code beats docs; existing files beat assumptions).
3. On agreement, status moves to `Accepted` with approver and date recorded.
4. If evidence is insufficient, the ADR stays `Proposed` — **never guess a
   canonical answer because one artifact "looks better".**

## How superseded decisions are handled

- The old ADR is never deleted or rewritten; its status becomes `Superseded`
  with a pointer to the replacing ADR.
- The new ADR links back under "Supersedes".

## How conflicts are documented

Each conflict ADR records: conflicting artifacts (exact paths), similarities,
differences, unresolved questions, a proposed decision (if any), and status.
Unresolvable conflicts remain `Proposed` until repository evidence or
stakeholder review resolves them.

## Index

| ADR   | Title | Status |
|-------|-------|--------|
| 0001  | Phase 1 monorepo boundary | Accepted |
| 0002  | AI engineering execution duplicates | Proposed |
| 0003  | AI engineering intelligence duplicates | Proposed |
| 0004  | AI engineering orchestration drift (A.9 vs A.21) | Proposed |
| 0005  | Enterprise data intelligence duplicates | Proposed |
| 0006  | Organizational intelligence overlap | Proposed |
| 0007  | Proposal/contract architecture drift | Proposed |
| 0008  | Developer portal overlap | Proposed |
| 0009  | Authentication/login/onboarding overlap | Proposed |
| 0010  | Repeated dashboards/interfaces | Proposed |
| 0018  | Autonomous Engineering Architecture | Accepted |
