# ADR 0008 — Developer Portal Overlap

- **Status:** Proposed (unresolved — genuine architectural fork)
- **Date:** 2026-10-16

## Conflicting artifacts

- `stitch_udehlabs_operating_system/udehlabs_developer_portal_architecture_doc_1.md` (2193 bytes, 33 lines)
- `stitch_udehlabs_operating_system/udehlabs_developer_portal_architecture_doc_2.md` (2968 bytes, 37 lines)

## Evidence

Both files verified by direct read on 2026-10-16. They describe DIFFERENT
scopes under the same "Developer Portal" name:

- **doc_1:** "Developer Portal & Workforce Architecture" — HR/workforce
  system: `DeveloperProfile`, `Skill`, `DeveloperSkill`,
  `DeveloperAvailability`, `DeveloperAssignment`, `PortfolioItem`,
  `Certification`; proficiency model, availability states, server actions
  (`updateDeveloperProfile()`, `syncDeveloperSkills()`, …).
- **doc_2:** "Phase A.24: Developer Portal & Engineering Workspace
  Architecture" — IDE-like engineering workspace:
  `IDeveloperPortalService`, `IEngineeringWorkspace`,
  `IAIEngineeringAssistant`, Code Explorer (A.14), Verification Dashboard
  (A.17/A.18), `DeveloperWorkspace`/`CodePatch` models, integration with
  A.21/A.22, A.19/A.20, A.23.

## Similarities

Shared `DeveloperSkill` concept and "command center" framing.

## Differences

Workforce-management domain (doc_1) vs AI-assisted engineering workspace
(doc_2). Different entities, APIs, and integration points. ~775-byte size
gap reflects real content divergence.

## Unresolved questions

1. Are these two bounded contexts sharing a name, or does one supersede
   the other?
2. If both survive, what are their names and ownership boundaries?

## Proposed decision

None yet — requires domain review. Both specs preserved.

## Decision status

PROPOSED. Architectural review required.
