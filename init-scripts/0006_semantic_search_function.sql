-- 0006_semantic_search_function.sql
-- This script creates the function used by the backend to perform semantic search.

BEGIN;

CREATE OR REPLACE FUNCTION match_document_chunks ( 
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity FLOAT
)
AS $$
-- This function calculates similarity based on cosine distance (1 - distance).
-- The 'threshold' parameter should be a minimum similarity score (e.g., 0.7).
-- The <=> operator returns the cosine distance (0 for identical, 2 for opposite).
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM
    document_chunks AS dc
  WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY
    similarity DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

COMMIT;
