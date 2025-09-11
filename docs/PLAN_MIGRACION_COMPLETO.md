# 🔄 PLAN DE MIGRACIÓN COMPLETO - NEXUS JURÍDICO

**Fecha:** 28 de agosto de 2025  
**Versión:** 1.0  
**Autor:** Equipo de Desarrollo Capitolio Consultores

---

## 🎯 **OBJETIVO**

Definir un plan detallado y estructurado para la **migración de la base de datos local de desarrollo** a los **entornos de producción** (servidor físico local y Supabase en la nube), asegurando la **consistencia de datos**, **disponibilidad del sistema** y **mantenimiento de copias de seguridad**.

---

## 🏗️ **ARQUITECTURA DE MIGRACIÓN**

```
Entorno de Desarrollo Local ←→ Servidor Físico ←→ Supabase (Copia de Seguridad)
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Desarrollo    │────│  Producción     │────│   Backup       │
│   PC Local      │    │  Servidor Físico │    │   Supabase     │
│                 │    │                  │    │   (Nube)       │
│  PostgreSQL     │    │  PostgreSQL     │    │                 │
│  Docker         │    │  Nativo         │    │  PostgreSQL    │
│  Local          │    │  Local          │    │  Supabase      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
       │                       │                       │
       │               ┌───────┴───────┐               │
       │               │   Migración  │               │
       │               │   Diaria     │               │
       │               └───────────────┘               │
       │                       │                       │
       │               ┌───────┴───────┐               │
       │               │   Sincronización             │
       │               │   Automática                 │
       │               └───────────────┘               │
       └───────────────────────────────────────────────┘
                        Backup Diario
```

---

## 📋 **FASES DE MIGRACIÓN**

### **FASE 1: PREPARACIÓN DEL ENTORNO DE DESARROLLO**

#### **1.1. Verificación de Infraestructura Local**
- [x] **Docker Desktop** instalado y funcionando
- [x] **PostgreSQL 17.4** con pgvector configurado
- [x] **Volúmenes persistentes** creados (`nexus-postgres-data`)
- [x] **Variables de entorno** configuradas (`.env.development`)
- [x] **Conexión Node.js** verificada

#### **1.2. Estructura de Base de Datos Local**
- [x] **Tablas principales** creadas y funcionales
- [x] **Extensiones** habilitadas (pgvector, pgcrypto, uuid-ossp)
- [x] **Usuario Super Admin** temporal configurado
- [x] **Scripts de inicialización** verificados

#### **1.3. Pruebas de Funcionalidad**
- [x] **Conexión a base de datos** establecida
- [x] **Consultas básicas** funcionando
- [x] **Operaciones CRUD** verificadas
- [x] **Funciones del sistema** operativas

### **FASE 2: CONFIGURACIÓN DEL SERVIDOR FÍSICO**

#### **2.1. Requisitos del Servidor**
- [ ] **Sistema Operativo**: Ubuntu 22.04 LTS o CentOS 8+
- [ ] **Recursos Mínimos**: 4 CPU cores, 8GB RAM, 500GB SSD
- [ ] **Conectividad**: Acceso a internet para actualizaciones
- [ ] **Seguridad**: Firewall configurado, SSH seguro

#### **2.2. Instalación de PostgreSQL**
```bash
# Ubuntu 22.04
sudo apt update
sudo apt install postgresql-17 postgresql-contrib-17

# CentOS/RHEL
sudo yum install postgresql17-server postgresql17-contrib
```

#### **2.3. Instalación de pgvector**
```bash
# Descargar e instalar pgvector
git clone --branch v0.8.0 https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

#### **2.4. Configuración de Seguridad**
```bash
# Configurar autenticación MD5
sudo nano /etc/postgresql/17/main/pg_hba.conf
# Cambiar peer a md5 para conexiones locales

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### **FASE 3: CONFIGURACIÓN DE SUPABASE (COPIA DE SEGURIDAD)**

#### **3.1. Creación del Proyecto**
- [ ] **Registrar cuenta** en Supabase
- [ ] **Crear nuevo proyecto** "nexus-juridico-produccion"
- [ ] **Configurar región** cercana a Venezuela

#### **3.2. Configuración de Base de Datos**
- [ ] **Habilitar extensión pgvector**
- [ ] **Crear tablas** con el mismo esquema local
- [ ] **Configurar RLS** (Row Level Security)
- [ ] **Crear políticas** de acceso

#### **3.3. Configuración de Autenticación**
- [ ] **Habilitar proveedores** de autenticación
- [ ] **Configurar dominios** permitidos
- [ ] **Crear roles** y permisos
- [ ] **Configurar emails** de confirmación

### **FASE 4: MIGRACIÓN INICIAL**

