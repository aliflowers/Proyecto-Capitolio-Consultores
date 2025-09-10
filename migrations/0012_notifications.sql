-- 0012_notifications.sql
-- Crea tabla de notificaciones y restricción de unicidad por usuario/evento/hora programada

BEGIN;

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_notifications_user_event_schedule
  ON notifications(user_id, event_id, scheduled_at);

COMMIT;
