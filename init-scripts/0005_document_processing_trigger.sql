-- 0005_document_processing_trigger.sql
-- This script creates a safe, local queue for document processing.

BEGIN;

-- Create a queue table to hold documents pending processing
CREATE TABLE IF NOT EXISTS document_ingest_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documentos(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    attempts INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a function that adds a new document to the queue
CREATE OR REPLACE FUNCTION queue_document_for_ingestion()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO document_ingest_queue (document_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to execute the function after a new document is inserted
DROP TRIGGER IF EXISTS trigger_queue_document_on_insert ON documentos;
CREATE TRIGGER trigger_queue_document_on_insert
AFTER INSERT ON documentos
FOR EACH ROW
EXECUTE FUNCTION queue_document_for_ingestion();

COMMIT;
