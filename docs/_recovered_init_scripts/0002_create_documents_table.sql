-- Create a table for document metadata (simplified for local development)
CREATE TABLE documentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create a simple storage table to simulate Supabase storage
CREATE TABLE storage_objects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_id TEXT NOT NULL,
  name TEXT NOT NULL,
  owner TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_accessed_at TIMESTAMPTZ DEFAULT now()
);

-- Create a buckets table to simulate Supabase storage buckets
CREATE TABLE storage_buckets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default bucket
INSERT INTO storage_buckets (id, name, public) 
VALUES ('documentos', 'documentos', false);

-- Create indexes for better performance
CREATE INDEX idx_documentos_user_id ON documentos(user_id);
CREATE INDEX idx_documentos_created_at ON documentos(created_at);
CREATE INDEX idx_storage_objects_bucket ON storage_objects(bucket_id);
CREATE INDEX idx_storage_objects_name ON storage_objects(name);
