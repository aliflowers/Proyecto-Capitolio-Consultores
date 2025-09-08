# 📚 DOCUMENTACIÓN TÉCNICA - INFRAESTRUCTURA LOCAL NEXUS JURÍDICO

**Fecha:** 28 de agosto de 2025  
**Versión:** 1.0  
**Autor:** Equipo de Desarrollo Capitolio Consultores

---

## 🎯 **OBJETIVO**

Documentar la **infraestructura técnica local** implementada para el desarrollo del proyecto Nexus Jurídico, proporcionando detalles sobre la configuración, arquitectura, y procedimientos para mantener y escalar el entorno de desarrollo.

---

## 🏗️ **ARQUITECTURA TÉCNICA LOCAL**

### **Diagrama de Arquitectura**

```
Nexus Jurídico - Entorno de Desarrollo Local:
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DESARROLLO LOCAL                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐      │
│  │   Aplicación    │────│  PostgreSQL     │────│   Volúmenes    │      │
│  │   Next.js       │    │  17.4 + pgvector │    │  Persistentes  │      │
│  │                 │    │                  │    │                 │      │
│  │  Puerto: 3000   │    │  Puerto: 5432    │    │  nexus-postgres-│      │
│  └─────────────────┘    └──────────────────┘    │  data           │      │
│          │                       │               └─────────────────┘      │
│          │               ┌───────┴───────┐                                │
│          │               │   Docker      │                                │
│          │               │   Compose     │                                │
│          │               └───────────────┘                                │
│          ▼                                                              │
│  ┌─────────────────┐                                                    │
│  │   Variables     │                                                    │
│  │  .env.development                                                     │
│  └─────────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **Componentes de la Arquitectura**

#### **1. Aplicación Next.js (Frontend/Backend)**
- **Framework:** Next.js 15.5.0
- **Lenguaje:** TypeScript
- **Puerto:** 3000 (desarrollo)
- **Rutas:** App Router con estructura modular
- **APIs:** API Routes para endpoints REST

#### **2. Base de Datos PostgreSQL**
- **Versión:** PostgreSQL 17.4
- **Extensión:** pgvector v0.8.0
- **Puerto:** 5432
- **Usuario:** nexus_admin
- **Base de Datos:** nexus_juridico
- **Contraseña:** nexus_password_segura_2025

#### **3. Contenedores Docker**
- **Orquestador:** Docker Compose
- **Imagen Base:** postgres:17.4
- **Volúmenes:** nexus-postgres-data (persistente)
- **Red:** bridge network por defecto

---

## 🐳 **CONFIGURACIÓN DOCKER**

### **docker-compose.yml**

```yaml
version: '3.8'

services:
  postgres:
    build:
      context: .
      dockerfile: Dockerfile.postgres
    container_name: nexus-postgres
    environment:
      POSTGRES_DB: nexus_juridico
      POSTGRES_USER: nexus_admin
      POSTGRES_PASSWORD: nexus_password_segura_2025
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --auth-host=md5 --auth-local=trust"
    ports:
      - "5432:5432"
    volumes:
      - nexus-postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nexus_admin -d nexus_juridico"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  nexus-postgres-data:
    name: nexus-postgres-data
```

### **Dockerfile.postgres**

```dockerfile
FROM postgres:17.4

