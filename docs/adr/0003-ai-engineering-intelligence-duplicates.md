# ADR 0003 — AI Engineering Intelligence Architecture Duplicates

- **Status:** Accepted (Phase 3: DUPLICATE — content identical, `_1` canonical pointer; `_2` preserved)
- **Date:** 2026-10-16

## Conflicting artifacts

- `stitch_udehlabs_operating_system/udehlabs_ai_engineering_intelligence_architecture_doc_1.md`
- `stitch_udehlabs_operating_system/udehlabs_ai_engineering_intelligence_architecture_doc_2.md`

## Evidence

Both files verified by direct read on 2026-10-16. Identical H1 ("AI
Engineering Intelligence Layer Architecture"), identical Phase A.10 scope,
identical 39-line bodies covering Codebase Intelligence, Architecture &
Rule Engine, Requirement & Project Intelligence, Context Retrieval &
Semantic Search, Intelligence Pipeline, Security & Isolation, and Key
Insights. The `git diff` showed a single hunk at line 36+ with no visible
content change — consistent with a trailing-byte duplicate.

## Similarities

Same layer, same services (`ICodebaseIntelligenceService`,
`ICodeGraphService`, `IArchitectureRuleEngine`, `IChangeImpactAnalyzer`),
same pipeline and tenant-scoping guarantees.

## Differences

None substantive identified.

## Unresolved questions

1. Canonical file selection and disposal of the duplicate.
2. Whether the duplication signals a broader export-dedup problem (see
   ADRs 0002, 0005, 0007).

## Proposed decision

Deduplicate to a single canonical spec in a later phase. NOT decided here.

## Decision status

PROPOSED. Awaiting confirmation.
