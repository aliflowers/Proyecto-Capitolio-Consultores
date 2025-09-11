# Nexus Jurídico - Plataforma Legal Inteligente

**Desarrollado para Capitolio Consultores**  
**Versión:** 1.0  
**Fecha:** 28 de agosto de 2025

---

## 📋 **ESTADO DEL PROYECTO**

### ✅ **FASE 1: CORE DE AUTENTICACIÓN COMPLETADA**

El proyecto Nexus Jurídico tiene su **infraestructura de desarrollo local completamente funcional**:

- **🟢 Base de Datos Local**: PostgreSQL 17.4 con pgvector instalado
- **🟢 Contenedor Docker**: Configurado y funcionando con volúmenes persistentes
- **🟢 Conexión Node.js**: Verificada y optimizada
- **🟢 Estructura de Tablas**: 14 tablas principales creadas y funcionales
- **🟢 Scripts de Prueba**: Todos los tests pasan exitosamente
- **🟢 Super Admin Temporal**: `aliflores@capitolioconsultores.com` (admin123)

---

## 🚀 **INICIAR ENTORNO DE DESARROLLO LOCAL**

### **1. Requisitos Previos**
- Docker Desktop instalado y corriendo
- Node.js 18+ instalado
- npm o yarn instalado

### **2. Iniciar Contenedores**
```bash
# Iniciar entorno de desarrollo completo
docker-compose up -d

# Verificar que los contenedores están corriendo
docker-compose ps
```

### **3. Verificar Conexión**
```bash
# Ejecutar pruebas de conexión
node src/lib/final-test.js

# Ejecutar diagnóstico detallado
node src/lib/debug-test.js
```

### **4. Variables de Entorno**
El archivo `.env.development` está configurado con:
```env
DATABASE_URL=postgresql://nexus_admin:nexus_password_segura_2025@localhost:5432/nexus_juridico
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexus_juridico
DB_USER=nexus_admin
DB_PASSWORD=nexus_password_segura_2025
```

---

## 🗄️ **ESTRUCTURA DE BASE DE DATOS LOCAL**

### **Tablas principales:**
1. `users` - Gestión de usuarios y autenticación
2. `profiles` - Perfiles de usuarios con roles
3. `documentos` - Metadatos de documentos
4. `document_chunks` - Fragmentos de texto para búsqueda semántica
5. `expedientes` - Expedientes digitales
6. `clientes` - Base de datos de clientes
7. `expedientes_clientes` - Relación muchos a muchos entre expedientes y clientes
8. `expedientes_documentos` - Relación muchos a muchos entre expedientes y documentos
9. `sessions` - Sesiones tradicionales para autenticación web
10. `user_permissions` - Permisos individuales por usuario
11. `user_roles` - Asignación de roles a usuarios
12. `roles` - Roles predefinidos con permisos granulares

---

## 🔄 **PLAN DE MIGRACIÓN DEFINIDO**

### **Para Desarrollo Local**
```bash
# Mantener el entorno activo
docker-compose up -d

# Verificar conexión
node src/lib/final-test.js
```

### **Para Migrar a Servidor Físico**
```bash
# 1. Exportar base de datos
docker exec nexus-postgres pg_dump -U nexus_admin nexus_juridico > backup.sql

# 2. En el servidor destino:
#    - Instalar PostgreSQL 17.4 + pgvector
#    - Crear base de datos y usuario
#    - Importar backup.sql
```

### **Para Sincronización con Supabase**
```bash
# 1. Crear proyecto en Supabase
# 2. Aplicar scripts de migración desde /init-scripts/
# 3. Configurar variables de entorno para producción
```

---

## 🧪 **SCRIPTS DE PRUEBA Y GESTIÓN**

### **Pruebas de Conexión**
```bash
node src/lib/debug-test.js     # Diagnóstico detallado
node src/lib/final-test.js     # Pruebas completas
node src/lib/simple-test.js    # Pruebas básicas
```

