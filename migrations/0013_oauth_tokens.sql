-- 0013_oauth_tokens.sql
-- Tabla para almacenar tokens OAuth de Google Calendar por usuario

BEGIN;

CREATE TABLE IF NOT EXISTS oauth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,                      -- 'google'
  service TEXT NOT NULL,                       -- 'calendar'
  access_token TEXT,
  refresh_token TEXT,
  expiry_date TIMESTAMPTZ,                     -- fecha de expiración del access_token
  scope TEXT,
  token_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, provider, service)
);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user ON oauth_tokens(user_id);

COMMIT;
