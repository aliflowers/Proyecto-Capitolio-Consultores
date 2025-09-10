-- 0009_policies_and_audit.sql
-- This script sets up the basic infrastructure for Row-Level Security (RLS) and auditing.

BEGIN;

-- 1. Audit Trail Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Example Audit Trigger Function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    user_id_var UUID;
BEGIN
    -- In a real application, you would get the user ID from the session/claims.
    -- For now, we'll leave it null as a placeholder.
    user_id_var := NULL;

    IF (TG_OP = 'INSERT') THEN
INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data)
        VALUES (user_id_var, 'INSERT', TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
        VALUES (user_id_var, 'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data)
        VALUES (user_id_var, 'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Example of attaching the trigger to the 'documentos' table
-- DROP TRIGGER IF EXISTS audit_documentos_trigger ON documentos;
-- CREATE TRIGGER audit_documentos_trigger
-- AFTER INSERT OR UPDATE OR DELETE ON documentos
-- FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();


-- 3. Row-Level Security (RLS)

-- Dev helper: provide an auth.uid() stub to avoid errors in dev environments without Supabase
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE
AS $$ SELECT NULL::uuid $$;

-- Enable RLS on key tables
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expedientes ENABLE ROW LEVEL SECURITY;

-- Dev permissive policies to allow reads during development.
-- IMPORTANT: Replace with strict policies in production.
DROP POLICY IF EXISTS "Allow users to see their own documents" ON documentos;
CREATE POLICY "Dev allow all documents (SELECT)" ON documentos FOR SELECT USING (true);
CREATE POLICY "Dev allow all clientes (SELECT)" ON clientes FOR SELECT USING (true);
CREATE POLICY "Dev allow all expedientes (SELECT)" ON expedientes FOR SELECT USING (true);

COMMIT;