### **Gestión de Entorno**
```bash
node scripts/quick-start.js    # Inicialización rápida
node scripts/init-local-db.js  # Configuración automática
node scripts/check-docker.js   # Verificación de Docker
```

### **Resultado Esperado**
```
🎉 Todas las pruebas pasaron exitosamente!
✅ La conexión a la base de datos está funcionando correctamente
✅ Las consultas básicas funcionan
✅ Las inserciones funcionan
✅ El sistema está listo para usar
```

---

## 📁 **ESTRUCTURA DE DIRECTORIOS CLAVE**

```
capitolio-consultores/
├── docker-compose.yml              # Orquestación de contenedores
├── Dockerfile.postgres            # Imagen personalizada PostgreSQL
├── .env.development               # Variables de entorno local
├── init-scripts/                  # Scripts de inicialización PostgreSQL
│   ├── 0000_install_vector_extension.sql
│   ├── 0001_enable_extensions.sql
│   ├── 0002_create_auth_tables.sql
│   ├── 0003_create_core_tables.sql
│   ├── 0004_create_expedientes_and_chunks.sql
│   ├── 0005_document_processing_trigger.sql
│   ├── 0006_semantic_search_function.sql
│   ├── 0007_create_roles_and_permissions.sql
│   ├── 0008_initialize_dev_environment.sql
│   └── 0009_policies_and_audit.sql
├── scripts/                       # Scripts de gestión
│   ├── quick-start.js            # Inicialización rápida
│   ├── init-local-db.js          # Configuración automática
│   ├── check-docker.js           # Verificación de Docker
│   └── setup-local-environment.js # Setup completo
├── src/
│   ├── lib/                      # Librerías y utilidades
│   │   ├── db.js                # Conexión a base de datos local
│   │   ├── debug-test.js        # Diagnóstico de conexión
│   │   ├── final-test.js        # Pruebas completas
│   │   ├── simple-test.js       # Pruebas básicas
│   │   └── verify-environment.js # Verificación del entorno
│   ├── app/                     # Aplicación Next.js
│   └── components/              # Componentes React
└── Documentación/
    ├── Documentacion_Tecnica_Local.md
    ├── RESUMEN_IMPLEMENTACION_FASE_1.md
    ├── PLAN_MIGRACION_COMPLETO.md
    └── Plan_Maestro_Nexus_Juridico.md
```

---

## 🎯 **SIGUIENTES PASOS RECOMENDADOS**

### **Fase 2: Desarrollo de APIs CRUD Básicas**
1. **Desarrollar APIs REST protegidas** para gestión de usuarios
2. **Implementar endpoints CRUD** para expedientes, clientes y documentos
3. **Crear middleware de autenticación** para proteger rutas
4. **Desarrollar sistema de validación** de datos de entrada

### **Fase 3: Sistema de Permisos Avanzado**
1. **Implementar middleware de autorización** granular
2. **Desarrollar sistema de roles** dinámicos
3. **Crear gestión de scopes** por módulo
4. **Configurar políticas RLS** (Row Level Security)

### **Fase 4: Interfaces de Usuario**
1. **Crear panel de administración** del Super Admin
2. **Desarrollar componentes de gestión** de usuarios
3. **Implementar sistema de asignación** de permisos
4. **Diseñar interfaces de usuario** responsive

---

## 📖 **DOCUMENTACIÓN COMPLETA**

### **Archivos de Documentación Principales:**
- **`Documentacion_Tecnica_Local.md`** - Documentación técnica de infraestructura local
- **`RESUMEN_IMPLEMENTACION_FASE_1.md`** - Resumen detallado de la Fase 1 completada
- **`PLAN_MIGRACION_COMPLETO.md`** - Plan completo de migración a producción
- **`Plan_Maestro_Nexus_Juridico.md`** - Plan maestro actualizado con historial de cambios

