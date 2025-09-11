# Plan de implementación del módulo de chat interno con Rocket.Chat

Este documento define el plan técnico para integrar Rocket.Chat como servicio de mensajería interno, embebido en el panel privado, y la estrategia de copias de seguridad diarias de conversaciones en nuestra base de datos local.

## Objetivos
- Proveer chat 1:1, grupos y canales, con envío de texto, emojis, archivos, notas de voz y video/llamadas.
- Integración visual y de acceso dentro del panel privado (/private) con SSO.
- Respaldar diariamente la información crítica de conversaciones en nuestra BD PostgreSQL local.
- Mantener control de seguridad (on‑prem) y cumplimiento de auditoría.

## Alcance (MVP → Iteraciones)
- MVP (semanas 1–2):
  - Despliegue Rocket.Chat on‑prem en servidor propio con TLS.
  - SSO con la app (login transparente desde /private/chat).
  - Embebido inicial vía iframe/página dedicada.
  - Copia diaria de mensajes (metadata) a Postgres local.
  - UI en sidebar: enlace “Chat” con icono.
- Iteración 2 (semanas 3–4):
  - Mapeo "Expediente/Cliente ↔ room" (creación automática, naming convention y permisos).
  - Widget en vistas de Expediente/Cliente para abrir la conversación asociada.
  - Búsqueda cruzada (enviar link de documento/expediente dentro del chat).
- Iteración 3 (semanas 5+):
  - Panel de auditoría de chat (lectura de backups con filtros por fecha/usuario/room).
  - Notificaciones en el panel (unread count) y presencia/typing.

## Arquitectura
- Rocket.Chat (RC): servicio autohospedado (Docker) + DB RC (MongoDB).
- App Next.js (panel privado): SSO + vista embebida/SDK.
- PostgreSQL local (nuestra BD): tablas de respaldo (snapshots) y auditoría.

```
Usuario → Next.js (/private) ──SSO──> Rocket.Chat
                        │                     │
                        └─ Jobs/CRON ← API ───┘  (ETL de mensajes → Postgres)
```

## Infraestructura
- Servidor: Docker + docker-compose para RC (app, Mongo, optional proxy/caddy/nginx).
- Dominio: chat.empresa.tld con TLS.
- Recursos iniciales recomendados:
  - RC app: 2 vCPU / 4–8 GB RAM
  - MongoDB: 2 vCPU / 4–8 GB RAM, SSD
  - Almacenamiento: según retención esperada de archivos/medios.

## Seguridad
- Acceso detrás de HTTPS y firewall.
- SSO (JWT/OAuth/OIDC) con expiración corta y refresh desde la app.
- Roles en RC mínimos: user y admin; mapeo desde is_super_admin.
- Rate limit de APIs públicas y control de CORS.

## SSO (flujo)
1) Usuario ingresa a /private/chat.
2) El backend genera token (JWT/OAuth) para RC con identidad del usuario autenticado.
3) Redirección a RC embebido o auto-login (endpoint RC REST `loginToken` / OIDC).
4) Single logout: al cerrar sesión en la app, invalidar token RC.

## Embebido/UX
- Opción A (rápida): iframe a la UI de RC en /private/chat con navbar oculta y theme ajustado.
- Opción B (custom): construir UI propia en Next.js consumiendo RC REST/WebSocket (Rocket.Chat JS SDK) y mostrar solo vistas necesarias. (se recomienda para Iteración 3+)

## Copias de seguridad en Postgres local
- Estrategia: ETL diario (CRON) que consulta RC API para mensajes del día y almacena snapshots.
- Tablas propuestas:
  - chat_rooms (id_rc, name, type, created_at)
  - chat_users (id_rc, email, name, is_admin)
  - chat_messages (id_rc, room_id_rc, user_id_rc, ts, text, msg_type, file_meta_json)
- ETL (pseudopasos):
  - Obtener rooms paginados: `GET /api/v1/rooms.get`
  - Obtener mensajes por room y fecha: `GET /api/v1/channels.history` / `groups.history` / `im.history`
  - Upsert en Postgres (evitar duplicados por id_rc)
  - Archivos: opcional descargar metadatos y URL (no duplicar binarios si no es necesario)
- Retención: configurable (p. ej. 90 días en RC, indefinido en snapshots internos) según cumplimiento.

## Integración con Expedientes/Clientes
- Naming convention rooms:
  - EXPEDIENTE-<número> o EXP-<id>
  - CLIENTE-<nombre>-<id>
- Hook de creación al crear Expediente/Cliente en la app:
  - Crear room en RC (`groups.create` o `channels.create`)
  - Agregar miembros según permisos/roles
  - Guardar mapeo room_id_rc en nuestra BD para vincular botón “Abrir chat”.

## Tareas
- Infra (1–2 semanas)
  - [ ] Compose RC + Mongo + proxy con TLS
  - [ ] Configurar variables (ROOT_URL, JWT/OAuth, CORS)
  - [ ] Theme básico y ocultar elementos innecesarios para embebido
- App/SSO (3–5 días)
  - [ ] Endpoint backend `/api/chat/rc/login` que genera token y redirige a RC
  - [ ] Vista `/private/chat` con iframe o UI custom base (según estrategia)
  - [ ] Single logout integrado
- Backups/ETL (3–5 días)
  - [ ] Script Node/TS `scripts/rc-backup.js` (o job server) que:
    - autentica con RC (token admin técnico)
    - recorre rooms y mensajes del día
    - hace upsert a Postgres local
  - [ ] Programar CRON diario (Windows Task Scheduler o cron en Linux)
- Integración negocio (1 semana)
  - [ ] Crear room al crear Expediente/Cliente
  - [ ] Botón “Abrir chat” en sus vistas
  - [ ] Permisos: solo miembros del expediente/cliente ven el botón
- Auditoría/reportes (opcional iteración 3+)
  - [ ] Dashboard de búsqueda sobre chat_messages en Postgres
  - [ ] Filtros por usuario, room, rango de fechas, tipo (texto/archivo/voz)

## Riesgos y mitigación
- Doble stack (Mongo + Postgres):
  - Mantener versionado y backups de RC por separado.
- SSO quebrado por cambios de versión:
  - Documentar endpoints y pruebas CI de login SSO.
- Tamaño de archivos/media:
  - Política de límites (MB) y limpieza/archivado.

## Métricas/OKRs del módulo
- % usuarios activos semanales, # mensajes/día, latencia de entrega.
- # rooms por expediente/cliente.
- Tiempo de recuperación (RTO) del backup ETL.

## Enlaces útiles
- Rocket.Chat sitio: https://rocket.chat/
- Docs REST API: https://developer.rocket.chat/reference/api/rest-api
- Rocket.Chat JS SDK: https://github.com/RocketChat/Rocket.Chat.js.SDK
- Ejemplo de Livechat widget: https://rocket.chat/solutions/omnichannel/livechat-widget

---

Última actualización: {{DATE}}

