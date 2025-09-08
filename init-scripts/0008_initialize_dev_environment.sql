-- 0008_initialize_dev_environment.sql
-- This script seeds the database with the initial roles and permissions for the development environment.

BEGIN;

-- Insert Super Administrador Role
INSERT INTO roles (name) VALUES ('Super Administrador') ON CONFLICT (name) DO NOTHING;

-- Insert basic permissions
INSERT INTO permissions (permission_key, description) VALUES
    ('admin:access', 'Acceso al panel de administración'),
    ('users:list', 'Listar todos los usuarios'),
    ('users:edit', 'Editar cualquier usuario'),
    ('roles:assign', 'Asignar roles a usuarios'),
    ('documentos:create', 'Crear documentos'),
    ('documentos:read', 'Leer cualquier documento'),
    ('documentos:update', 'Actualizar cualquier documento'),
    ('documentos:delete', 'Eliminar cualquier documento'),
    ('clientes:create', 'Crear clientes'),
    ('clientes:read', 'Leer cualquier cliente'),
    ('clientes:update', 'Actualizar cualquier cliente'),
    ('clientes:delete', 'Eliminar cualquier cliente'),
    ('expedientes:create', 'Crear expedientes'),
    ('expedientes:read', 'Leer cualquier expediente'),
    ('expedientes:update', 'Actualizar cualquier expediente'),
    ('expedientes:delete', 'Eliminar cualquier expediente')
ON CONFLICT (permission_key) DO NOTHING;

-- Assign all permissions to Super Administrador role
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    (SELECT id FROM roles WHERE name = 'Super Administrador'),
    p.id
FROM
    permissions p
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Also set JSON permissions for compatibility with current authorization logic
-- Super Administrador gets wildcard access
UPDATE roles
SET permissions = jsonb_build_object('*', ARRAY['*']::text[])
WHERE name = 'Super Administrador';

COMMIT;
