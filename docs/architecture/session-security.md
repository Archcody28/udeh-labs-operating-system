# Session Security — Phase 6

Date 2026-10-16. Opaque server-side sessions (ADR 0013 §Session); no JWTs,
no signing secrets to rotate or leak.

- Identifiers: 256-bit `randomBytes`, base64url; SHA-256 hex persisted
  (`sessions.token_hash` UNIQUE). Raw token never stored/logged/returned
  except once at issuance.
- Transport: `Authorization: Bearer` primary; `udehlabs_session` cookie
  mirrored (`HttpOnly`, `SameSite=Lax`, `Secure` in production via
  `COOKIE_SECURE`, `Max-Age=86400`, `Path=/`). Cleared on logout.
- Expiry: sliding 24h (`last_activity_at` touch, capped step), absolute
  7-day cap, `revoked_at` kills instantly. Expired/revoked → anonymous → 401.
- Fixation: `POST /api/v1/auth/rotate` revokes-then-mints; privilege
  changes (`PATCH members`) revoke all user sessions.
- CSRF: cookie is a convenience mirror; state-changing API calls use
  Bearer in non-browser clients. SameSite=Lax is the baseline, NOT the
  whole CSRF story — production browser apps need explicit anti-CSRF
  tokens (documented gap). CORS is not a CSRF defense.
- Replay: token theft window bounded by sliding expiry + revocation;
  IP is stored as SHA-256 (`ip_hash`), user-agent truncated, neither logged.
- DB: session rows reference `users(id) ON DELETE CASCADE`; token index
  for constant-time lookup path.
