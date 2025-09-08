-- Script para inicializar el entorno de desarrollo
-- Crea el Super Admin temporal para desarrollo

DO $$
DECLARE
    user_exists BOOLEAN;
    user_id UUID;
BEGIN
    -- Verificar si el usuario Super Admin ya existe
    SELECT EXISTS(SELECT 1 FROM users WHERE email = 'aliflores@capitolioconsultores.com') INTO user_exists;
    
    IF NOT user_exists THEN
        -- Crear el usuario Super Admin temporal con un nuevo UUID
        INSERT INTO users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            is_super_admin,
            is_temporary_super_admin,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(), -- Generar nuevo UUID
            'aliflores@capitolioconsultores.com',
            '$2a$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNO', -- Contraseña: admin123 (hash de ejemplo)
            NOW(),
            TRUE,
            TRUE,
            NOW(),
            NOW()
        ) RETURNING id INTO user_id;
        
        -- Crear perfil para el Super Admin
        INSERT INTO profiles (
            id,
            full_name,
            role
        ) VALUES (
            user_id,
            'Ali Flores (Desarrollo)',
            'super_admin'
        );
        
        RAISE NOTICE 'Super Admin temporal creado exitosamente con ID: %', user_id;
    ELSE
        -- Actualizar el usuario existente como Super Admin temporal
        UPDATE users 
        SET 
            is_super_admin = TRUE,
            is_temporary_super_admin = TRUE,
            updated_at = NOW()
        WHERE email = 'aliflores@capitolioconsultores.com'
        RETURNING id INTO user_id;
        
        -- Actualizar perfil existente
        UPDATE profiles 
        SET 
            full_name = 'Ali Flores (Desarrollo)',
            role = 'super_admin',
            updated_at = NOW()
        WHERE id = user_id;
        
        RAISE NOTICE 'Super Admin temporal actualizado exitosamente';
    END IF;
END $$;

-- Verificar la creación
SELECT 'Super Admin temporal verificado' as status;
