# Compatibility Policy — Phase 4
Date 2026-10-16.

- v1 additive only (new optional fields/resources); no renames/removals within major.
- Breaking → new major (`/api/v2` PROPOSED); deprecation headers + 2-release notice (PROPOSED); contract review required for state/lifecycle changes.
- Consumers pin major; servers support N + N-1 during migration (PROPOSED). No migration tooling in Phase 4.
