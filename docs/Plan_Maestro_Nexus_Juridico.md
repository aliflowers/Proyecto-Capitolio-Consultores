# **Plan Maestro de Desarrollo e Implementación: Nexus Jurídico**

**Fecha:** 28 de agosto de 2025  
**Preparado por:** Jesús Cova, Arquitecto de Software

---

## **Historial de Cambios e Implementaciones**

### **Actualización del 28 de agosto de 2025**

**Implementación de Infraestructura Local Completada:**

1. **✅ Contenedor Docker PostgreSQL 17.4 Configurado:**
   - PostgreSQL 17.4 con extensión pgvector instalada
   - Autenticación MD5 configurada para compatibilidad
   - Volúmenes persistentes para datos (`nexus-postgres-data`)
   - Puerto 5432 mapeado correctamente

2. **✅ Base de Datos Local Funcional:**
   - **Tablas Creadas:** 10 tablas principales (users, profiles, documentos, casos, clientes, document_chunks, casos_clientes, casos_documentos, storage_buckets, storage_objects)
   - **Extensiones Habilitadas:** pgvector, uuid-ossp, pgcrypto
   - **Datos Iniciales:** Usuario admin y perfiles de prueba
   - **Conexión Node.js:** Funcionando correctamente con pool de conexiones

3. **✅ Código de Aplicación Adaptado:**
   - **Librería de Conexión:** `src/lib/db.js` configurada para entorno local
   - **Variables de Entorno:** `.env.development` con credenciales correctas
   - **Scripts de Prueba:** Verificados y funcionando
   - **Compatibilidad:** Mantenida con estructura de Supabase

4. **✅ Pruebas de Conexión Completadas:**
   - **Conexión a base de datos:** Establecida correctamente
   - **Consultas básicas:** SELECT, COUNT funcionando
   - **Operaciones CRUD:** INSERT, DELETE verificadas
   - **Funciones del sistema:** current_user, current_database()
   - **Pool de conexiones:** Configurado y funcionando

5. **✅ Documentación Técnica Completa:**
   - **README.md:** Guía de inicio rápido y uso
   - **Documentacion_Tecnica_Local.md:** Detalles técnicos de infraestructura
   - **Plan Maestro Actualizado:** Historial de cambios e implementaciones

**Plan de Migración Definido:**

1. **Para Desarrollo Local:**
   - Mantener contenedor activo: `docker-compose up -d`
   - Verificar conexión: `node src/lib/final-test.js`
   - Desarrollar normalmente: La conexión está lista para uso

2. **Para Migración a Producción (Servidor Físico):**
   - Exportar esquema: `docker exec nexus-postgres pg_dump -U nexus_admin nexus_juridico > backup.sql`
   - Configurar servidor físico: Instalar PostgreSQL 17.4 + pgvector
   - Importar datos: `psql -U postgres nexus_juridico < backup.sql`

3. **Para Sincronización con Supabase:**
   - Crear proyecto en Supabase
   - Aplicar migraciones: Subir scripts SQL a Supabase
   - Configurar variables de entorno: Para entorno de producción

### **Actualización del 28 de agosto de 2025 - Fase 2 Completada:**

**✅ APIs CRUD Básicas Implementadas:**
- **Casos:** Endpoints GET, POST, PUT, DELETE funcionales
- **Clientes:** Endpoints GET, POST, PUT, DELETE funcionales
- **Documentos:** Endpoints GET, POST, PUT, DELETE funcionales
- **Validación de datos:** Robusta y consistente en todos los endpoints
- **Manejo de errores:** Mejorado con mensajes específicos
- **Protección de rutas:** Middleware de autenticación aplicado

**Documentación Actualizada:**
- **RESUMEN_FASE_2_COMPLETADA.md:** Detalles de implementación
- **TODO_FASE_2.md:** Lista de tareas completadas
- **Plan_Maestro_Nexus_Juridico.md:** Historial actualizado

---

## **1. Visión General y Propósito Estratégico**

Este documento detalla el plan de desarrollo integral para **Nexus Jurídico**, una plataforma web diseñada exclusivamente para **Capitolio Consultores**. El objetivo es consolidar la presencia digital y la gestión operativa del despacho en un ecosistema unificado, seguro e inteligente.

La plataforma se erige sobre dos pilares sinérgicos:

