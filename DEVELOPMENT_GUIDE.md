# 📘 Guía de Desarrollo Local - Nexus Jurídico

**Versión:** 1.0  
**Fecha:** 28 de agosto de 2025  
**Autor:** Equipo de Desarrollo Capitolio Consultores

---

## 🎯 Objetivo

Esta guía proporciona instrucciones detalladas para configurar, ejecutar y desarrollar la plataforma Nexus Jurídico en un entorno local de desarrollo.

---

## 📋 Requisitos Previos

### **Software Obligatorio**
- **Docker Desktop** (versión 28.0.4 o superior)
- **Node.js** (versión 18.x o superior)
- **npm** (versión 8.x o superior) o **yarn**
- **Git** (última versión estable)
- **Editor de código** (Visual Studio Code recomendado)

### **Hardware Recomendado**
- **RAM:** 8GB mínimo (16GB recomendado)
- **CPU:** Procesador de 4 núcleos
- **Almacenamiento:** 20GB de espacio libre
- **Sistema Operativo:** Windows 10/11, macOS 10.15+, Ubuntu 20.04+

---

## 🚀 Configuración Inicial

### **1. Clonar el Repositorio**
```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd capitolio-consultores

# Verificar estructura de directorios
ls -la
```

### **2. Verificar Instalación de Docker**
```bash
# Verificar versión de Docker
docker --version
# Debería mostrar: Docker version 28.0.4, build b8034c0

# Verificar Docker Compose
docker-compose --version
# Debería mostrar: Docker Compose version v2.34.0-desktop.1

# Verificar que Docker Desktop está corriendo
docker info
```

### **3. Instalar Dependencias del Proyecto**
```bash
# Instalar dependencias de Node.js
npm install

# O si usas yarn
yarn install
```

---

## 🐳 Iniciar Entorno Docker Local

### **1. Levantar Contenedores**
```bash
# Iniciar todos los contenedores en segundo plano
docker-compose up -d

# Verificar que los contenedores están corriendo
docker-compose ps
```

**Salida esperada:**
```
NAME                SERVICE             STATUS              PORTS
nexus-postgres      postgres            running             0.0.0.0:5432->5432/tcp
```

### **2. Verificar Estado del Contenedor PostgreSQL**
```bash
# Ver logs del contenedor
docker-compose logs nexus-postgres

# Verificar que PostgreSQL está listo
docker exec nexus-postgres pg_isready -U nexus_admin -d nexus_juridico
# Debería mostrar: /var/run/postgresql:5432 - aceptando conexiones
```

### **3. Verificar Volúmenes Persistentes**
```bash
# Listar volúmenes Docker
docker volume ls | grep nexus

# Debería mostrar:
# local     nexus-postgres-data
```

---

## 🗄️ Estructura de Base de Datos Local

### **Tablas Creadas Automáticamente**
Al iniciar el contenedor, se ejecutan los scripts en `init-scripts/` que crean:

1. **Tablas de Autenticación:**
   - `users` - Gestión de usuarios
   - `profiles` - Perfiles de usuarios
   - `roles` - Roles del sistema
   - `user_roles` - Asignación de roles
   - `user_permissions` - Permisos individuales

2. **Tablas de Gestión Legal:**
   - `documentos` - Metadatos de documentos
   - `document_chunks` - Fragmentos para búsqueda semántica
   - `casos` - Expedientes digitales
   - `clientes` - Base de datos de clientes
   - `casos_clientes` - Relación casos-clientes
   - `casos_documentos` - Relación casos-documentos

3. **Tablas de Almacenamiento:**
   - `storage_buckets` - Buckets de almacenamiento
   - `storage_objects` - Objetos almacenados
   - `sessions` - Sesiones tradicionales

### **Verificar Tablas Creadas**
```bash
# Listar todas las tablas
docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -c "\dt"

# Ver estructura de una tabla específica
docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -c "\d users"
```

---

## 🔧 Variables de Entorno

### **Archivo de Configuración**
El archivo `.env.development` contiene las variables de entorno para desarrollo local:

```env
# Database Configuration for Local Development
DATABASE_URL=postgresql://nexus_admin:nexus123@localhost:5432/nexus_juridico
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexus_juridico
DB_USER=nexus_admin
DB_PASSWORD=nexus123
DB_SCHEMA=public

# Supabase Configuration (for future use)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google AI Configuration
GOOGLE_AI_API_KEY=

# Application Settings
NODE_ENV=development
```

### **Configurar Variables de Entorno**
```bash
# Copiar archivo de ejemplo
cp .env.development.example .env.development

# Editar variables según sea necesario
code .env.development
```

---

## 🧪 Pruebas de Conexión y Funcionalidades

### **1. Pruebas de Conexión Básica**
```bash
# Ejecutar pruebas de conexión
node src/lib/final-test.js
```

