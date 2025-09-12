- docs: agregar guía de configuración SSO por Iframe (REST) y describir cambios
- backend: endpoint POST /api/rc/sso para devolver { loginToken } y CORS para Iframe Auth
- backend: endurecer src/lib/rocketchat.ts para usar solo PAT admin (RC_ADMIN_ID/RC_ADMIN_TOKEN)
- frontend: nuevo componente RocketChatIframe con handshake postMessage (ready -> login-with-token)
- frontend: /private/chat ahora usa RocketChatIframe
- infra: fijar imagen de Rocket.Chat a 7.10.0 en docker-compose.rocketchat.yml
- deprecate: GET /api/chat/rc/login (410 Gone)

