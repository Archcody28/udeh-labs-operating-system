# Repository Pattern — Phase 5

`BaseRepository`: parameterized queries only; `findByIdInOrg` (tenant-scoped,
`NotFoundError` vs driver error); `mapDbError` (unique/FK/check → `ConflictError`);
`updateWithVersion` (stale → `CONFLICT`). Concrete repos per aggregate
(`Organization/Workspace/Project/Audit/...`); tenant ctx first arg; optional `tx`
last arg. No raw `pg` outside repositories; no unrestricted list (org filter +
limit ≤ 100); idempotency keys unique-checked by DB; audit repo exposes `append` +
`list` only.
