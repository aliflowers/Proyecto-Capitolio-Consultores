-- Create authentication tables to simulate Supabase Auth for local development

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT NOT NULL,
  email_confirmed_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ,
  confirmation_token TEXT,
  confirmation_sent_at TIMESTAMPTZ,
  recovery_token TEXT,
  recovery_sent_at TIMESTAMPTZ,
  email_change_token_new TEXT,
  email_change TEXT,
  email_change_sent_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  raw_app_meta_data JSONB,
  raw_user_meta_data JSONB,
  is_sso_user BOOLEAN DEFAULT FALSE,
  is_super_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  phone TEXT DEFAULT NULL,
  phone_confirmed_at TIMESTAMPTZ DEFAULT NULL,
  phone_change TEXT DEFAULT '',
  phone_change_token TEXT DEFAULT '',
  phone_change_sent_at TIMESTAMPTZ DEFAULT NULL,
  confirmed_at TIMESTAMPTZ GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
  email_change_token_current TEXT DEFAULT ''::TEXT,
  email_change_confirm_status SMALLINT DEFAULT 0,
  banned_until TIMESTAMPTZ DEFAULT NULL,
  reauthentication_token TEXT DEFAULT ''::TEXT,
  reauthentication_sent_at TIMESTAMPTZ DEFAULT NULL,
  is_saml_admin BOOLEAN DEFAULT FALSE
);

-- Create profiles table (similar to Supabase public.profiles)
CREATE TABLE profiles (
  id UUID REFERENCES users NOT NULL PRIMARY KEY,
  updated_at TIMESTAMPTZ,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'abogado' -- Default role is 'abogado'
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_confirmation_token ON users(confirmation_token);
CREATE INDEX idx_users_recovery_token ON users(recovery_token);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Insert a default admin user for testing
-- Password: admin123 (hashed using pgcrypto - you should change this in production)
INSERT INTO users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@capitolioconsultores.com',
  '$2a$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNO', -- This is a placeholder - use a real hash
  NOW(),
  '{"full_name": "Administrador"}'
);

INSERT INTO profiles (id, full_name, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Administrador',
  'administrador'
);

-- Create a function to simulate auth.uid() for local development
CREATE OR REPLACE FUNCTION auth_uid()
RETURNS UUID AS $$
BEGIN
  -- In a real implementation, this would return the current authenticated user ID
  -- For local development, we'll return the admin user ID
  RETURN '00000000-0000-0000-0000-000000000001';
END;
$$ LANGUAGE plpgsql;

-- Create a function to simulate auth.jwt() for local development
CREATE OR REPLACE FUNCTION auth_jwt()
RETURNS JSON AS $$
BEGIN
  -- In a real implementation, this would return the current JWT claims
  -- For local development, we'll return basic claims
  RETURN json_build_object(
    'sub', '00000000-0000-0000-0000-000000000001',
    'email', 'admin@capitolioconsultores.com',
    'role', 'authenticated'
  );
END;
$$ LANGUAGE plpgsql;