1.  **Sitio Web Público de Vanguardia:** La carta de presentación digital de Capitolio Consultores, diseñada para atraer clientes, comunicar experticia y establecer autoridad en el sector legal.
2.  **Plataforma Privada de Práctica Legal:** El motor operativo interno, accesible solo para personal autorizado, que automatizará tareas, potenciará la investigación y centralizará la gestión de casos mediante Inteligencia Artificial.

El resultado será una firma legal que proyecta modernidad y confianza, operando con una eficiencia y precisión sin precedentes.

---

## **2. Arquitectura y Stack Tecnológico**

Se construirá una aplicación web monolítica con una clara separación de módulos y un stack tecnológico moderno orientado a la eficiencia, seguridad y escalabilidad.

### **2.1. Arquitectura General**

*   **Módulo Público (Frontend Principal):** Accesible a cualquier visitante. Su función es informativa y de marketing.
*   **Módulo Privado (Área de Miembros):** Aplicación segura que requiere autenticación para acceder a las herramientas de gestión y la IA.

### **2.2. Stack Tecnológico Detallado**

*   **Frontend (Público y Privado):**
    *   **Framework:** **Next.js (React)** para un SEO óptimo (SSR/SSG) y una experiencia de aplicación rica.
    *   **Lenguaje:** **TypeScript** para un código robusto y mantenible.
    *   **Estilos:** **Tailwind CSS** para un desarrollo de UI rápido y consistente.
    *   **Componentes UI:** **Shadcn/ui** para un control total sobre componentes accesibles y personalizables.
*   **Backend:**
    *   **Framework:** **Next.js (API Routes)** para unificar el stack y simplificar la arquitectura y el despliegue.
*   **Base de Datos:**
    *   **Plataforma:** **Supabase**, que proporciona:
        *   Base de datos **PostgreSQL** con la extensión **pgvector** para búsqueda semántica.
        *   **Autenticación** y gestión de usuarios (con RLS).
        *   **Almacenamiento (Storage)** seguro para documentos.
*   **Inteligencia Artificial (IA):**
    *   **Modelo de Lenguaje (LLM):** **API de Google AI Platform (Gemini)** para razonamiento avanzado.
    *   **Modelo de Embeddings:** **Google text-embedding-ada-002** o similar para la vectorización de texto.
*   **Despliegue y Operaciones (DevOps):**
    *   **Plataforma:** **Vercel** para una integración y despliegue continuo perfectos con Next.js.
    *   **Control de Versiones:** **Git & GitHub** como estándar de la industria.

### **2.3. Estructura del Proyecto**

