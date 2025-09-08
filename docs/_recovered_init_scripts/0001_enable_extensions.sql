-- Enable required extensions for Nexus Jurídico
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the net schema for HTTP functions (used in document processing trigger)
CREATE SCHEMA IF NOT EXISTS net;

-- Create a simple function to simulate the net.http_post for local development
-- In production, this would be the actual Supabase function
CREATE OR REPLACE FUNCTION net.http_post(url text, body jsonb)
RETURNS void AS $$
BEGIN
    -- For local development, we just log the call
    RAISE NOTICE 'HTTP POST to % with body: %', url, body;
    -- In a real implementation, you might want to store this in a queue table
    -- for processing by an external service
END;
$$ LANGUAGE plpgsql;
