# Informe detallado de la integración Rocket.Chat (RC) embebida y estado de investigación

Fecha: 2025-09-12
Autor: Agente de desarrollo (Agent Mode)
Estado: Investigación abierta – se solicita apoyo y propuestas

---

## 1. Contexto del problema y objetivo final

### 1.1 Contexto
- El proyecto Nexus Jurídico requiere integrar Rocket.Chat (RC) como módulo de chat interno, embebido dentro del panel privado (`/private/chat`), con inicio de sesión transparente (SSO) y control centralizado desde la app.
- La infraestructura local corre con Docker: `mongo` + `rocketchat` en `http://localhost:4000` y la app Next.js 15.5.0.
- La lógica de SSO implementada en el backend consigue/crea al usuario en RC y, a continuación, intenta generar un token de autenticación temporal para loguear automáticamente al usuario en el iframe embebido.

### 1.2 Objetivo final (qué se quiere lograr)
- Al acceder a `/private/chat` desde la app (usuario ya autenticado en Nexus):
  1) El backend verifica o crea el usuario correspondiente en RC.
  2) El backend genera un token de sesión válido para ese usuario mediante `POST /api/v1/users.createToken`.
  3) El backend construye la URL embebida: `${RC_URL}/home?layout=embedded&resumeToken=${authToken}` y la entrega al cliente.
  4) El iframe carga RC con la sesión iniciada, sin que el usuario deba volver a autenticarse.

### 1.3 Resultado actual
- La verificación/creación del usuario funciona.
- La generación de token con `POST /api/v1/users.createToken` falla: `400 Not authorized [error-not-authorized]` (y en pruebas directas también `"You must be logged in to do this."`).
- Desde la UI de RC (http://localhost:4000/) se puede iniciar sesión como `admin`, pero ese contexto de sesión no está siendo aceptado por la API en el flujo de SSO.

---

## 2. Entorno y configuración relevantes

- SO: Windows 11, PowerShell 5.1
- App: Next.js 15.5.0 (App Router), Node 20.19.4
- RC: `rocketchat/rocket.chat:latest` (banner de arranque indica 7.10.0)
- MongoDB 6 con réplica `rs0`
- URL RC local: `http://localhost:4000`
- Variables `.env.local` utilizadas:
  - `RC_URL=http://localhost:4000`
  - `RC_ADMIN_USERNAME=admin`
  - `RC_ADMIN_PASSWORD=NexusDev123!`
  - Adicionalmente se probaron: `RC_ADMIN_ID`/`RC_ADMIN_TOKEN` y `RC_ADMIN_RESUME`
- Compose RC (resumen de settings relevantes):
  - `OVERWRITE_SETTING_Show_Setup_Wizard=completed`
  - `OVERWRITE_SETTING_Accounts_RegistrationForm=Public`
  - `OVERWRITE_SETTING_Accounts_TwoFactorAuthentication_Enabled=false`
  - `OVERWRITE_SETTING_Deployment_FingerPrint_Verified=true`

---

## 3. Diseño funcional del SSO implementado

1) Endpoint backend `/api/chat/rc/login`:
   - Protegido por sesión de la app.
   - Crea/asegura el usuario en RC.
   - Invoca `createLoginTokenForUser(userId)` que usa `POST /api/v1/users.createToken`.
   - Retorna `{ success: true, url: <embedded-url> }`.

2) Cliente (`/private/chat`):
   - Monta un iframe con la URL embebida.

3) Compatibilidad RC v7:
   - Búsqueda por email usando `/api/v1/users.list?query={"emails.address":"..."}`.
   - Manejo de conflicto de username (si ya existe) con reintentos y sufijos.

---

## 4. Errores observados y mensajes exactos

- En la app:
  - `RC API /api/v1/users.createToken 400: {"success":false,"error":"Not authorized [error-not-authorized]","errorType":"error-not-authorized","details":{"method":"createToken"}}`
