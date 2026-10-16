# Local Development — Phase 5

Prereqs: Node 22+, Docker (for Postgres) or a local Postgres 16.

```powershell
docker compose up -d postgres
cd services/api
npm install
copy .env.example .env   # edit only placeholders
npm run build
npm run migrate
npm run seed             # synthetic Acme Demo Org; idempotent-ish (keeps existing)
npm start                # :3001
curl http://localhost:3001/health
curl http://localhost:3001/ready
```

Env: `DATABASE_URL` (required), `PORT` (default 3001), `NODE_ENV`, `PGPOOL_MAX`.
Never commit `.env` or real secrets (repo `.gitignore` covers `.env*`).
