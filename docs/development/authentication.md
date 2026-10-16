# Authentication — Developer Guide (Phase 6)

Date 2026-10-16.

## Local flow

```powershell
$env:DATABASE_URL="postgresql://udehlabs:udehlabs_dev@localhost:5432/udehlabs_dev"
npm run migrate --prefix services/api
npm run seed --prefix services/api   # prints one dev owner login (dev only)
npm start --prefix services/api
```

Register/login against the running API:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/v1/auth/register `
  -ContentType application/json -Body '{"email":"you@example.com","password":"strong-password-123","displayName":"You"}'
$login = Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/v1/auth/login `
  -ContentType application/json -Body '{"email":"you@example.com","password":"strong-password-123"}'
$headers = @{ Authorization = "Bearer $($login.data.token)" }
Invoke-RestMethod -Uri http://localhost:3001/api/v1/auth/me -Headers $headers
```

## Guarding a new route

```ts
const { principal, ctx } = await guardOrgRoute(req, cid, orgId, "project.create");
// optional high-risk gate:
requireAssurance(principal, "deployment.trigger");
```

Never read `organizationId` from the body as authority; never accept
`actorId` from the client; never return hashes/tokens; audit with the
server principal (`actorId: principal.subjectId`).

## Public endpoints (complete allowlist)

`GET /health`, `GET /ready` — no auth. Everything else under `/api/v1`
requires authentication; org-scoped routes additionally require membership
+ permission via `guardOrgRoute`. Auth endpoints
(`/auth/register`, `/auth/login`, `/invitations/accept`) are unauthenticated
by necessity but rate-limited.