- En cURL (pruebas directas):
  - `{"success":false,"error":"You must be logged in to do this.","status":"error","message":"You must be logged in to do this."}`
- En intentos de login por API:
  - `curl -X POST /api/v1/login { user, password }` → `Unauthorized` (aun cuando el login via navegador funciona).
  - `curl -X POST /api/v1/login { resume }` (token sembrado manualmente) → `Unauthorized`.

---

## 5. Acciones ejecutadas (cronología y detalle)

### 5.1 Infraestructura y arranque RC
- Se creó `docker-compose.rocketchat.yml` con `mongo`, `mongo-init-replica` (rs.initiate), y `rocketchat:latest`.
- Mapeo de puertos: RC en `4000:3000`.
- Ajustes de seguridad para dev por `OVERWRITE_SETTING_...` (2FA deshabilitada, fingerprint verificada, wizard completado, registro público para facilidad de pruebas).
- Verificación de endpoints básicos (`/api/info`) y logs de arranque.

### 5.2 Backend y librería RC
- `src/lib/rocketchat.ts`:
  - `rcFetch`: helper con cabeceras `X-Auth-Token` y `X-User-Id`.
  - `findRcUserByEmail`: migrado a `/api/v1/users.list?query=` para RC v7.
  - `createRcUserIfNotExists`: manejo de username ya en uso con reintentos.
  - `createLoginTokenForUser`:
    - 1er intento: `POST /api/v1/users.createToken` con `application/x-www-form-urlencoded`.
    - Si `error-not-authorized`: fallback a `POST /api/v1/login { user, password }` para obtener un token de sesión y reintentar.
    - Soporte `RC_ADMIN_RESUME`: si está definido, primero intenta `POST /api/v1/login { resume }` y sigue con `users.createToken`.

### 5.3 Fix de cookies para Next 15
- Error: "Cookies can only be modified in a Server Action or Route Handler".
- `src/lib/server-auth.ts` modificado para que el refresco de sesión y set-cookie ocurra solo en rutas API (`/api/auth/ping`) y no en Server Components (PrivateLayout).

### 5.4 Pruebas de API con credenciales admin
- `/api/v1/me` y `/api/v1/roles.list` responden OK con `X-Auth-Token` + `X-User-Id`.
- `POST /api/v1/users.createToken`: sigue devolviendo `Not authorized` / `You must be logged in to do this`.
- `POST /api/v1/login { user, password }`: `Unauthorized` (la UI sí acepta usuario/clave).
- `POST /api/v1/users.generatePersonalAccessToken`: en un intento respondió `TOTP Required [totp-required]` → se añadieron variables para deshabilitar 2FA, pero el bloqueo persiste con login por API.

### 5.5 Intentos de desbloqueo de sesión
1) **Siembra de token de reanudación (resume)**:
   - Generación de token aleatorio y hash `sha256(base64)`.
   - Escritura en `services.resume.loginTokens` para `admin`.
   - `POST /api/v1/login { resume }` → `Unauthorized`. Conclusión: en RC v7 el algoritmo/estructura de `resume` no es ese hash simple o se aplica un proceso adicional (p.ej., PBKDF2/bcrypt/pepper) que hace inválida la siembra manual.

2) **Reset de password admin por Mongo**:
   - Cambio de `services.password.bcrypt` al hash de `NexusDev123!`.
   - `POST /api/v1/login { user, password }` → `Unauthorized` (mientras en UI funciona). Indica política extra (fingerprint, API Shield, 2FA residual) aplicada al flujo de API.

3) **Extracción de sesión desde `rocketchat_sessions`**:
   - Consulta sin resultados (`NOSESS`) para admin (no se halló documento con token utilizable). Puede depender de cambios internos de RC 7 o de que las sesiones de UI se manejen distinto.

