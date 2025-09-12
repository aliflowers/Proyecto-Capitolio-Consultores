-- 0016_chat_backups.sql
-- Tablas de respaldo de Rocket.Chat en Postgres local

BEGIN;

CREATE TABLE IF NOT EXISTS chat_rooms (
  id_rc TEXT PRIMARY KEY,
  name TEXT,
  type TEXT,
  created_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON chat_rooms(type);

CREATE TABLE IF NOT EXISTS chat_users (
  id_rc TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  is_admin BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_chat_users_email ON chat_users(email);

CREATE TABLE IF NOT EXISTS chat_messages (
  id_rc TEXT PRIMARY KEY,
  room_id_rc TEXT REFERENCES chat_rooms(id_rc) ON DELETE CASCADE,
  user_id_rc TEXT REFERENCES chat_users(id_rc) ON DELETE SET NULL,
  ts TIMESTAMPTZ,
  text TEXT,
  msg_type TEXT,
  file_meta_json JSONB
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_ts ON chat_messages(room_id_rc, ts);

COMMIT;
