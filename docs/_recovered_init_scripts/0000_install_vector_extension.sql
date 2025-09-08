-- This script will be run first to ensure vector extension is available
-- For PostgreSQL 17.4, we need to install the vector extension manually
-- This is a placeholder script - the actual installation will be handled by Docker
-- but we include this to ensure the extension is enabled in the correct order

\echo 'Vector extension will be installed during container initialization'
\echo 'This script ensures proper ordering of initialization scripts'