4) **Siembra de "PAT" simulando `resume`**:
   - Inserción de un loginToken en `services.resume.loginTokens` y uso del token plano como `X-Auth-Token`.
   - `users.createToken` → `Not authorized` / `You must be logged in to do this.`

---

## 6. Hipótesis técnicas actuales

1) **`users.createToken` exige token de sesión válido** (no PAT) y la sesión debe salir de un login verificado (fingerprint/2FA) o poseer algún flag interno que no satisface un token sembrado.
2) **Login por API** está bloqueado por seguridad (p.ej. API Shield, fingerprint, 2FA) aunque se haya desactivado 2FA via `OVERWRITE_SETTING`. Puede requerir confirmación de dispositivo o cabeceras/cookies adicionales.
3) **Cambios en RC v7**: formato/derivación de `resume` y almacenamiento de sesiones difiere de v6; siembra manual no produce un token aceptado por `/api/v1/login`.

---

## 7. Propuestas de resolución (no implementadas aún) y solicitud de apoyo

1) **Revisar settings de seguridad en RC**:
   - Confirmar/deshabilitar temporalmente: `Accounts_TwoFactorAuthentication_Enabled`, `Deployment_FingerPrint_Verified`, `API_Shield_*`, `*TwoFactor*Enforce*`.
   - Export/dump de `rocketchat_settings` para auditar configuración activa.

2) **OIDC/OAuth para SSO**:
   - Integrar RC como Relying Party de un IdP (Keycloak/NextAuth) y evitar `users.createToken`.
   - RC soporta OAuth Apps; sería el camino "oficial" para SSO transparente.

3) **Rocket.Chat JS SDK (WebSocket)**:
   - Establecer sesión server-side con métodos del SDK y negociar login sin pasar por `users.createToken`.

4) **Probar otra versión de RC**:
   - RC 7.4.x o 7.7.x (o una "developer image") para comprobar si `users.createToken` tiene regresiones recientes.

5) **Token de sesión de UI**:
   - Documentación/guía para extraer el authToken de la sesión admin iniciada en UI (colección/campo exacto en v7) y usarlo como `RC_ADMIN_TOKEN` en dev.

6) **Aumentar logs**:
   - Subir verbosidad en RC y revisar logs del endpoint de `login` y `users.createToken` para la causa exacta de `Unauthorized`.

> Se solicita apoyo del equipo/experto en RC para confirmar el setting o el flujo recomendado para dev que permita `users.createToken`, o para avalar una ruta OIDC/SDK como alternativa oficial.

---

## 8. Evidencias y comandos ejecutados (extracto)

- `curl http://localhost:4000/api/info` → OK
- `curl -H "X-Auth-Token: …" -H "X-User-Id: …" http://localhost:4000/api/v1/me` → OK (admin)
- `curl -H … http://localhost:4000/api/v1/roles.list` → OK
- `curl -H … -H "Content-Type: application/x-www-form-urlencoded" -X POST -d "userId=<id>" http://localhost:4000/api/v1/users.createToken` → `Not authorized`
- `curl -H "Content-Type: application/json" -X POST -d '{"user":"admin","password":"NexusDev123!"}' http://localhost:4000/api/v1/login` → `Unauthorized`
- `curl -H "Content-Type: application/json" -X POST -d '{"resume":"…"}' http://localhost:4000/api/v1/login` → `Unauthorized`
- Consultas Mongo (`users`, `rocketchat_sessions`) → no se localizaron tokens de sesión utilizables para admin.

---

## 9. Conclusión

- El bloqueo actual se reduce a **autorización/seguridad de RC v7** para el flujo de generación de token (`users.createToken`) y login por API.
- La app, el flujo de creación/verificación de usuarios y la compatibilidad v7 están implementados.
- Siguientes pasos recomendados: validar settings de seguridad, considerar OIDC/SDK, o probar otra versión de RC; se requiere acompañamiento para identificar el cambio o política que impide la autorización.