#### **4.1. Exportar Base de Datos Local**
```bash
# Crear backup completo desde Docker
docker exec nexus-postgres pg_dump -U nexus_admin nexus_juridico > nexus_juridico_backup_$(date +%Y%m%d).sql

# Crear backup comprimido
docker exec nexus-postgres pg_dump -U nexus_admin nexus_juridico | gzip > nexus_juridico_backup_$(date +%Y%m%d).sql.gz
```

#### **4.2. Importar a Servidor Físico**
```bash
# Copiar backup al servidor
scp nexus_juridico_backup_*.sql.gz usuario@servidor:/home/usuario/backups/

# En el servidor:
gunzip -c nexus_juridico_backup_*.sql.gz | psql -U postgres nexus_juridico
```

#### **4.3. Importar a Supabase**
```bash
# Usar la interfaz web de Supabase
# O usar el CLI de Supabase:
supabase db push
```

### **FASE 5: SINCRONIZACIÓN AUTOMÁTICA**

#### **5.1. Script de Backup Diario**
```bash
#!/bin/bash
# backup-daily.sh

BACKUP_DIR="/home/nexus/backups"
DATE=$(date +%Y%m%d_%H%M%S)
SERVER_IP="ip_del_servidor"
SUPABASE_PROJECT_URL="https://tu-proyecto.supabase.co"
SUPABASE_SERVICE_KEY="tu_service_key"

# Crear backup local
docker exec nexus-postgres pg_dump -U nexus_admin nexus_juridico > "$BACKUP_DIR/nexus_juridico_local_$DATE.sql"

# Sincronizar con servidor físico
rsync -avz "$BACKUP_DIR/nexus_juridico_local_$DATE.sql" usuario@$SERVER_IP:/home/usuario/backups/

# Sincronizar con Supabase
curl -X POST "$SUPABASE_PROJECT_URL/rest/v1/rpc/backup_database" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"backup_name": "nexus_juridico_backup_'$DATE'"}'

# Limpiar backups antiguos (más de 30 días)
find "$BACKUP_DIR" -name "nexus_juridico_local_*.sql" -mtime +30 -delete
```

#### **5.2. Cron Job para Backup Automático**
```bash
# Agregar al crontab
crontab -e

# Ejecutar backup diario a las 2 AM
0 2 * * * /home/nexus/scripts/backup-daily.sh >> /home/nexus/logs/backup.log 2>&1
```

#### **5.3. Sistema de Monitoreo**
```bash
# Verificar estado de backups
ls -la /home/nexus/backups/

# Verificar logs
tail -f /home/nexus/logs/backup.log

# Verificar conexión a servidores
ping -c 4 ip_del_servidor
curl -s https://tu-proyecto.supabase.co/rest/v1/ | head -n 1
```

### **FASE 6: PRUEBAS Y VALIDACIÓN**

#### **6.1. Pruebas de Conectividad**
- [ ] **Servidor físico** accesible desde la red local
- [ ] **Supabase** accesible desde internet
- [ ] **Replicación de datos** funcionando correctamente

#### **6.2. Pruebas de Funcionalidad**
- [ ] **APIs CRUD** funcionando en todos los entornos
- [ ] **Autenticación** operativa en producción
- [ ] **Búsqueda semántica** disponible en todos los entornos

#### **6.3. Pruebas de Rendimiento**
- [ ] **Tiempo de respuesta** aceptable (< 200ms)
- [ ] **Concurrencia** manejada correctamente
- [ ] **Uso de recursos** dentro de límites

### **FASE 7: DOCUMENTACIÓN Y ENTREGA**

#### **7.1. Documentación Técnica**
- [ ] **Guía de instalación** para el servidor físico
- [ ] **Manual de operaciones** diarias
- [ ] **Procedimientos de backup** y recuperación
- [ ] **Guía de troubleshooting** común

#### **7.2. Documentación de Usuario**
- [ ] **Manual del Super Admin** temporal
- [ ] **Guía de migración** para el cliente
- [ ] **Procedimientos de mantenimiento**
- [ ] **Contacto de soporte** y emergencias

#### **7.3. Entrega al Cliente**
- [ ] **Credenciales de acceso** al servidor físico
- [ ] **Documentación completa** entregada
- [ ] **Sesión de capacitación** programada
- [ ] **Soporte post-entrega** definido

---

## 🛠️ **HERRAMIENTAS DE MIGRACIÓN**

### **Herramientas Esenciales**
1. **Docker CLI** - Gestión de contenedores locales
2. **PostgreSQL Client** - Conexión y administración remota
3. **rsync/scp** - Transferencia segura de archivos
4. **curl/wget** - Pruebas de API y conectividad
5. **Supabase CLI** - Gestión del proyecto en la nube