# Instalar dependencias
RUN apt-get update && apt-get install -y \
    build-essential \
    postgresql-server-dev-17 \
    git \
    && rm -rf /var/lib/apt/lists/*

# Instalar extensión pgvector
RUN git clone --branch v0.8.0 https://github.com/pgvector/pgvector.git \
    && cd pgvector \
    && make \
    && make install \
    && cd .. \
    && rm -rf pgvector

# Limpiar
RUN apt-get remove -y build-essential postgresql-server-dev-17 git \
    && apt-get autoremove -y \
    && apt-get clean

# Configurar encriptación de contraseñas MD5
RUN echo "password_encryption = md5" >> /usr/share/postgresql/postgresql.conf.sample

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD pg_isready -U nexus_admin -d nexus_juridico
```

### **Comandos Docker Útiles**

```bash
# Iniciar contenedores
docker-compose up -d

# Detener contenedores
docker-compose down

# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f

# Reiniciar contenedores
docker-compose restart

# Acceder al contenedor
docker exec -it nexus-postgres bash

# Acceder a PostgreSQL
docker exec -it nexus-postgres psql -U nexus_admin -d nexus_juridico
```

---

## 🗃️ **ESQUEMA DE BASE DE DATOS**

### **Tablas Principales**

#### **1. users**
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
  is_temporary_super_admin BOOLEAN DEFAULT FALSE
);
```

#### **2. profiles**
```sql
CREATE TABLE profiles (
  id UUID REFERENCES users NOT NULL PRIMARY KEY,
  updated_at TIMESTAMPTZ,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'abogado'
);
```

#### **3. documentos**
```sql
CREATE TABLE documentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **4. document_chunks**
```sql
CREATE TABLE document_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documentos NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(768),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **5. casos**
```sql
CREATE TABLE casos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  case_name TEXT NOT NULL,
  case_number TEXT UNIQUE,
  status TEXT DEFAULT 'abierto',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **6. clientes**
```sql
CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### **7. storage_buckets**
```sql
CREATE TABLE storage_buckets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### **8. storage_objects**
```sql
CREATE TABLE storage_objects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_id TEXT NOT NULL,
  name TEXT NOT NULL,
  owner TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_accessed_at TIMESTAMPTZ DEFAULT now()
);
```

### **Tablas de Relación**

#### **casos_clientes**
```sql
CREATE TABLE casos_clientes (
  caso_id UUID REFERENCES casos ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes ON DELETE CASCADE,
  PRIMARY KEY (caso_id, cliente_id)
);
```

#### **casos_documentos**
```sql
CREATE TABLE casos_documentos (
  caso_id UUID REFERENCES casos ON DELETE CASCADE,
  documento_id UUID REFERENCES documentos ON DELETE CASCADE,
  PRIMARY KEY (caso_id, documento_id)
);
```

---

## 📜 **SCRIPTS DE INICIALIZACIÓN**

### **Directorio: `init-scripts/`**

#### **0000_install_vector_extension.sql**
```sql
-- Instala la extensión pgvector durante la inicialización
\echo 'Vector extension will be installed during container initialization'
\echo 'This script ensures proper ordering of initialization scripts'
```

#### **0001_enable_extensions.sql**
```sql
-- Habilita extensiones requeridas
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crea esquema para funciones HTTP
CREATE SCHEMA IF NOT EXISTS net;

-- Crea función simulada para HTTP POST
CREATE OR REPLACE FUNCTION net.http_post(url text, body jsonb)
RETURNS void AS $$
BEGIN
    RAISE NOTICE 'HTTP POST to % with body: %', url, body;
END;
$$ LANGUAGE plpgsql;
```

#### **0001_create_auth_tables.sql**
```sql
-- Crea tablas de autenticación
CREATE TABLE users (...);
CREATE TABLE profiles (...);
CREATE INDEX ...;
INSERT INTO users (...) VALUES (...);
INSERT INTO profiles (...) VALUES (...);
CREATE FUNCTION auth_uid() ...;
CREATE FUNCTION auth_jwt() ...;
```

#### **0002_create_documents_table.sql**
```sql
-- Crea tablas de documentos y almacenamiento
CREATE TABLE documentos (...);
CREATE TABLE storage_objects (...);
CREATE TABLE storage_buckets (...);
INSERT INTO storage_buckets (...) VALUES (...);
CREATE INDEX ...;
```

#### **0003_intelligent_search_and_cases.sql**
```sql
-- Crea tablas para búsqueda inteligente y gestión de casos
CREATE TABLE document_chunks (...);
CREATE TABLE clientes (...);
CREATE TABLE casos (...);
CREATE TABLE casos_clientes (...);
CREATE TABLE casos_documentos (...);
CREATE INDEX ...;
```

#### **0004_document_processing_trigger.sql**
```sql
-- Crea trigger para procesamiento de documentos
CREATE OR REPLACE FUNCTION trigger_process_document()
RETURNS TRIGGER AS $$
BEGIN
    RAISE NOTICE 'Document inserted: % (ID: %)', NEW.name, NEW.id;
    INSERT INTO storage_objects (...) VALUES (...);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_document_inserted
AFTER INSERT ON documentos
FOR EACH ROW
EXECUTE FUNCTION trigger_process_document();
```

#### **0005_semantic_search_function.sql**
```sql
-- Crea función para búsqueda semántica
CREATE OR REPLACE FUNCTION match_document_chunks(...)
RETURNS TABLE (...) AS $$
BEGIN
    RETURN QUERY
    SELECT ... FROM document_chunks AS dc
    WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔧 **CONFIGURACIÓN DE CONEXIÓN**

### **Variables de Entorno (.env.development)**

```env
# Database Configuration for Local Development
DATABASE_URL=postgresql://nexus_admin:nexus_password_segura_2025@localhost:5432/nexus_juridico
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexus_juridico
DB_USER=nexus_admin
DB_PASSWORD=nexus_password_segura_2025
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

### **Librería de Conexión (src/lib/db.js)**

```javascript
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.development' });

// Configuración de la conexión a la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Función para ejecutar consultas
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Consulta ejecutada', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('Error en consulta', { text, duration, error: error.message });
    throw error;
  }
}

// Función para obtener una conexión del pool
async function getClient() {
  return await pool.connect();
}

// Función para cerrar el pool de conexiones
async function close() {
  await pool.end();
}

// Función para simular auth.uid() de Supabase
function getCurrentUserId() {
  return process.env.NODE_ENV === 'development' 
    ? '00000000-0000-0000-0000-000000000001' 
    : null;
}

// Función para verificar la conexión
async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('Conexión a la base de datos establecida correctamente');
    return true;
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error.message);
    return false;
  }
}

module.exports = {
  query,
  getClient,
  close,
  pool,
  getCurrentUserId,
  testConnection
};
```

---

## 🧪 **PRUEBAS Y VERIFICACIÓN**

### **Script de Pruebas (src/lib/final-test.js)**

```javascript
const { testConnection, query, getCurrentUserId } = require('./db');

async function finalTest() {
  console.log('🚀 Iniciando prueba final de conexión a la base de datos...');
  
  // Probar conexión
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('❌ No se pudo conectar a la base de datos');
    process.exit(1);
  }
  
  console.log('✅ Conexión establecida correctamente');
  
  try {
    // Probar consulta básica
    console.log('\n📋 Probando consultas básicas...');
    const result = await query('SELECT current_user, current_database()');
    console.log('   Usuario actual:', result.rows[0].current_user);
    console.log('   Base de datos:', result.rows[0].current_database);
    
    // Probar contar usuarios
    const userResult = await query('SELECT COUNT(*) as total FROM users');
    console.log('   Total de usuarios:', userResult.rows[0].total);
    
    // Probar contar perfiles
    const profileResult = await query('SELECT COUNT(*) as total FROM profiles');
    console.log('   Total de perfiles:', profileResult.rows[0].total);
    
    // Probar contar documentos
    const docResult = await query('SELECT COUNT(*) as total FROM documentos');
    console.log('   Total de documentos:', docResult.rows[0].total);
    
    // Probar función de usuario actual
    const currentUserId = getCurrentUserId();
    console.log('   ID de usuario actual:', currentUserId);
    
    console.log('\n🎉 Todas las pruebas pasaron exitosamente!');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    process.exit(1);
  }
}

// Ejecutar si este archivo se llama directamente
if (require.main === module) {
  finalTest().catch(console.error);
}

module.exports = finalTest;
```

### **Comandos de Prueba**

```bash
# Ejecutar pruebas finales
node src/lib/final-test.js

# Ejecutar pruebas de diagnóstico
node src/lib/debug-test.js

# Verificar estructura de base de datos
docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -c "\dt"

# Verificar datos en tablas específicas
docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -c "SELECT COUNT(*) FROM users;"
docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -c "SELECT COUNT(*) FROM profiles;"
docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -c "SELECT COUNT(*) FROM documentos;"
```

---

## 🔄 **MANTENIMIENTO Y OPERACIONES**

### **Backup y Restauración**

#### **Backup Manual**
```bash
# Crear backup completo
docker exec nexus-postgres pg_dump -U nexus_admin nexus_juridico > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Crear backup comprimido
docker exec nexus-postgres pg_dump -U nexus_admin nexus_juridico | gzip > backups/backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

#### **Restauración Manual**
```bash
# Restaurar desde backup SQL
docker exec -i nexus-postgres psql -U nexus_admin nexus_juridico < backups/backup_anterior.sql

# Restaurar desde backup comprimido
gunzip -c backups/backup_anterior.sql.gz | docker exec -i nexus-postgres psql -U nexus_admin nexus_juridico
```

#### **Backup Automático**
```bash
# Script de backup automático (cron job)
#!/bin/bash
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker exec nexus-postgres pg_dump -U nexus_admin nexus_juridico > "$BACKUP_DIR/backup_$DATE.sql"
find "$BACKUP_DIR" -name "backup_*.sql" -mtime +7 -delete  # Eliminar backups antiguos de más de 7 días
```

### **Monitoreo y Logs**

#### **Ver Logs de Contenedores**
```bash
# Ver logs en tiempo real
docker-compose logs -f

# Ver logs específicos
docker-compose logs nexus-postgres

# Ver logs de un período específico
docker-compose logs --since "2025-08-28" --until "2025-08-29" nexus-postgres
```

#### **Monitoreo de Recursos**
```bash
# Ver estadísticas de contenedores
docker stats

# Ver uso de recursos específicos
docker stats nexus-postgres

# Ver información detallada del contenedor
docker inspect nexus-postgres
```

---

## 🚨 **PROBLEMAS COMUNES Y SOLUCIONES**

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

## 🎯 **PLAN DE ESCALAMIENTO**

### **1. Escalamiento Vertical (Más Recursos)**
```yaml
# docker-compose.yml - Versión escalada
services:
  postgres:
    # ... configuración existente ...
    mem_limit: 4g
    mem_reservation: 2g
    cpus: 2.0
    environment:
      # ... variables existentes ...
      POSTGRES_SHARED_BUFFERS: 512MB
      POSTGRES_EFFECTIVE_CACHE_SIZE: 2GB
      POSTGRES_WORK_MEM: 16MB
```

### **2. Escalamiento Horizontal (Réplicas)**
```yaml
# docker-compose.yml - Versión con réplicas
services:
  postgres-primary:
    # ... configuración del primario ...
    
  postgres-replica:
    # ... configuración de la réplica ...
    depends_on:
      - postgres-primary
```

### **3. Migración a Producción**
```bash
# 1. Exportar base de datos
docker exec nexus-postgres pg_dump -U nexus_admin nexus_juridico > production_backup.sql

# 2. En servidor de producción:
#    - Instalar PostgreSQL 17.4 + pgvector
#    - Crear base de datos y usuario
#    - Importar production_backup.sql
#    - Configurar firewall y seguridad
```

---

## 📚 **REFERENCIAS Y RECURSOS**

### **Documentación Oficial**
- **PostgreSQL:** https://www.postgresql.org/docs/
- **pgvector:** https://github.com/pgvector/pgvector
- **Docker:** https://docs.docker.com/
- **Docker Compose:** https://docs.docker.com/compose/

### **Herramientas Recomendadas**
- **DBeaver:** Cliente universal de bases de datos
- **pgAdmin:** Administrador web de PostgreSQL
- **Postman:** Pruebas de APIs REST
- **Docker Desktop:** Gestión de contenedores

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

## 🆘 **SOPORTE Y CONTACTO**

### **Equipo de Desarrollo**
- **Arquitecto de Software:** Jesús Cova
- **Soporte Técnico:** Equipo de Desarrollo Capitolio Consultores

### **Canal de Comunicación**
Para problemas técnicos o preguntas sobre el entorno de desarrollo:
- **Email:** soporte@capitolioconsultores.com
- **Slack:** Canal #desarrollo-nexus-juridico

---

**¡El entorno de desarrollo local está completamente documentado y listo para usar!** 🚀
