# Informe técnico Rocket.Chat — 2025-09-18

Este informe presenta un análisis exhaustivo del espacio de trabajo con énfasis en:
- Panel administrativo privado (/private/admin/*)
- Integración con Rocket.Chat (embed, login automático y configuración)

Notas iniciales y alcance
- Este análisis se fundamenta en el código fuente, migraciones SQL, documentación y archivos de configuración presentes en el repositorio.
- El archivo .env.local existe (según indicación del usuario) en: C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores\.env.local. No ha sido leído en este informe.
- No se ejecutaron contenedores ni endpoints; las conclusiones operativas (p. ej., compatibilidad de tokens con parámetros de URL) se limitan a lo verificable en código y docs.


1) Evaluación general del proyecto

Arquitectura resumida
- Framework full‑stack: Next.js 15 (App Router) + React 19 + TypeScript
- API interna: Rutas en src/app/api/**/* con helpers de auth/autorization
- Persistencia: PostgreSQL mediante driver pg; migraciones SQL en /migrations
- Módulo Rocket.Chat: integración vía iframe (en dos enfoques: simple sin SSO y autologin por REST)
- Infra local: docker-compose para Postgres y docker-compose.rocketchat.yml para Rocket.Chat + Mongo (replica set)

Tecnologías confirmadas
```json path=\?\C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores\package.json start=46
"next": "15.5.0",
"react": "19.1.0",
"react-dom": "19.1.0",
```
```json path=\?\C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores\package.json start=50
"pino": "^9.9.5",
"pino-pretty": "^13.1.1",
"tailwindcss": "^3.4.1",
```
```ts path=\?\C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores\next.config.ts start=3
const nextConfig: NextConfig = {
  /* Sin rewrites: cargaremos Rocket.Chat directamente en http://localhost:4000 */
};
```

Persistencia y utilidades DB
```ts path=\?\C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores\src\lib\db.ts start=7
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
...
export async function withUserRLS<T>(userId: string, fn: (client: DBClient) => Promise<T>): Promise<T> {
```

Autenticación y autorización
- Sesiones: cookie httpOnly + tabla sessions; idle timeout 5 minutos (rolling)
```ts path=\?\C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores\src\lib\server-auth.ts start=6
const SESSION_IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos
...
export async function protectApiRoute(): Promise<NextResponse | { user: User }> {
  const user = await getCurrentUser(true);
  if (!user) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
```
- RBAC/Permisos granulares: roles y user_permissions con utilitarios
```ts path=\?\C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores\src\lib\authorization.ts start=34
export async function userHasRole(userId: string, roleName: string): Promise<boolean> { ... }
export async function userHasPermission(userId: string, resource: string, action: string): Promise<boolean> { ... }
```
- Middleware HTTP (Edge): logging y headers correlativos
```ts path=\?\C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores\src\middleware.ts start=45
export function middleware(request: NextRequest) {
  // logs y headers X-Request-Id / X-Response-Time
```

Limitaciones explícitas
- No se validaron valores efectivos de variables de entorno ni comportamiento en runtime.
- El archivo .env.local existe (ruta arriba) pero no se leyó su contenido para este informe.


2) Sitio de administradores (/private/admin/*)

Gating y navegación
- Gating SSR en /private y /private/admin (is_super_admin)
```tsx path=\?\C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores\src\app\private\layout.tsx start=16
const user = await getCurrentUser();
if (!user) { redirect('/login'); }
```
```tsx path=\?\C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores\src\app\private\admin\layout.tsx start=11
const user = await getCurrentUser();
if (!user || !user.is_super_admin) { redirect('/private'); }
```

Funcionalidades administrativas
- Roles y permisos (/private/admin/roles): creación/edición, clonado de roles del sistema, eliminación de roles custom. Endpoints: /api/roles
- Usuarios (/private/admin/users): listado, asignación de roles, permisos individuales, crear/editar/eliminar, forzar logout, bloquear/habilitar, compartir recursos. Endpoints: /api/crud/usuarios, /api/user-permissions, /api/admin/users/*, /api/admin/shares
- Auditoría (/private/admin/audit): estadísticas y logs. Endpoints: /api/admin/audit/stats, /api/admin/audit/logs

Seguridad en API
```ts path=\?\C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores\src\app\api\user-permissions\route.ts start=8
const authResult = await protectApiRoute(); // 401 si no hay sesión
...
if (!user.is_super_admin) {
  const superAdminMiddleware = await withSuperAdmin();
  const superAdminCheck = await superAdminMiddleware(request);
  if (superAdminCheck instanceof NextResponse) return superAdminCheck; // 403
}
```

Hallazgos
- Existe una página en /admin/rocket-chat (fuera de /private). Aunque las APIs validan permisos, la UI debería residir bajo /private/admin para coherencia y gating SSR.
```tsx path=\?\C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores\src\app\admin\rocket-chat\page.tsx start=1
'use client';
// No hay verificación SSR en esta ruta; protección recae en las APIs que invoca
```
- Inconsistencia de capa de datos: algunos handlers de admin RC usan un supuesto cliente Prisma (db.user.findMany) importado desde '@/lib/db', pero lib/db.ts no exporta Prisma ni existe @prisma/client en package.json. Esto es código legacy y fallará si se ejecuta.
```ts path=\?\C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores\src\app\api\admin\rocketchat\users\route.ts start=14
const adminUser = await db.user.findUnique({
  where: { id: user.id },
  select: { isSuperAdmin: true }
});
```


3) Sistema de chat Rocket.Chat

Infraestructura local
```yaml path=\?\C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores\docker-compose.rocketchat.yml start=24
environment:
  - PORT=3000
  - ROOT_URL=http://localhost:4000
  - OVERWRITE_SETTING_Site_Url=http://localhost:4000
  - MONGO_URL=mongodb://mongo:27017/rocketchat?replicaSet=rs0
  - OVERWRITE_SETTING_Accounts_Iframe_Enabled=false
  - OVERWRITE_SETTING_Accounts_Iframe_api_url=
  - OVERWRITE_SETTING_Accounts_Iframe_url=
  - OVERWRITE_SETTING_Accounts_TwoFactorAuthentication_Enabled=false
  - ADMIN_USERNAME=admin
  - ADMIN_PASS=NexusDev123!
```
- RC corre en http://localhost:4000 (sin TLS, solo dev). El Iframe Auth/SSO está deshabilitado por configuración sobreescrita.

Estrategias de integración en el repo

A) Integración simplificada (sin SSO)
```tsx path=\?\C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores\src\components\private\RocketChatDirect.tsx start=9
export default function RocketChatDirect() {
  const rcUrl = process.env.NEXT_PUBLIC_ROCKETCHAT_URL || 'http://localhost:4000';
  return (
    <iframe src={rcUrl} title="Rocket.Chat" className="w-full h-full border-0" allow="camera; microphone; fullscreen; display-capture; clipboard-write" />
  );
}
```
- Documentada en docs/INTEGRACION_ROCKETCHAT_SIMPLIFICADA.md

B) Autologin mediante credenciales cifradas guardadas
- Almacén de credenciales cifradas por usuario (AES‑256‑GCM) + rutas de API para guardar/leer
```ts path=\?\C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores\src\app\api\rocketchat\credentials\route.ts start=8
const ENCRYPTION_KEY = process.env.RC_CREDENTIALS_KEY || '';
function validateKey() { return /^[0-9a-fA-F]{64}$/.test(ENCRYPTION_KEY); }
...
await query(`INSERT INTO user_rocketchat_credentials (...) ON CONFLICT (user_id) DO UPDATE ...`)
```
- Login contra RC por el servidor usando credenciales cifradas y respuesta al cliente con authToken
```ts path=\?\C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores\src\app\api\rocketchat\login\route.ts start=68
const res = await fetch(`${RC_URL.replace(/\/$/, '')}/api/v1/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user: creds.username, password: creds.password }),
});
if (res.ok && data?.data?.authToken) {
  return NextResponse.json({ success: true, authToken: data.data.authToken, userId: data.data.userId });
}
```
- Cliente que intenta autologin y, en éxito, embebe iframe con parámetro resumeToken=authToken
```tsx path=\?\C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores\src\components\private\RocketChatAuto.tsx start=42
const res = await fetch('/api/rocketchat/login', { method: 'GET' });
...
if (res.ok && data?.authToken) {
  setStatus({ state: "ready", iframeSrc: `${rcBaseUrl}/home?resumeToken=${data.authToken}` });
}
```
Observación importante: en Rocket.Chat el parámetro resumeToken suele asociarse a un loginToken emitido por users.createToken. En el repo hay evidencia de que users.createToken falló (RC v7) con "Not authorized"; por ello se usa authToken. No puedo verificar si RC v7 acepta authToken en ?resumeToken. Si no lo acepta, este autologin no funcionará universalmente.

C) Flujo SSO/PAT experimental (en código, no empleado por la ruta de login arriba)
- createSSOTokenForUser: fuerza contraseñas “estables”, hace login y devuelve authToken (cacheado)
```ts path=\?\C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores\src\lib\rocketchat.ts start=291
const stablePassword = `RC_${username}_${process.env.RC_ADMIN_PASSWORD || 'DefaultPass123!'}`;
await rcFetch('/api/v1/users.update', { method: 'POST', body: JSON.stringify({ userId, data: { password: stablePassword, requirePasswordChange: false, verified: true } })});
const loginResponse = await fetch(`${RC_URL}/api/v1/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: username, password: stablePassword }) });
```
Advertencia: este enfoque altera contraseñas de usuarios en RC a partir de un secreto administrativo. Debe quedar deshabilitado si no está explícitamente aprobado.

Backups de chat (modelo de tablas)
```sql path=\?\C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores\migrations\0016_chat_backups.sql start=6
CREATE TABLE IF NOT EXISTS chat_rooms (...);
CREATE TABLE IF NOT EXISTS chat_users (...);
CREATE TABLE IF NOT EXISTS chat_messages (...);
```


4) Fortalezas y áreas de mejora

Fortalezas
- Documentación amplia: guías de setup, diagnóstico de problemas y planes de integración (por ejemplo, SETUP_RocketChat_SSO_REST.md, RC_CHAT_INTEGRATION_ISSUE_REPORT_DETAILED.md, PLAN_CHAT_ROCKETCHAT.md)
- Protección coherente en API: protectApiRoute + withSuperAdmin (401/403)
- RBAC claro y utilitarios de autorización reutilizables
- Auditoría con UI dedicada y endpoints
- Cifrado de credenciales con AES‑256‑GCM y validación obligatoria de la clave en la ruta activa
- Estrategias de resiliencia en el cliente RC (rcFetch con backoff y cache de tokens)

Áreas de mejora
- Capa de datos inconsistente: uso de supuestos métodos Prisma (db.user.findMany, db.$executeRaw) sin Prisma instalado ni exportado
- Ruta UI fuera de /private: /admin/rocket-chat carece de gating SSR; mover a /private/admin/rocket-chat
- Ambigüedad “resumeToken”: el autologin usa authToken y no un loginToken; compatibilidad dependiente de versión/config de RC
- Flujo SSO experimental con forzado de contraseñas: alto riesgo; aislar o eliminar
- CSP/frame-ancestors: no se definen en next.config.ts; puede delegarse a RC pero conviene establecer política de lado app/proxy
- Variables sensibles en compose dev (ADMIN_PASS): aislar de producción
- UX de sesión: 5 minutos de inactividad puede ser corto para panel y chat
- Rate limit/CSRF en /api/rocketchat/*: no se observó integración explícita del rate limiter en estas rutas


5) Recomendaciones técnicas (priorizadas)

Alta prioridad
1) Unificar capa de datos
   - Migrar handlers admin RC a usar lib/db.ts (pg) o reintroducir Prisma de forma oficial, pero evitar mezcla.
   - Afecta: src/app/api/admin/rocketchat/**/*, src/lib/rocketchat-admin-server.ts
2) Consolidar UI admin bajo /private
   - Mover /app/admin/rocket-chat/page.tsx → /app/private/admin/rocket-chat/page.tsx, usar AdminLayout