### **Herramientas de Monitoreo**
1. **pgAdmin** - Interfaz gráfica para PostgreSQL
2. **Docker Desktop** - Monitoreo de contenedores
3. **Supabase Dashboard** - Monitoreo en la nube
4. **Logstash/ELK** - Análisis de logs (opcional)
5. **Prometheus/Grafana** - Métricas y dashboards (opcional)

---

## 📊 **CRONOGRAMA ESTIMADO**

| Fase | Actividad | Duración | Responsable |
|------|-----------|----------|-------------|
| 1 | Preparación del entorno de desarrollo | 1 semana | Desarrollador |
| 2 | Configuración del servidor físico | 2 semanas | Infraestructura |
| 3 | Configuración de Supabase | 1 semana | Desarrollador |
| 4 | Migración inicial | 3 días | Desarrollador |
| 5 | Sincronización automática | 1 semana | Infraestructura |
| 6 | Pruebas y validación | 1 semana | QA Team |
| 7 | Documentación y entrega | 3 días | Documentación |

**Total estimado:** 6-7 semanas

---

## 🔒 **CONSIDERACIONES DE SEGURIDAD**

### **Durante la Migración**
- [ ] **Cifrado de backups** en tránsito y en reposo
- [ ] **Autenticación multifactor** para acceso a servidores
- [ ] **Auditoría de acceso** a sistemas críticos
- [ ] **Backup de seguridad** antes de cada migración

### **En Producción**
- [ ] **Firewall** configurado correctamente
- [ ] **SSL/TLS** habilitado para todas las conexiones
- [ ] **Rotación de credenciales** regular
- [ ] **Monitoreo de seguridad** continuo
- [ ] **Backups cifrados** y almacenados en ubicaciones seguras

---

## 🆘 **PROCEDIMIENTOS DE EMERGENCIA**

### **Si falla la migración inicial**
1. **Detener proceso** de migración inmediatamente
2. **Verificar backups** disponibles más recientes
3. **Restaurar desde backup** local
4. **Analizar errores** y corregir
5. **Reintentar migración** con fixes aplicados

### **Si falla la sincronización diaria**
1. **Verificar conectividad** a servidores
2. **Revisar logs** de sincronización
3. **Ejecutar sincronización manual**
4. **Notificar al equipo** de operaciones
5. **Implementar solución** temporal si es necesario

### **Si falla el servidor físico**
1. **Activar servidor de contingencia** (Supabase)
2. **Notificar al cliente** inmediatamente
3. **Iniciar proceso de recuperación**
4. **Restaurar desde backups** en la nube
5. **Reconfigurar servicios** afectados

---

## 📈 **PLAN DE ESCALAMIENTO**

### **Crecimiento de Usuarios**
- **0-50 usuarios**: Infraestructura actual suficiente
- **50-200 usuarios**: Aumentar recursos del servidor
- **200+ usuarios**: Implementar réplicas y balanceo de carga

### **Crecimiento de Datos**
- **0-10GB**: Almacenamiento actual suficiente
- **10-50GB**: Aumentar espacio en disco SSD
- **50GB+**: Implementar particionamiento y archivado

### **Crecimiento de Funcionalidades**
- **Módulo básico**: APIs CRUD actuales
- **Módulo avanzado**: IA y búsqueda semántica
- **Módulo premium**: Integraciones externas

---

## 📚 **REFERENCIAS Y RECURSOS**

### **Documentación Oficial**
- **PostgreSQL:** https://www.postgresql.org/docs/
- **pgvector:** https://github.com/pgvector/pgvector
- **Docker:** https://docs.docker.com/
- **Supabase:** https://supabase.com/docs/

### **Herramientas Recomendadas**
- **DBeaver:** Cliente universal de bases de datos
- **pgAdmin:** Administrador web de PostgreSQL
- **Postman:** Pruebas de APIs REST
- **Docker Desktop:** Gestión de contenedores

### **Comandos Útiles de Migración**
```bash
# Verificar estado de replicación
docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -c "SELECT * FROM pg_stat_replication;"

# Verificar tamaño de base de datos
docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -c "SELECT pg_size_pretty(pg_database_size('nexus_juridico'));"

# Verificar conexiones activas
docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -c "SELECT count(*) FROM pg_stat_activity;"

# Verificar locks
docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -c "SELECT * FROM pg_locks WHERE granted = false;"
```

---

## 🎯 **CONCLUSIÓN**

Este plan de migración proporciona un **enfoque estructurado y seguro** para mover la infraestructura de desarrollo local a producción, manteniendo:

- ** Alta disponibilidad** con redundancia
- **Consistencia de datos** entre entornos
- **Seguridad robusta** en todas las capas
- **Facilidad de mantenimiento** y operación
- **Escalabilidad** para crecimiento futuro

**¡El plan está listo para ejecutarse cuando el servidor físico esté disponible!** 🚀
