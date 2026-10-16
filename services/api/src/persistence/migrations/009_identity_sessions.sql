-- 009_identity_sessions.sql — Phase 6 identity foundation (ENT-001/002/003 runtime)
-- Forward-only; does NOT modify 001/002 history. Extends users (credentials),
-- adds credentials + sessions, hardens invitations/memberships.
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Password credentials isolated per ADR 0013 seam (one row per user for now).
CREATE TABLE IF NOT EXISTS user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'scrypt-16384-r8-p1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS trg_user_credentials_updated ON user_credentials;
CREATE TRIGGER trg_user_credentials_updated BEFORE UPDATE ON user_credentials
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Opaque server-side sessions: only token SHA-256 persisted, never the token.
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  assurance TEXT NOT NULL DEFAULT 'password'
    CHECK (assurance IN ('password','stepped-up')),
  authenticated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  absolute_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  revoked_at TIMESTAMPTZ,
  user_agent TEXT,
  ip_hash TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_sessions_user ON sessions (user_id);
CREATE INDEX IF NOT EXISTS ix_sessions_token ON sessions (token_hash);
DROP TRIGGER IF EXISTS trg_sessions_updated ON sessions;
CREATE TRIGGER trg_sessions_updated BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Invitations: token_hash already unique (002); add lifecycle metadata.
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS token_expires_managed BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS accepted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_invitation_role') THEN
    ALTER TABLE invitations ADD CONSTRAINT chk_invitation_role
      CHECK (lower(role) IN ('owner','admin','manager','developer','designer','client','support','auditor'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_membership_role') THEN
    ALTER TABLE memberships ADD CONSTRAINT chk_membership_role
      CHECK (lower(role) IN ('owner','admin','manager','developer','designer','client','support','auditor'));
  END IF;
END $$;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS ix_memberships_user ON memberships (user_id);
CREATE INDEX IF NOT EXISTS ix_invitations_email ON invitations (organization_id, email);
