# infra/ — Future Infrastructure Boundary (Phase 1)

**Status:** Documentation boundary only. NO infrastructure code, NO
deployment system, NO cloud resources are created in Phase 1.

## Purpose

Reserves the location for all future environment, deployment, and operations
work so it never leaks into application or documentation directories.

## Environments (to be stood up in later phases)

| Environment | Purpose | Data |
|-------------|---------|------|
| development | Local iteration | Synthetic/seeded only |
| staging     | Pre-production verification, mirrors prod topology | Anonymized snapshots only |
| production  | Live system | Real user data, encrypted |

No environment exists yet. When created, each gets its own configuration
root under `infra/` (e.g. `infra/envs/<name>/`) defined by a future ADR.

## Configuration strategy

- Configuration is explicit, versioned, and reviewed like code.
- Environment-specific values come from the environment, never from source.
- Defaults must be safe for development (localhost, no credentials).

## Environment variable strategy

- All runtime secrets and per-environment values are injected as environment
  variables by the hosting layer.
- Variable names are documented in `infra/` alongside the code that reads
  them; values never are.
- No `.env` file is committed. Ever.

## Secret management principles

1. Secrets live in a managed secret store (selected by future ADR), never in
   git, chat logs, tickets, or prototype documents.
2. Access follows least privilege; production secrets are never copied to
   development or staging.
3. Rotation is routine and automated where the platform supports it.

## Prohibited secret storage

- `.env` / `.env.*` files containing real values
- Source files, Markdown docs, ADRs, HTML mockups
- CI logs (scanners must redact; never `echo` secrets)
- Container images, screenshots, screen recordings

## Ownership boundaries (future)

| Area | Owner (proposed) |
|------|------------------|
| `infra/` definitions | Platform / SRE |
| Application code (`apps/`) | Product engineering |
| Secret store policies | Security + Platform |
| Production access grants | Security |

Final ownership is subject to a staffing/operating-model ADR.
