-- 0010_calendar.sql
-- Calendario local: tablas base para calendarios y eventos

BEGIN;

-- Tabla de calendarios
CREATE TABLE IF NOT EXISTS calendars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  time_zone VARCHAR(64) DEFAULT 'UTC',
  color VARCHAR(24),
  provider VARCHAR(24) DEFAULT 'local',
  provider_calendar_id TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendars_user_id ON calendars(user_id);
CREATE INDEX IF NOT EXISTS idx_calendars_provider ON calendars(provider);

-- Tabla de eventos
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  calendar_id UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  reminders JSONB,
  google_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_calendar_id ON events(calendar_id);
CREATE INDEX IF NOT EXISTS idx_events_timerange ON events(start_at, end_at);

-- Asistentes (opcional)
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  response_status VARCHAR(32)
);

CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON event_attendees(event_id);

-- Calendario por defecto para el usuario de desarrollo (si existe)
INSERT INTO calendars (user_id, name, time_zone, color, is_primary)
SELECT '00000000-0000-0000-0000-000000000001'::uuid, 'Calendario (local)', 'America/Caracas', '#222052', TRUE
WHERE EXISTS (SELECT 1 FROM users WHERE id = '00000000-0000-0000-0000-000000000001'::uuid)
  AND NOT EXISTS (
    SELECT 1 FROM calendars 
    WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid AND is_primary = TRUE
  );

COMMIT;