### **Documentos de Referencia:**
- **`README.md`** - Este documento (guía principal)
- **`DEVELOPMENT_GUIDE.md`** - Guía de desarrollo detallada
- **`Documentacion_Sistema_Autenticacion.md`** - Documentación del sistema de autenticación

---

## 🛠️ **COMANDOS ÚTILES DE DESARROLLO**

### **Gestión de Contenedores Docker**
```bash
# Iniciar entorno de desarrollo
docker-compose up -d

# Detener entorno de desarrollo
docker-compose down

# Ver estado de contenedores
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Reiniciar contenedores
docker-compose restart

# Acceder al contenedor PostgreSQL
docker exec -it nexus-postgres psql -U nexus_admin -d nexus_juridico
```

### **Gestión de Base de Datos**
```bash
# Verificar estructura de base de datos
docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -c "\dt"

# Crear backup de la base de datos
docker exec nexus-postgres pg_dump -U nexus_admin nexus_juridico > backup.sql

# Restaurar desde backup
docker exec -i nexus-postgres psql -U nexus_admin nexus_juridico < backup.sql

# Verificar conexión a PostgreSQL
docker exec nexus-postgres pg_isready -U nexus_admin -d nexus_juridico
```

### **Pruebas y Verificación**
```bash
# Pruebas de conexión Node.js
node src/lib/final-test.js

# Pruebas de diagnóstico
node src/lib/debug-test.js

# Inicialización rápida del entorno
node scripts/quick-start.js

# Verificación del entorno
node src/lib/verify-environment.js
```

---

## 🆘 **SOPORTE Y PROBLEMAS COMUNES**

### **Si la conexión falla:**
1. **Verificar Docker Desktop**: Asegurarse de que esté corriendo
   ```bash
   docker --version
   docker info
   ```

2. **Verificar contenedores**: Comprobar estado
   ```bash
   docker-compose ps
   docker-compose logs nexus-postgres
   ```

3. **Verificar variables de entorno**: Revisar `.env.development`
   ```bash
   cat .env.development
   ```

### **Reiniciar entorno limpio:**
```bash
# Detener y eliminar volúmenes
docker-compose down -v

# Reiniciar desde cero
docker-compose up -d

# Verificar estado
docker-compose ps
```

### **Problemas de autenticación:**
```bash
# Verificar usuario Super Admin
docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -c "SELECT email, is_super_admin FROM users WHERE email = 'aliflores@capitolioconsultores.com';"

# Reiniciar contenedor si es necesario
docker-compose restart nexus-postgres
```

---

## 🛡️ **CONSIDERACIONES DE SEGURIDAD**

### **Medidas Implementadas:**
- ✅ **Autenticación JWT/Sesiones** en todos los endpoints
- ✅ **Validación de entrada robusta** para prevenir inyecciones SQL
- ✅ **Manejo seguro de errores** sin exposición de información sensible
- ✅ **Protección contra acceso no autorizado** a recursos
- ✅ **Herencia de permisos segura** de roles a usuarios
- ✅ **Políticas RLS configuradas** para seguridad a nivel de fila
- ✅ **Rate limiting implementado** para protección contra ataques DDoS
- ✅ **Sistema de auditoría** para registro de operaciones de permisos
- ⏳ **Sistema 2FA** para autenticación adicional (pendiente)
- ⏳ **Monitoreo de seguridad** y alertas (pendiente)

### **Rate Limiting (Protección contra DDoS)**

El sistema implementa **rate limiting por IP** para proteger las APIs contra ataques de denegación de servicio:

#### **Configuración por Tipo de Endpoint:**
- **APIs Protegidas**: 100 solicitudes por minuto por IP
- **Endpoints de Autenticación**: 10 solicitudes por 15 minutos por IP (muy estricto)
- **Endpoints Públicos**: 200 solicitudes por minuto por IP

#### **Implementación:**
```javascript
// Uso en APIs protegidas
const rateLimitResult = await apiRateLimit(request);
if (rateLimitResult) return rateLimitResult;

// Uso en endpoints de autenticación (más estricto)
const rateLimitResult = await authRateLimit(request);
if (rateLimitResult) return rateLimitResult;
```

