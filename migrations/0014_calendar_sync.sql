-- 0014_calendar_sync.sql
-- Agrega columnas para sincronización incremental con Google Calendar

BEGIN;

ALTER TABLE calendars
  ADD COLUMN IF NOT EXISTS google_sync_token TEXT,
  ADD COLUMN IF NOT EXISTS google_last_sync_at TIMESTAMPTZ;

COMMIT;