```
CAPITOLIO-CONSULTORES/
├── .vscode/
├── node_modules/
├── public/                  # Archivos estáticos (imágenes, logos)
├── src/
│   ├── app/                 # Rutas de la aplicación (App Router)
│   │   ├── (public)/        # Grupo de rutas públicas
│   │   │   ├── page.tsx     # Inicio
│   │   │   └── ...etc
│   │   ├── (private)/       # Grupo de rutas privadas
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   └── ...etc
│   │   ├── api/             # Endpoints del Backend
│   │   │   ├── auth/
│   │   │   ├── upload/
│   │   │   └── chat/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx       # Layout raíz
│   ├── components/          # Componentes de React reutilizables
│   │   ├── ui/              # Componentes de Shadcn
│   │   ├── public/
│   │   └── private/
│   ├── lib/                 # Lógica auxiliar
│   │   ├── supabase.ts
│   │   ├── ai.ts
│   │   └── utils.ts
│   └── styles/
│       └── globals.css
├── .env.local
├── .gitignore
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## **3. Hoja de Ruta: Desarrollo e Implementación por Fases**

### **Fase 1: Cimientos y Presencia Digital (Meses 1-3)**

**Objetivo:** Lanzar el sitio web público y establecer la infraestructura básica de la plataforma privada.

**Entregables Clave:**
1.  **Sitio Web Público Funcional:**
    *   Página de Inicio
    *   Áreas de Práctica
    *   Quienes Somos (La Firma y Equipo)
    *   Centro de Conocimiento (Blog)
    *   Página de Contacto
2.  **Infraestructura de la Plataforma Privada:**
    *   Sistema de Autenticación (Inicio de Sesión, "Olvidé mi contraseña").
    *   Gestión de Usuarios (Roles: Administrador, Abogado).
    *   Panel de Administración para asignar permisos a módulos.
3.  **MVP del Gestor Documental:**
    *   Funcionalidad para cargar y visualizar documentos (PDF, Word).

**Tareas Técnicas:**
*   Configurar el proyecto Next.js con TypeScript y Tailwind CSS.
*   Inicializar el proyecto en Supabase (Base de datos, Auth, Storage).
*   Desarrollar los componentes de UI con Shadcn/ui.
*   Construir las páginas estáticas del sitio público.
*   Implementar las rutas de API para la autenticación con Supabase Auth.
*   Crear las tablas de `users` y `profiles` con roles en PostgreSQL.
*   Desarrollar la interfaz de carga de archivos conectada a Supabase Storage.
*   Configurar el despliegue continuo en Vercel.

### **Fase 2: El Núcleo Inteligente (Meses 4-6)**

**Objetivo:** Implementar las funcionalidades centrales de gestión de casos y la búsqueda inteligente.

**Entregables Clave:**
1.  **Gestor Documental Inteligente (Completo):**
    *   Extracción automática de entidades (nombres, fechas, etc.) de documentos cargados.
    *   Búsqueda Semántica Universal (RAG) para consultar la base documental en lenguaje natural.
2.  **Módulo de Gestión de Casos y Clientes:**
    *   Creación de "Expedientes Digitales".
    *   Asociación de clientes, contrapartes y documentos a cada caso.
    *   Línea de tiempo cronológica de actuaciones.
    *   Gestión de tareas y plazos por caso.

**Tareas Técnicas:**
*   Integrar la API de Google AI (Gemini) para el procesamiento de documentos.
*   Configurar la extensión `pgvector` en Supabase.
*   Crear un pipeline de datos:
    1.  El documento se sube a Storage.
    2.  Un trigger o función serverless lo procesa.
    3.  El texto se divide en trozos (chunks).
    4.  Se generan embeddings para cada chunk usando la API de Google.
    5.  Los embeddings se almacenan en la tabla de PostgreSQL.
*   Diseñar e implementar el esquema de la base de datos para casos, clientes, documentos y tareas.
*   Construir la interfaz de búsqueda que convierte la pregunta del usuario en un embedding y realiza una consulta de similitud en `pgvector`.
*   Desarrollar las interfaces para crear y gestionar los expedientes digitales.

### **Fase 3: Capacidades Avanzadas (Meses 7-8)**

**Objetivo:** Lanzar las herramientas de IA más sofisticadas y preparar la plataforma para su uso general.

**Entregables Clave:**
1.  **Asistente de Investigación Jurídica:**
    *   Interfaz de chat para realizar consultas sobre legislación y jurisprudencia.
    *   Respuestas de la IA con citación de fuentes.
2.  **Dashboard Principal Personalizado:**
    *   Vista general con plazos, tareas y actividad reciente.
3.  **Pruebas y Capacitación:**
    *   Pruebas exhaustivas de extremo a extremo con el equipo de Capitolio Consultores.
    *   Sesiones de capacitación para todos los usuarios.

**Tareas Técnicas:**
*   Desarrollar la ruta de API `/api/chat` que orqueste la lógica del asistente.
*   Implementar un sistema de RAG específico para la base de conocimiento legal (que podría requerir una carga inicial de documentos legales).
*   Construir la interfaz de chat en el frontend.
*   Desarrollar las consultas a la base de datos para poblar el Dashboard Principal.
*   Realizar pruebas de carga, seguridad y usabilidad.
*   Crear documentación de usuario y material de capacitación.

### **Fase 4: Operación y Evolución (Continuo)**

**Objetivo:** Garantizar el funcionamiento óptimo de la plataforma y su mejora continua.

**Entregables Clave:**
*   Soporte técnico continuo.
*   Mantenimiento y actualizaciones de seguridad.
*   Desarrollo de nuevas funcionalidades basadas en el feedback de la firma.

**Tareas Técnicas:**
*   Establecer un sistema de monitoreo y logging.
*   Planificar ciclos de mantenimiento para actualizar dependencias.
*   Crear un canal de comunicación para recibir feedback y solicitudes de nuevas características.
*   Evaluar y priorizar el backlog de desarrollo futuro.
