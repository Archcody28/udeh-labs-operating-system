# Security Policy (Phase 1)

## Reporting a vulnerability

Email the repository owner via the address listed on the GitHub repository
profile, or open a **private** security advisory on GitHub. Do NOT open a
public issue for vulnerabilities.

Include: affected path/commit, impact, and reproduction steps if safe.
Expect acknowledgement within 5 business days.

## Secret rules (binding)

- No credentials, API keys, tokens, private keys, passwords, or customer
  personal data in any committed file — including docs, ADRs, mockups, and
  `.env` files (real or "example" values that look real).
- `.env`, `.env.*`, `*.pem`, `*.key`, and `id_rsa*` are git-ignored and must
  never be force-added.
- CI runs a secret scan on every push/PR (see
  `.github/workflows/repo-integrity.yml`). The scanner redacts matches; it
  never prints secret values to logs.
- If a secret is ever committed: revoke/rotate it immediately, remove it
  from history in a follow-up, and record the rotation — do not just delete
  the file and assume safety.
