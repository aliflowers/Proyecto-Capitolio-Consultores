-- Fase 2: Intelligent Search and Case Management

-- 1. Enable the pgvector extension
-- (This is already enabled in our custom Docker image)

-- 2. Create a table for document chunks and embeddings
CREATE TABLE document_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documentos NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(768), -- Using 768 for Google's text-embedding-004 model
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_user_id ON document_chunks(user_id);
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- 3. Create tables for Case Management
CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- The lawyer who manages this client
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_clientes_user_id ON clientes(user_id);
CREATE INDEX idx_clientes_full_name ON clientes(full_name);

CREATE TABLE casos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- The lawyer who manages this case
  case_name TEXT NOT NULL,
  case_number TEXT UNIQUE,
  status TEXT DEFAULT 'abierto',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_casos_user_id ON casos(user_id);
CREATE INDEX idx_casos_case_name ON casos(case_name);
CREATE INDEX idx_casos_status ON casos(status);

-- 4. Create join tables
CREATE TABLE casos_clientes (
  caso_id UUID REFERENCES casos ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes ON DELETE CASCADE,
  PRIMARY KEY (caso_id, cliente_id)
);

-- Create indexes for better performance
CREATE INDEX idx_casos_clientes_caso_id ON casos_clientes(caso_id);
CREATE INDEX idx_casos_clientes_cliente_id ON casos_clientes(cliente_id);

CREATE TABLE casos_documentos (
  caso_id UUID REFERENCES casos ON DELETE CASCADE,
  documento_id UUID REFERENCES documentos ON DELETE CASCADE,
  PRIMARY KEY (caso_id, documento_id)
);

-- Create indexes for better performance
CREATE INDEX idx_casos_documentos_caso_id ON casos_documentos(caso_id);
CREATE INDEX idx_casos_documentos_documento_id ON casos_documentos(documento_id);
