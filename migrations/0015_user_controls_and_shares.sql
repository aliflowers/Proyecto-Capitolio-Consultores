-- 0015_user_controls_and_shares.sql
-- Adds user disabling and generic resource sharing model

BEGIN;

-- 1) Disable flag to block login and force logout
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_users_is_disabled ON users(is_disabled);

-- 2) Generic resource shares (for documentos, expedientes, clientes)
CREATE TABLE IF NOT EXISTS resource_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('documento','expediente','cliente')),
  resource_id UUID NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access TEXT NOT NULL CHECK (access IN ('read','write')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (resource_type, resource_id, target_user_id)
);

CREATE INDEX IF NOT EXISTS idx_resource_shares_target ON resource_shares(target_user_id);
CREATE INDEX IF NOT EXISTS idx_resource_shares_resource ON resource_shares(resource_type, resource_id);

COMMIT;

