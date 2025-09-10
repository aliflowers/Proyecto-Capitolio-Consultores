-- Test semantic search roundtrip with a synthetic vector embedding (dimension 768)
-- 1) Insert a test document and a matching chunk with embedding [1,0,0,...]
DO $$
DECLARE
  v_text text;
  doc_id uuid;
  u_id uuid;
BEGIN
  -- Ensure a test user exists (needed if documentos.user_id is NOT NULL)
  SELECT id INTO u_id FROM users WHERE email = 'test_semantic@nexus.local' LIMIT 1;
  IF u_id IS NULL THEN
    INSERT INTO users (id, email, encrypted_password, is_super_admin, created_at, updated_at)
    VALUES (gen_random_uuid(), 'test_semantic@nexus.local', '$2b$10$abcdefghijklmnopqrstuv', TRUE, NOW(), NOW())
    RETURNING id INTO u_id;
  END IF;

  -- Build a 768-dim vector with first dimension 1 and the rest 0
  SELECT '[' || string_agg(CASE WHEN i=1 THEN '1' ELSE '0' END, ',') || ']' INTO v_text
  FROM generate_series(1,768) i;

  -- Insert a test document
  INSERT INTO documentos (id, user_id, name, path, mime_type)
  VALUES (gen_random_uuid(), u_id, 'Test Vector Doc', '/tmp/test.txt', 'text/plain')
  RETURNING id INTO doc_id;

  -- Insert a matching chunk using dynamic SQL to cast text to vector
EXECUTE 'INSERT INTO document_chunks (id, document_id, content, embedding)
           VALUES (gen_random_uuid(), $1, ''TEST_CHUNK_SIMILARITY_1'', ' || quote_literal(v_text) || '::vector)'
  USING doc_id;
END $$;

-- 2) Query for matches using the same vector and a high threshold
WITH v AS (
  SELECT ('[' || string_agg(CASE WHEN i=1 THEN '1' ELSE '0' END, ',') || ']')::vector AS emb
  FROM generate_series(1,768) i
)
SELECT id, document_id, content, similarity
FROM match_document_chunks((SELECT emb FROM v), 0.9, 5);

