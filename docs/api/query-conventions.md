# Query Conventions — Phase 4 (PROPOSED; no repo evidence)
Date 2026-10-16.

- Pagination: cursor-based default (`cursor`, `limit`); offset allowed only for small admin lists. Default limit 20, max 100.
- Ordering: deterministic; default `createdAt desc + id tiebreak`; `sort` param allowlisted per resource.
- Filtering: exact-match fields + `status` allowlist; range via `createdAfter/Before`; no ad-hoc query language.
- Search: `q` full-text only where evidenced (catalog, intelligence); relevance ordering UNRESOLVED.
- Envelope (illustrative): `{ data[], page { nextCursor, prevCursor, limit }, meta { total? } }` — total optional (expensive).
- Tenant scoping always server-applied; pagination never crosses org boundary.
