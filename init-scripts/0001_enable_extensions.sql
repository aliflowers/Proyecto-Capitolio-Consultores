-- 0001_enable_extensions.sql
-- This script enables all necessary PostgreSQL extensions for the application.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

COMMIT;
