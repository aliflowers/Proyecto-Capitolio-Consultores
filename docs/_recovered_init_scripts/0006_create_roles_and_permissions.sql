-- Crear tabla de roles con permisos granulares
CREATE TABLE IF NOT EXISTS roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  description TEXT,
  permissions JSONB DEFAULT '{}',
  is_system_role BOOLEAN DEFAULT FALSE,
  can_be_deleted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de permisos individuales por usuario
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_key VARCHAR(100) NOT NULL,
  granted BOOLEAN DEFAULT TRUE,
  scope JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, permission_key)
);

-- Crear tabla de asignación de roles a usuarios
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

-- Crear tabla de sesiones tradicionales
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  refresh_token VARCHAR(255),
  expires_at TIMESTAMPTZ NOT NULL,
  refresh_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET,
  is_active BOOLEAN DEFAULT TRUE
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_key ON user_permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Insertar roles predefinidos
INSERT INTO roles (name, display_name, description, permissions, is_system_role, can_be_deleted) VALUES
('super_admin', 'Super Administrador', 'Acceso total absoluto al sistema', 
  '{
    "users": ["create", "read", "update", "delete", "assign_roles", "reset_password"],
    "cases": ["create", "read", "update", "delete", "assign", "export"],
    "clients": ["create", "read", "update", "delete", "confidential"],
    "documents": ["create", "read", "update", "delete", "process", "share"],
    "system": ["backup", "restore", "settings", "audit"]
  }'::jsonb, TRUE, FALSE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, display_name, description, permissions, is_system_role, can_be_deleted) VALUES
('administrator', 'Administrador', 'Gestión de usuarios y configuración del sistema',
  '{
    "users": ["create", "read", "update", "delete"],
    "cases": ["create", "read", "update", "delete", "assign"],
    "clients": ["create", "read", "update", "delete"],
    "documents": ["create", "read", "update", "delete"]
  }'::jsonb, TRUE, FALSE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, display_name, description, permissions, is_system_role, can_be_deleted) VALUES
('senior_lawyer', 'Abogado Senior', 'Acceso completo a casos asignados',
  '{
    "cases": ["create", "read", "update", "delete"],
    "clients": ["read", "update"],
    "documents": ["create", "read", "update", "delete", "process"]
  }'::jsonb, TRUE, FALSE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, display_name, description, permissions, is_system_role, can_be_deleted) VALUES
('junior_lawyer', 'Abogado Junior', 'Acceso limitado a casos asignados',
  '{
    "cases": ["read", "update"],
    "clients": ["read"],
    "documents": ["read", "update"]
  }'::jsonb, TRUE, FALSE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, display_name, description, permissions, is_system_role, can_be_deleted) VALUES
('legal_assistant', 'Asistente Legal', 'Funciones de apoyo administrativo',
  '{
    "cases": ["read"],
    "clients": ["read"],
    "documents": ["read", "create"]
  }'::jsonb, TRUE, FALSE)
ON CONFLICT (name) DO NOTHING;

-- Agregar campo para identificar Super Admin temporal de desarrollo
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_temporary_super_admin BOOLEAN DEFAULT FALSE;

-- Crear índice para búsquedas rápidas de Super Admin temporal
CREATE INDEX IF NOT EXISTS idx_users_temporary_super_admin ON users(is_temporary_super_admin);

-- Actualizar el perfil del Super Admin existente si existe
UPDATE profiles 
SET role = 'super_admin' 
WHERE id IN (SELECT id FROM users WHERE is_super_admin = TRUE);

-- Nota: El Super Admin temporal se creará mediante el script de inicialización del entorno
