# Guía rápida de configuración SSO por Iframe (REST) para Rocket.Chat

Esta guía resume lo imprescindible para alinear el proyecto con la fuente de verdad: docs/Integración Rocket.Chat en Next.js.md, empleando REST puro (sin SDK) y Autenticación por Iframe.

## 1) Variables de entorno (backend)
Definir solo en servidor (no exponer en cliente):

- RC_URL=http://localhost:4000
- RC_ADMIN_ID=<ID_DEL_ADMIN_EN_RC>
- RC_ADMIN_TOKEN=<PAT_DEL_ADMIN>

Opcional para el cliente (solo URL pública):
- NEXT_PUBLIC_ROCKETCHAT_URL=http://localhost:4000

## 2) Rocket.Chat – Ajustes en la UI de administración
- Administración > Cuentas > Iframe
  - Habilitado: ON
  - URL del Iframe: http://localhost:3000/login (o la URL de login de tu app)
  - URL de la API: http://localhost:3000/api/rc/sso (este endpoint fue creado)
  - Método: POST

- General > API REST
  - Habilitar CORS: ON
  - Orígenes permitidos: http://localhost:3000 (dominio de tu app)

- Seguridad/Contenido (CSP)
  - frame-ancestors: 'self' http://localhost:3000

- General > Site URL
  - Debe coincidir con RC_URL (ej. http://localhost:4000 en local)

- Token de administrador (PAT)
  - Crear un PAT para el usuario admin y tomar el userId + authToken
  - Colocarlos en RC_ADMIN_ID y RC_ADMIN_TOKEN (backend)

## 3) Flujo SSO
- Tu frontend embebe: http://localhost:4000/channel/general?layout=embedded
- Cuando el iframe está listo, Rocket.Chat envía el evento 'ready' (postMessage) y/o solicita a la URL de la API configurada el loginToken.
- Nuestro endpoint POST /api/rc/sso
  - Verifica la sesión de la app
  - Asegura la existencia del usuario en RC
  - Emite un loginToken con /api/v1/users.createToken usando el PAT admin
  - Responde { loginToken }
- El iframe establece la sesión automáticamente.

## 4) Archivos relevantes añadidos/modificados
- src/lib/rocketchat.ts: uso exclusivo de PAT (RC_ADMIN_ID/RC_ADMIN_TOKEN) para todas las llamadas; emisión de loginToken con users.createToken.
- src/app/api/rc/sso/route.ts: endpoint SSO (POST/OPTIONS) con CORS.
- src/components/private/RocketChatIframe.tsx: iframe con postMessage (ready -> login-with-token).
- src/app/private/chat/page.tsx: usa el componente RocketChatIframe.
- docker-compose.rocketchat.yml: versión fijada (7.10.0) de Rocket.Chat.

## 5) Verificación rápida
1. Levanta Rocket.Chat y Mongo (docker-compose.rocketchat.yml)
2. Configura la UI de Rocket.Chat como arriba
3. Exporta RC_ADMIN_ID y RC_ADMIN_TOKEN en tu entorno de Next.js (server)
4. Inicia la app y accede a /private/chat
5. Debes ver la interfaz de RC logueada automáticamente en el iframe

## 6) Notas
- No se exponen credenciales admin en el frontend. El token de sesión del usuario de RC se negocia server-to-server.
- Si users.createToken devolviera 'Not authorized', revisa que el PAT del admin sea válido y tenga permisos.

