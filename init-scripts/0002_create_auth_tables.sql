-- 0002_create_auth_tables.sql
-- This script sets up the core tables for user authentication and management.

BEGIN;

-- Users table to store user information
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    encrypted_password VARCHAR(255) NOT NULL,
    email_confirmed_at TIMESTAMP WITH TIME ZONE,
    is_super_admin BOOLEAN DEFAULT FALSE,
    is_temporary_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table for additional user details
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    avatar_url VARCHAR(255),
    role VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table for managing user sessions
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Function to automatically create a profile when a new user is created
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name)
    VALUES (NEW.id, 'Nuevo Usuario');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute the function after a new user is inserted
DROP TRIGGER IF EXISTS trigger_create_profile_for_new_user ON users;
CREATE TRIGGER trigger_create_profile_for_new_user
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_profile_for_new_user();

COMMIT;
