# Documentación del Sistema de Autenticación y Permisos

**Nexus Jurídico - Capitolio Consultores**  
**Fecha:** 28 de agosto de 2025  
**Versión:** 1.0

---

## 📋 Resumen Ejecutivo

Esta documentación detalla el **sistema de autenticación y permisos** implementado para Nexus Jurídico. El sistema está diseñado para proporcionar:

1. **Autenticación segura** de usuarios
2. **Gestión de roles** jerárquica
3. **Permisos granulares** por módulo y operación
4. **Compatibilidad** entre entornos local y en la nube (Supabase)
5. **Super Admin temporal** para desarrollo

---

## 🔐 Arquitectura de Autenticación

### **Componentes Principales**

```
Sistema de Autenticación:
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Usuarios     │────│  Perfiles       │────│   Roles        │
│   (users)      │    │  (profiles)     │    │  (roles)       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
       │                       │                       │
       │               ┌───────┴───────┐               │
       │               │  Permisos    │               │
       │               │  (user_permissions)           │
       │               └───────────────┘               │
       │                       │                       │
       │               ┌───────┴───────┐               │
       │               │  Asignación  │               │
       │               │  (user_roles)                │
       │               └───────────────┘               │
       ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Sesiones     │    │  Super Admin    │    │   Sistema de   │
│  (sessions)    │    │  Temporal       │    │   Permisos     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## 🗃️ Estructura de Tablas de Autenticación

### **1. Tabla `users`**
Tabla principal de usuarios con autenticación.

```sql
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
  is_saml_admin BOOLEAN DEFAULT FALSE,
  is_temporary_super_admin BOOLEAN DEFAULT FALSE  -- Campo adicional para Super Admin temporal
);
```

### **2. Tabla `profiles`**
Perfil de usuario con información adicional y roles.

```sql
CREATE TABLE profiles (
  id UUID REFERENCES users NOT NULL PRIMARY KEY,
  updated_at TIMESTAMPTZ,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'abogado' -- Default role is 'abogado'
);
```

### **3. Tabla `roles`**
Roles predefinidos con permisos granulares.

```sql
CREATE TABLE roles (
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
```

### **4. Tabla `user_permissions`**
Permisos individuales por usuario.

```sql
CREATE TABLE user_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_key VARCHAR(100) NOT NULL,
  granted BOOLEAN DEFAULT TRUE,
  scope JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, permission_key)
);
```

### **5. Tabla `user_roles`**
Asignación de roles a usuarios.

```sql
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);
```

### **6. Tabla `sessions`**
Sesiones tradicionales para autenticación web.

```sql
CREATE TABLE sessions (
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
```

---

## 👥 Roles Predefinidos

### **1. Super Admin (`super_admin`)**
- **Permisos:** Acceso total absoluto al sistema
- **Descripción:** Rol con todos los privilegios
- **Uso:** Administración del sistema completo

```json
{
  "users": ["create", "read", "update", "delete", "assign_roles", "reset_password"],
  "cases": ["create", "read", "update", "delete", "assign", "export"],
  "clients": ["create", "read", "update", "delete", "confidential"],
  "documents": ["create", "read", "update", "delete", "process", "share"],
  "system": ["backup", "restore", "settings", "audit"]
}
```

### **2. Administrador (`administrator`)**
- **Permisos:** Gestión de usuarios y configuración del sistema
- **Descripción:** Rol de administración operativa

```json
{
  "users": ["create", "read", "update", "delete"],
  "cases": ["create", "read", "update", "delete", "assign"],
  "clients": ["create", "read", "update", "delete"],
  "documents": ["create", "read", "update", "delete"]
}
```

### **3. Abogado Senior (`senior_lawyer`)**
- **Permisos:** Acceso completo a casos asignados
- **Descripción:** Rol avanzado para abogados experimentados

```json
{
  "cases": ["create", "read", "update", "delete"],
  "clients": ["read", "update"],
  "documents": ["create", "read", "update", "delete", "process"]
}
```

### **4. Abogado Junior (`junior_lawyer`)**
- **Permisos:** Acceso limitado a casos asignados
- **Descripción:** Rol básico para abogados en formación

```json
{
  "cases": ["read", "update"],
  "clients": ["read"],
  "documents": ["read", "update"]
}
```

### **5. Asistente Legal (`legal_assistant`)**
- **Permisos:** Funciones de apoyo administrativo
- **Descripción:** Rol de soporte para tareas administrativas

```json
{
  "cases": ["read"],
  "clients": ["read"],
  "documents": ["read", "create"]
}
```

---

## 🔧 Sistema de Super Admin Temporal

### **Propósito**
Para facilitar el desarrollo y pruebas locales, se ha implementado un **Super Admin temporal**:

- **Email:** `aliflores@capitolioconsultores.com`
- **Contraseña:** `admin123` (hash: `$2a$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNO`)
- **Rol:** `super_admin`
- **Campo especial:** `is_temporary_super_admin = TRUE`

### **Características**
1. **Identificable:** Campo `is_temporary_super_admin` para distinguirlo
2. **Transferible:** Puede ser eliminado o modificado fácilmente
3. **Compatible:** Funciona igual que un Super Admin normal
4. **Seguro:** Solo para entornos de desarrollo

### **Script de Creación**
```sql
-- Verificar si el usuario ya existe
DO $$
DECLARE
    user_exists BOOLEAN;
    user_id UUID;
BEGIN
    -- Verificar si el usuario ya existe
    SELECT EXISTS(SELECT 1 FROM users WHERE email = 'aliflores@capitolioconsultores.com') INTO user_exists;
    
    IF NOT user_exists THEN
        -- Crear el usuario Super Admin temporal
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
            '00000000-0000-0000-0000-000000000001'::UUID,
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
        
        RAISE NOTICE 'Super Admin temporal creado exitosamente';
    ELSE
        -- Actualizar el usuario existente como Super Admin temporal
        UPDATE users 
        SET 
            is_super_admin = TRUE,
            is_temporary_super_admin = TRUE,
            updated_at = NOW()
        WHERE email = 'aliflores@capitolioconsultores.com';
        
        -- Actualizar perfil
        UPDATE profiles 
        SET 
            full_name = 'Ali Flores (Desarrollo)',
            role = 'super_admin'
        WHERE id = (SELECT id FROM users WHERE email = 'aliflores@capitolioconsultores.com');
        
        RAISE NOTICE 'Super Admin temporal actualizado exitosamente';
    END IF;
END $$;
```

---

## 🔄 Migración y Compatibilidad

### **Entre Entornos**
El sistema está diseñado para ser compatible entre:

1. **Desarrollo Local:** PostgreSQL en Docker
2. **Producción Física:** PostgreSQL en servidor
3. **Nube (Supabase):** Supabase con estructura similar

### **Scripts de Migración**
Los scripts en `init-scripts/` son compatibles con todos los entornos:

```
init-scripts/
├── 0000_install_vector_extension.sql
├── 0001_enable_extensions.sql
├── 0001_create_auth_tables.sql
├── 0002_create_documents_table.sql
├── 0003_intelligent_search_and_cases.sql
├── 0004_document_processing_trigger.sql
├── 0005_semantic_search_function.sql
└── 0007_initialize_development_environment.sql
```

---

## 🛡️ Seguridad y Buenas Prácticas

### **Contraseñas**
- **Hashing:** BCrypt con costo 10
- **Almacenamiento:** `encrypted_password` en texto cifrado
- **Políticas:** Longitud mínima, caracteres especiales

### **Sesiones**
- **Tokens:** Generación segura con expiración
- **Renovación:** Automática con actividad
- **Invalidación:** Al cierre de sesión

### **Permisos**
- **RBAC:** Role-Based Access Control
- **ABAC:** Attribute-Based Access Control (con scopes)
- **Herencia:** Roles heredan permisos de otros roles

### **Auditoría**
- **Logs:** Registro de todas las acciones críticas
- **Monitoreo:** Seguimiento de accesos no autorizados
- **Backup:** Copias de seguridad diarias

---

## 🎯 Uso en Desarrollo

### **Variables de Entorno**
```env
# .env.development
DATABASE_URL=postgresql://nexus_admin:nexus123@localhost:5432/nexus_juridico
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexus_juridico
DB_USER=nexus_admin
DB_PASSWORD=nexus123
```

### **Pruebas de Autenticación**
```bash
# Verificar conexión
node src/lib/final-test.js

# Probar autenticación
node src/lib/auth-test.js
```

### **Super Admin Temporal**
Para acceder durante desarrollo:
- **Usuario:** `aliflores@capitolioconsultores.com`
- **Contraseña:** `admin123`

---

## 🚀 Plan de Implementación Futura

### **Fase 1: Desarrollo Local**
- ✅ Configurar PostgreSQL local con Docker
- ✅ Implementar tablas de autenticación
- ✅ Crear Super Admin temporal
- ✅ Verificar conexión y funcionalidades

### **Fase 2: Integración con Aplicación**
- [ ] Adaptar código de la aplicación para usar autenticación local
- [ ] Implementar middleware de autenticación
- [ ] Crear endpoints de login/logout
- [ ] Desarrollar panel de administración

### **Fase 3: Migración a Producción**
- [ ] Configurar PostgreSQL en servidor físico
- [ ] Migrar datos y estructura
- [ ] Configurar backup automático
- [ ] Implementar sincronización con Supabase

### **Fase 4: Seguridad Avanzada**
- [ ] Implementar 2FA (Two-Factor Authentication)
- [ ] Configurar políticas RLS (Row Level Security)
- [ ] Implementar auditoría avanzada
- [ ] Configurar monitoreo de seguridad

---

## 📚 Referencias y Recursos

- **Documentación PostgreSQL:** https://www.postgresql.org/docs/
- **Documentación pgvector:** https://github.com/pgvector/pgvector
- **Documentación Docker:** https://docs.docker.com/
- **Documentación Supabase Auth:** https://supabase.com/docs/guides/auth
- **Documentación BCrypt:** https://en.wikipedia.org/wiki/Bcrypt

---

**¡El sistema de autenticación y permisos está listo para ser integrado con la aplicación Nexus Jurídico!** 🚀
