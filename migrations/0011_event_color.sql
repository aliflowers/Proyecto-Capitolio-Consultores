-- 0011_event_color.sql
-- Agrega color por evento para personalización visual

BEGIN;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS color VARCHAR(24);

-- Establecer color por defecto a los eventos existentes (color primario de la marca)
UPDATE events SET color = COALESCE(color, '#222052');

COMMIT;