3) Alinear autologin con semántica RC
   - Si se busca SSO real: evaluar OAuth/OIDC oficial de RC
   - Si se mantiene credenciales cifradas: validar si ?resumeToken exige loginToken; si no es soportado, evitar este parámetro y/o ofrecer login nativo controlado
4) Endurecer gestión de secretos
   - Validación de RC_CREDENTIALS_KEY (64 hex) en arranque (además del endpoint). Eliminar rutas que cifren con claves efímeras
5) Seguridad del iframe
   - Definir CSP y frame-ancestors en app/proxy y/o consolidar settings en RC. Usar HTTPS fuera de local

Media prioridad
- Retirar/aislar createSSOTokenForUser con feature flag
- Rate limit y auditoría específicos en /api/rocketchat/*; evaluar CSRF si se usan desde navegador
- Ajustar idle timeout (p. ej., 30–60 min rolling) según políticas
- Asegurar programación de backups y revisar índices de tablas de snapshot

Baja prioridad
- Headers de seguridad en next.config.ts (o proxy)
- Tests de integración (login feliz, cambio de contraseña requerido, RC caído, 429)


Limitaciones finales
- No se probaron endpoints ni ejecución de contenedores.
- No se inspeccionó el contenido de .env.local (confirmado que existe) ni se asumieron valores productivos.


Anexo — Evidencias adicionales (extractos clave)
```ts path=\?\C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores\src\components\private\RocketChatAuto.tsx start=60
// Guardar credenciales y autologin
const ok = await saveRocketChatCredentials(form.username, form.password, true);
...
const res = await fetch('/api/rocketchat/login', { method: 'GET' });
```
```ts path=\?\C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores\migrations\0017_rocketchat_credentials.sql start=6
CREATE TABLE IF NOT EXISTS user_rocketchat_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  encrypted_credentials TEXT NOT NULL,
  password_changed_at TIMESTAMPTZ,
  ...
);
```
```ts path=\?\C:\Users\jesus\OneDrive\Escritorio\PTOYECTOS WEB\capitolio-consultores\src\app\api\rocketchat\login\route.ts start=31
// Validación de clave y sesión, lectura de credenciales cifradas y login REST a RC
```