**Salida esperada:**
```
🔍 Debugging PostgreSQL Connection...
📊 Environment Variables:
   DATABASE_URL: postgresql://nexus_admin:nexus123@localhost:5432/nexus_juridico
   ...

🔄 Attempting to connect...
✅ Connection successful!

📋 Testing basic query...
   Current User: nexus_admin
   Current Database: nexus_juridico
   PostgreSQL Version: PostgreSQL 17.4 (Debian 17.4-1.pgdg12+1)

📋 Testing table queries...
   Users table count: 1
   Profiles table count: 1
   Documents table count: 0

🎉 All tests passed successfully!
```

### **2. Pruebas de Autenticación**
```bash
# Verificar usuario Super Admin temporal
docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -c "SELECT email, is_super_admin, is_temporary_super_admin FROM users WHERE email = 'aliflores@capitolioconsultores.com';"
```

### **3. Pruebas de CRUD**
```bash
# Probar inserción básica
docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -c "INSERT INTO users (id, email, encrypted_password, email_confirmed_at, is_super_admin) VALUES ('00000000-0000-0000-0000-000000000002'::UUID, 'test@capitolioconsultores.com', 'password_hash', NOW(), FALSE);"

# Verificar inserción
docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -c "SELECT COUNT(*) as count FROM users;"

# Limpiar prueba
docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -c "DELETE FROM users WHERE email = 'test@capitolioconsultores.com';"
```

---

## 🔄 Gestión de Contenedores Docker

### **Comandos Útiles**

#### **Iniciar/Reiniciar Contenedores**
```bash
# Iniciar contenedores
docker-compose up -d

# Reiniciar contenedores
docker-compose restart

# Reiniciar contenedor específico
docker-compose restart nexus-postgres
```

#### **Detener Contenedores**
```bash
# Detener contenedores manteniendo datos
docker-compose stop

# Detener y eliminar contenedores (mantiene volúmenes)
docker-compose down

# Detener y eliminar todo (incluyendo volúmenes - ¡PELIGROSO!)
docker-compose down -v
```

#### **Verificar Estado**
```bash
# Ver estado de contenedores
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un contenedor específico
docker-compose logs -f nexus-postgres

# Ver uso de recursos
docker stats
```

#### **Gestión de Volúmenes**
```bash
# Listar volúmenes
docker volume ls | grep nexus

# Inspeccionar volumen
docker volume inspect nexus-postgres-data

# Eliminar volumen (¡PELIGROSO! Borra todos los datos)
docker volume rm nexus-postgres-data
```

---

## 🛠️ Desarrollo de la Aplicación

### **1. Iniciar Servidor de Desarrollo**
```bash
# Iniciar servidor de desarrollo Next.js
npm run dev

# O con yarn
yarn dev
```

**Acceder a la aplicación:** http://localhost:3000

### **2. Estructura de Directorios Importantes**
```
src/
├── app/                    # Rutas y páginas de la aplicación
│   ├── api/               # Endpoints de API
│   │   ├── auth/          # Autenticación
│   │   ├── chat/          # Asistente de IA
│   │   └── search/        # Búsqueda semántica
│   ├── private/           # Área privada protegida
│   └── public/            # Área pública
├── components/            # Componentes React
│   ├── private/           # Componentes privados
│   └── public/            # Componentes públicos
├── lib/                   # Librerías y utilidades
│   ├── db.js              # Conexión a base de datos
│   ├── ai.ts              # Funciones de IA
│   └── server.ts          # Funciones del servidor
└── styles/                # Estilos globales
```

### **3. Desarrollo de APIs**
Las APIs se desarrollan en `src/app/api/` usando el App Router de Next.js:

```javascript
// Ejemplo: src/app/api/users/route.js
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const result = await query('SELECT * FROM users');
    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

---

## 🔐 Sistema de Autenticación Local

### **Usuario Super Admin Temporal**
Para desarrollo, se crea automáticamente un usuario Super Admin:

- **Email:** `aliflores@capitolioconsultores.com`
- **Contraseña:** `admin123`
- **Rol:** Super Admin con todos los permisos

### **Verificar Usuario Super Admin**
```bash
# Verificar que el usuario existe
docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -c "SELECT email, is_super_admin, is_temporary_super_admin FROM users WHERE email = 'aliflores@capitolioconsultores.com';"
```

### **Crear Usuarios de Prueba**
```bash
# Crear usuario de prueba
docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -c "
INSERT INTO users (id, email, encrypted_password, email_confirmed_at, is_super_admin) 
VALUES ('00000000-0000-0000-0000-000000000003'::UUID, 'abogado@capitolioconsultores.com', '\$2a\$10\$abcdefghijklmnopqrstuvABCDEFGHIJKLMNO', NOW(), FALSE);
"

