-- This script creates a trigger to simulate document processing
-- for local development (since we don't have Edge Functions locally)

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION trigger_process_document()
RETURNS TRIGGER AS $$
BEGIN
  -- For local development, we just log the document insertion
  RAISE NOTICE 'Document inserted: % (ID: %)', NEW.name, NEW.id;
  
  -- In a real implementation, you might want to:
  -- 1. Insert a job into a processing queue
  -- 2. Call an external service
  -- 3. Update a status table
  
  -- For now, we'll just insert a mock entry into storage_objects
  INSERT INTO storage_objects (bucket_id, name, owner)
  VALUES ('documentos', NEW.path, NEW.user_id::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger
CREATE TRIGGER on_document_inserted
AFTER INSERT ON documentos
FOR EACH ROW
EXECUTE FUNCTION trigger_process_document();
