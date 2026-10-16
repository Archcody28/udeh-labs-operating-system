# ADR 0006 — Organizational Intelligence Overlap

- **Status:** Proposed (unresolved)
- **Date:** 2026-10-16

## Conflicting artifacts

- `stitch_udehlabs_operating_system/udehlabs_organizational_intelligence_architecture_doc_1.txt` (43 lines)
- `stitch_udehlabs_operating_system/udehlabs_organizational_intelligence_architecture_doc_2.md` (43 lines)

## Evidence

Directory listing confirms both files exist with near-identical line counts
(43 vs 43). The `_1` variant is a `.txt` file while `_2` is `.md`,
suggesting a format-conversion duplicate rather than a content fork — but
content was NOT byte-verified in Phase 1 (reads were prioritized for the
`.md` duplicate pairs and drift candidates).

## Similarities

Same subject, same line count, parallel naming.

## Differences

File extension differs (`.txt` vs `.md`); content equivalence unconfirmed.

## Unresolved questions

1. Are the contents identical apart from extension?
2. Which format is canonical for future specs?

## Proposed decision

Verify content equality in a later phase, then normalize to one Markdown
canonical. NOT decided here.

## Decision status

PROPOSED. Content verification still required.