# Crear perfil para el usuario
docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -c "
INSERT INTO profiles (id, full_name, role) 
VALUES ('00000000-0000-0000-0000-000000000003'::UUID, 'Abogado de Prueba', 'abogado');
"
```

---

## 📊 Backup y Restauración

### **1. Crear Backup Local**
```bash
# Crear backup completo de la base de datos
docker exec nexus-postgres pg_dump -U nexus_admin nexus_juridico > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Crear backup comprimido
docker exec nexus-postgres pg_dump -U nexus_admin nexus_juridico | gzip > backups/backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### **2. Restaurar desde Backup**
```bash
# Restaurar desde backup SQL
docker exec -i nexus-postgres psql -U nexus_admin nexus_juridico < backups/backup_anterior.sql

# Restaurar desde backup comprimido
gunzip -c backups/backup_anterior.sql.gz | docker exec -i nexus-postgres psql -U nexus_admin nexus_juridico
```

### **3. Backup Automático**
```bash
# Script de backup automático (cron job)
#!/bin/bash
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker exec nexus-postgres pg_dump -U nexus_admin nexus_juridico > "$BACKUP_DIR/backup_$DATE.sql"
find "$BACKUP_DIR" -name "backup_*.sql" -mtime +7 -delete  # Eliminar backups antiguos de más de 7 días
```

---

## 🚨 Problemas Comunes y Soluciones

### **1. Docker no responde**
```bash
# Reiniciar Docker Desktop
# En Windows: Servicios -> Reiniciar Docker Desktop Service

# O reiniciar desde PowerShell como administrador
Restart-Service docker
```

### **2. Puerto 5432 ocupado**
```bash
# Ver qué proceso usa el puerto 5432
netstat -ano | findstr :5432

# Matar el proceso (reemplazar PID)
taskkill /PID <PID> /F

# O cambiar el puerto en docker-compose.yml
ports:
  - "5433:5432"  # Cambiar a 5433
```

### **3. Conexión a base de datos fallida**
```bash
# Verificar que el contenedor está corriendo
docker-compose ps

# Verificar logs
docker-compose logs nexus-postgres

# Reiniciar contenedor
docker-compose restart nexus-postgres
```

### **4. Permisos denegados en volúmenes**
```bash
# En Windows, asegurarse de que Docker Desktop tiene permisos
# Settings -> Resources -> File Sharing -> Agregar directorio del proyecto

# Reiniciar Docker Desktop
```

### **5. Scripts de inicialización no se ejecutan**
```bash
# Verificar que los scripts están en init-scripts/
ls -la init-scripts/

# Reiniciar contenedores con volúmenes limpios
docker-compose down -v
docker-compose up -d
```

---

## 🎯 Siguientes Pasos en el Desarrollo

### **Fase 1: Integración de la Aplicación**
1. **Adaptar código de conexión** en `src/lib/db.js`
2. **Implementar middleware de autenticación** en rutas protegidas
3. **Crear endpoints de login/logout** en `src/app/api/auth/`
4. **Desarrollar interfaces de usuario** para gestión de casos

### **Fase 2: Funcionalidades Avanzadas**
1. **Integrar funciones de IA** para procesamiento de documentos
2. **Implementar búsqueda semántica** con pgvector
3. **Crear sistema de permisos** granulares por rol
4. **Desarrollar panel de administración** del Super Admin

### **Fase 3: Pruebas y Optimización**
1. **Ejecutar pruebas de integración** completas
2. **Optimizar consultas** a la base de datos
3. **Implementar caching** para mejor rendimiento
4. **Configurar monitoreo** de rendimiento

---

## 📚 Recursos Adicionales

### **Documentación de Referencia**
- **Documentación Técnica Local:** `Documentacion_Tecnica_Local.md`
- **Plan Maestro:** `Plan_Maestro_Nexus_Juridico.md`
- **Documentación de Autenticación:** `Documentacion_Sistema_Autenticacion.md`

### **Herramientas Recomendadas**
- **DBeaver:** Cliente universal de bases de datos
- **Postman:** Pruebas de APIs REST
- **Docker Desktop:** Gestión de contenedores
- **VS Code Extensions:** Docker, PostgreSQL, Next.js

### **Comandos de Desarrollo Útiles**
```bash
# Verificar estado del entorno
npm run health-check

# Ejecutar pruebas unitarias
npm test

# Construir para producción
npm run build

# Iniciar servidor de producción
npm start

# Formatear código
npm run format

# Linting
npm run lint
```

---

## 🆘 Soporte y Contacto

### **Equipo de Desarrollo**
- **Arquitecto de Software:** Jesús Cova
- **Soporte Técnico:** Equipo de Desarrollo Capitolio Consultores

### **Canal de Comunicación**
Para problemas técnicos o preguntas sobre el entorno de desarrollo:
- **Email:** soporte@capitolioconsultores.com
- **Slack:** Canal #desarrollo-nexus-juridico

---

**¡Feliz codificación!** 🚀

*Esta guía se actualizará regularmente con nuevas mejoras y soluciones a problemas comunes.*