#### **Headers de Respuesta:**
- `X-RateLimit-Limit`: Límite máximo de solicitudes
- `X-RateLimit-Remaining`: Solicitudes restantes en la ventana
- `X-RateLimit-Reset`: Tiempo Unix de reinicio del contador
- `Retry-After`: Segundos a esperar antes de reintentar

### **Auditoría de Operaciones**

Sistema de **auditoría completa** que registra todas las operaciones críticas del sistema:

#### **Eventos Auditados:**
- ✅ **Operaciones de Roles**: Creación, actualización, eliminación
- ✅ **Operaciones de Permisos**: Asignación, revocación de roles y permisos
- ✅ **Operaciones de Usuarios**: Creación, actualización, eliminación
- ✅ **Operaciones de Autenticación**: Login, logout, fallos de autenticación
- ✅ **Operaciones de Datos Sensibles**: Acceso a información crítica

#### **Información Registrada:**
- **Usuario**: ID del usuario que realizó la operación
- **Acción**: Tipo de operación realizada
- **Recurso**: Tipo de recurso afectado
- **ID del Recurso**: Identificador específico del recurso
- **Detalles**: Información adicional sobre la operación
- **IP**: Dirección IP del cliente
- **User Agent**: Información del navegador/cliente
- **Timestamp**: Momento exacto de la operación

#### **Consulta de Auditoría:**
```bash
# Ver logs de auditoría recientes
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50;

# Buscar operaciones específicas
SELECT * FROM audit_logs 
WHERE action = 'ASSIGN_ROLE' 
AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

## 🔧 Recuperación de contraseña en desarrollo

Existen dos métodos soportados para restablecer contraseñas en el entorno de desarrollo.

a) API: POST /api/dev/reset-password
- Cuerpo JSON: { "email": "usuario@example.com", "newPassword": "nueva123", "token": "DEVONLY" }
- El token se valida con la variable de entorno DEV_RESET_TOKEN (por defecto, "DEVONLY").

Ejemplo (curl):
```bash
curl -i -X POST http://localhost:3000/api/dev/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"aliflores@capitolioconsultores.com","newPassword":"NuevaClave123","token":"DEVONLY"}'
```

b) Script: node scripts/set-admin-password.js EMAIL NEW_PASSWORD
- Requiere .env.development con las variables de conexión a la BD.
- El script genera el hash de la contraseña automáticamente o la BD lo hace (según el flujo).

Ejemplo:
```bash
node scripts/set-admin-password.js aliflores@capitolioconsultores.com NuevaClave123
```

Troubleshooting rápido
- Asegúrate de que Docker y PostgreSQL estén ejecutándose (usa `npm run dev` que ya verifica Docker, o revisa `docker-compose ps`).
- Si la API devuelve "Token inválido", verifica la variable DEV_RESET_TOKEN.
- Confirma que `.env.development` contenga credenciales correctas para conectar a la base de datos.

---

## 🎉 **CONCLUSIÓN**

**¡El entorno de desarrollo local está completamente funcional y listo para usar!** 🚀

### **Logros Alcanzados:**
- ✅ **Infraestructura base** completamente implementada
- ✅ **Conexión a base de datos** verificada y optimizada
- ✅ **Estructura de tablas** creada y funcional
- ✅ **Super Admin temporal** configurado y probado
- ✅ **Documentación técnica** completa y actualizada
- ✅ **Plan de migración** definido y documentado
- ✅ **Sistema de seguridad avanzado** implementado (autenticación, autorización, rate limiting, auditoría)

### **Próximo Paso:**
Comenzar el desarrollo de las **APIs REST protegidas** para gestión de expedientes, clientes y documentos, integrando la autenticación y autorización implementadas.

**El proyecto Nexus Jurídico está listo para entrar en la fase de desarrollo activo de funcionalidades.** 🚀
