-- 0004_create_expedientes_and_chunks.sql
-- This script creates the expedientes, document chunks, and their respective pivot tables.

BEGIN;

-- Expedientes table
CREATE TABLE IF NOT EXISTS expedientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    expediente_name VARCHAR(255) NOT NULL,
    expediente_number VARCHAR(100),
    status VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pivot table to link expedientes and clientes (many-to-many)
CREATE TABLE IF NOT EXISTS expedientes_clientes (
    expediente_id UUID REFERENCES expedientes(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    PRIMARY KEY (expediente_id, cliente_id)
);

-- Pivot table to link expedientes and documentos (many-to-many)
CREATE TABLE IF NOT EXISTS expedientes_documentos (
    expediente_id UUID REFERENCES expedientes(id) ON DELETE CASCADE,
    documento_id UUID REFERENCES documentos(id) ON DELETE CASCADE,
    PRIMARY KEY (expediente_id, documento_id)
);

-- Table for storing chunks of text from documents for semantic search
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documentos(id) ON DELETE CASCADE,
    content TEXT,
    embedding VECTOR(768) -- Using 768 to match Google text-embedding-004 used in the codebase
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_expedientes_user_id ON expedientes(user_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_clientes_expediente_id ON expedientes_clientes(expediente_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_clientes_cliente_id ON expedientes_clientes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_documentos_expediente_id ON expedientes_documentos(expediente_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_documentos_documento_id ON expedientes_documentos(documento_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

COMMIT;
