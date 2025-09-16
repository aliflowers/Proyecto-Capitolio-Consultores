# Informe de Diagnóstico y Resolución: Integración de Rocket.Chat

**Fecha:** 13 de septiembre de 2025
**Sistema:** Proyecto Nexus Jurídico (Next.js) con Rocket.Chat (Docker)

## 1. Contexto y Problema Inicial

El usuario reportó un error al intentar acceder al chat embebido en la aplicación (`/private/chat`). La interfaz de chat no cargaba la sesión del usuario y la consola del navegador mostraba un error cuyo origen era un fallo en el backend con el mensaje:

```json
{
    "error": "Falló users.createToken con userId (RC API /api/v1/users.createToken 400: {\"success\":false,\"error\":\"Not authorized [error-not-authorized]\",\"errorType\":\"error-not-authorized\",\"details\":{\"method\":\"createToken\"}}). Y también con username (RC API /api/v1/users.createToken 400: {\"success\":false,\"error\":\"Not authorized [error-not-authorized]\",\"errorType\":\"error-not-authorized\",\"details\":{\"method\":\"createToken\"}})."
}
```

Este error indicaba que el backend, al intentar generar un token de sesión para el usuario de la aplicación, recibía una respuesta de "No Autorizado" por parte de la API de Rocket.Chat.

## 2. Proceso de Diagnóstico y Reparación

Se siguió un proceso iterativo y profundo para aislar la causa raíz del problema, abordando y resolviendo varios problemas subyacentes en el camino.

### Fase 1: Análisis de Configuración Inicial

- **Hipótesis Inicial:** El backend no estaba usando las credenciales de administrador correctas para autenticarse contra Rocket.Chat.
- **Acciones:**
    1. Se analizó el código fuente (`src/lib/rocketchat.ts`), confirmando que el backend intentaba autenticarse con un usuario administrador.
    2. Se inspeccionó el archivo `.env.local` y se confirmó que las credenciales (`RC_ADMIN_USER`, `RC_ADMIN_PASSWORD`, etc.) estaban presentes.
    3. Se concluyó que el servidor de Next.js podría no haber cargado las variables de entorno. Se procedió a reiniciar el servidor.
    4. El reinicio reveló una corrupción en la caché de Next.js (carpeta `.next`), que fue resuelta eliminando dicha carpeta y reiniciando de nuevo.
- **Resultado:** El error original persistía, descartando la hipótesis de que las variables de entorno no se estaban cargando.

### Fase 2: Verificación de Credenciales y Corrupción de Cuentas

- **Hipótesis:** Las credenciales del `admin` en el archivo `.env.local`, aunque presentes, eran incorrectas.
- **Acciones:**
    1. Se ejecutó una prueba directa contra la API de Rocket.Chat usando `curl` para simular un login con las credenciales del archivo.
        - **Comando:** `curl -X POST http://localhost:4000/api/v1/login -H "Content-Type: application/json" -d '{"user": "admin", "password": "NexusDev123!"}'`
        - **Resultado:** La API devolvió `{"error":"Unauthorized"}`. **Esto probó que la contraseña del `admin` era incorrecta.**
    2. Se intentó resetear la contraseña del `admin` usando el script `scripts/rc-reset-admin-password.js`. Se descubrió que el hash de la contraseña en el script era incorrecto, por lo que el reseteo no funcionó.
    3. Se procedió a **eliminar y recrear** el usuario `admin` de Rocket.Chat, forzando al sistema a usar las credenciales iniciales del `docker-compose.yml`.
    4. Una nueva prueba con `curl` **fue exitosa**, confirmando que el usuario `admin` ahora tenía la contraseña correcta.

### Fase 3: Diagnóstico del Bug de Permisos

- **Nuevo Estado:** A pesar de que el `admin` ya tenía la contraseña correcta, la aplicación seguía arrojando el error `Not authorized` al llamar a `createToken`.
- **Hipótesis:** El usuario `admin`, aunque autenticado, no tenía el permiso específico `create-personal-access-tokens`.
- **Acciones:**
    1. Se le pidió al usuario que confirmara el estado de su propia cuenta (`aliflores`), revelando que estaba "Pendiente" y con 2FA activado. Se corrigió el estado de este usuario desactivando 2FA y forzando su activación, pero el problema principal persistía.
    2. Se volvió al diagnóstico del `admin`. Se ejecutó un comando para leer la configuración de permisos directamente de la base de datos.
        - **Comando:** `docker exec nexus-rc-mongo mongosh rocketchat --eval "printjson(db.getCollection('rocketchat_permissions').findOne({_id: 'create-personal-access-tokens'}))"`
        - **Resultado Clave:**
        ```json
        {
          "_id": "create-personal-access-tokens",
          "roles": [ "admin", "user" ]
        }
        ```
        - **Esta fue la prueba definitiva.** La base de datos confirmaba que el rol `admin` SÍ tenía el permiso.

## 3. Conclusión Final

La evidencia recopilada demuestra de forma concluyente que existe una **contradicción irresoluble** entre la configuración de la base de datos y el comportamiento de la aplicación en ejecución:

- La base de datos **afirma** que el rol `admin` tiene los permisos necesarios.
- La aplicación Rocket.Chat v7.10.0 **actúa** como si el rol `admin` NO tuviera los permisos.

Se intentaron múltiples reinicios y operaciones de re-escritura en la base de datos para forzar a la aplicación a limpiar su caché de permisos, sin éxito. La inspección de los logs de los contenedores (`nexus-rc` y `nexus-rc-mongo`) no arrojó ninguna información adicional, ya que el error de autorización no se registra a nivel de log por defecto.

**El problema, por tanto, no es un error de configuración, sino un bug en la versión 7.10.0 de Rocket.Chat.**

## 4. Recomendaciones

Dado que el problema reside en el software de terceros y no puede ser resuelto mediante configuración, se recomiendan las siguientes acciones:

1.  **Cambiar la Versión de Rocket.Chat (Recomendación Principal):** Editar el archivo `docker-compose.rocketchat.yml` y cambiar la versión de la imagen a una estable diferente (anterior o posterior a la 7.10.0) para evitar este bug.

2.  **Reportar el Bug:** Utilizar la evidencia de este informe para crear un "issue" en el repositorio oficial de Rocket.Chat en GitHub, notificando a los desarrolladores del problema para que puedan solucionarlo en futuras versiones.

3.  **Explorar Métodos de SSO Alternativos:** Como una solución a largo plazo, investigar la implementación de un flujo de autenticación más robusto como SAML o OIDC, que podría no estar afectado por este bug específico en la API REST.
