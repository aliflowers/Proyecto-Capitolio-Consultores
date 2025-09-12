

# **Guía de Implementación Exhaustiva: Integración de un Servicio Autoalojado de Rocket.Chat en una Aplicación Node.js y Next.js**

## **Introducción: Validación de la Integración y Consideraciones Arquitectónicas Fundamentales**

La integración de una plataforma de comunicación robusta como Rocket.Chat dentro de una aplicación web personalizada es un proyecto totalmente factible y representa un caso de uso común y bien soportado por la plataforma, especialmente a través de sus capacidades de chat embebido e integración mediante iframe. Este informe proporciona una guía detallada y detallada para implementar e integrar Rocket.Chat en una arquitectura compuesta por un backend de Node.js, un frontend de Next.js y una base de datos PostgreSQL existente, todo ello destinado a un servidor privado.

### **El Imperativo de MongoDB: Un Prerrequisito Crítico**

Antes de proceder, es fundamental abordar una consideración arquitectónica clave. La consulta especifica el uso de una base de datos PostgreSQL. Sin embargo, **Rocket.Chat depende arquitectónicamente y de forma exclusiva de MongoDB** para todo el almacenamiento de datos, lo que incluye mensajes, información de usuarios y configuraciones del sistema.2

Esta dependencia no impide la integración. La aplicación principal puede y debe continuar utilizando su contenedor PostgreSQL existente sin ninguna modificación. La solución consiste en introducir un servicio de base de datos MongoDB dedicado que se ejecutará junto a la pila tecnológica actual, sirviendo exclusivamente a la instancia de Rocket.Chat. La documentación oficial especifica claramente MongoDB como el núcleo de su arquitectura de datos y detalla las versiones compatibles para cada lanzamiento de Rocket.Chat, un factor crucial para garantizar la estabilidad.2

### **La Estrategia de Integración en Tres Pilares**

La integración se logrará a través de tres componentes interconectados que forman la estructura de esta guía:

1. **Despliegue Autoalojado con Docker Compose:** Se aprovechará el entorno Docker existente para desplegar Rocket.Chat y su dependencia de MongoDB de forma contenida, escalable y gestionable.6  
2. **Autenticación IframeImpulsada por el Backend:** Se construirá un puente de Single Sign-On (SSO) en el backend de Node.js. Este se encargará de la autenticación de los usuarios de forma transparente, de modo que los usuarios que inicien sesión en la aplicación principal queden automáticamente autenticados en Rocket.Chat sin necesidad de credenciales separadas.9  
3. **Integración en el Frontend con Next.js:** Se utilizará un elemento \<iframe\> dentro de un componente dedicado de Next.js para renderizar la interfaz de usuario de Rocket.Chat directamente dentro del módulo de chat de la aplicación, proporcionando una experiencia de usuario unificada.12

---

## **Parte 1: Despliegue de la Infraestructura de Rocket.Chat con Docker Compose**

La metodología de despliegue más robusta y recomendada para el autoalojamiento es el uso de las imágenes oficiales de Docker proporcionadas por Rocket.Chat.5 Este enfoque garantiza un entorno consistente, aísla las dependencias externas y simplifica la gestión de versiones de componentes subyacentes como Node.js.14

### **1.1. Visión General de la Arquitectura del Despliegue**

El despliegue se orquestará mediante Docker Compose, definiendo los siguientes servicios:

* **rocketchat**: El contenedor principal que ejecuta el servidor de la aplicación Rocket.Chat.  
* **mongo**: La instancia de la base de datos MongoDB.  
* **traefik** (Opcional pero recomendado): Un proxy inverso que gestionará el enrutamiento de red y simplificará la obtención de certificados SSL/TLS, una práctica recomendada en la documentación oficial para entornos de producción.6

### **1.2. Creación del docker-compose.yml para la Coexistencia**

A continuación, se presenta un archivo docker-compose.yml completo y listo para producción, diseñado para coexistir con la pila de aplicaciones existente. Este archivo debe crearse en un directorio dedicado en el servidor.

YAML

version: '3.8'

services:  
  mongo:  
    image: bitnami/mongodb:6.0  
    container\_name: rocketchat\_mongo  
    restart: unless-stopped  
    volumes:  
      \- mongo\_data:/bitnami/mongodb  
    environment:  
      \- MONGODB\_REPLICA\_SET\_MODE=primary  
      \- MONGODB\_REPLICA\_SET\_NAME=rs0  
      \- MONGODB\_ROOT\_PASSWORD=${MONGODB\_ROOT\_PASSWORD}  
      \- MONGODB\_DATABASE=rocketchat  
    networks:  
      \- app-network

  rocketchat:  
    image: registry.rocket.chat/rocketchat/rocket.chat:${RELEASE}  
    container\_name: rocketchat\_server  
    restart: unless-stopped  
    command: \>  
      bash \-c "  
        for i in \`seq 1 30\`; do  
          mongo \--host mongo \--eval 'rs.status()' \> /dev/null 2\>&1 && break;  
          echo 'Waiting for MongoDB replica set...';  
          sleep 2;  
        done;  
        echo 'MongoDB is ready. Starting Rocket.Chat...';  
        node main.js;  
      "  
    depends\_on:  
      \- mongo  
    ports:  
      \- "3000:3000"  
    environment:  
      \- ROOT\_URL=${ROOT\_URL}  
      \- MONGO\_URL=mongodb://mongo:27017/rocketchat?replicaSet=rs0  
      \- MONGO\_OPLOG\_URL=mongodb://mongo:27017/local?replicaSet=rs0  
      \- PORT=3000  
    networks:  
      \- app-network

volumes:  
  mongo\_data:

networks:  
  app-network:  
    driver: bridge

Un aspecto fundamental de esta configuración es el uso de un **conjunto de réplicas (replica set) de MongoDB**. Esto no es solo una recomendación para alta disponibilidad; es un requisito funcional para habilitar el oplog (registro de operaciones) de MongoDB. El oplog es esencial para la capa de reactividad en tiempo real de Rocket.Chat, y su ausencia puede llevar a una degradación significativa del rendimiento y a problemas de consistencia de datos.2 La configuración

MONGO\_OPLOG\_URL depende directamente de esta arquitectura de conjunto de réplicas.

### **1.3. Configuración del Entorno (archivo .env)**

En el mismo directorio que el archivo docker-compose.yml, cree un archivo llamado .env para almacenar las variables de configuración. Este enfoque separa la configuración del código, mejorando la seguridad y la portabilidad.8

A continuación se presenta una tabla que consolida los parámetros de configuración críticos. Este formato centralizado previene errores comunes al explicar claramente el propósito y el formato requerido para cada variable.

**Tabla 1: Variables de Entorno Esenciales para docker-compose**

| Variable | Servicio | Descripción | Valor de Ejemplo |
| :---- | :---- | :---- | :---- |
| RELEASE | rocketchat | Especifica la versión exacta de Rocket.Chat a desplegar. Se desaconseja el uso de latest en producción para garantizar la estabilidad.8 | 6.5.2 |
| ROOT\_URL | rocketchat | La URL pública absoluta de la instancia de Rocket.Chat. Es **crítico** para que todas las funcionalidades, incluyendo la autenticación y las notificaciones, operen correctamente. | http://localhost:3000 (desarrollo), https://chat.sudominio.com (producción) |
| MONGODB\_ROOT\_PASSWORD | mongo | La contraseña raíz para la instancia de MongoDB. Debe ser segura. | una\_contraseña\_muy\_segura |

### **1.4. Inicialización y Verificación de los Servicios**

Con los archivos docker-compose.yml y .env en su lugar, ejecute los siguientes comandos en la terminal desde ese directorio:

1. **Iniciar los servicios en segundo plano:**  
   Bash  
   docker compose up \-d

   Este comando descargará las imágenes necesarias y creará e iniciará los contenedores mongo y rocketchat.8  
2. Iniciar el conjunto de réplicas de MongoDB (ejecutar solo una vez):  
   Espere unos 30 segundos para que el servicio mongo se inicie por completo y luego ejecute el siguiente comando para configurar el conjunto de réplicas:  
   Bash  
   docker compose exec mongo mongosh \--eval "rs.initiate({ \_id: 'rs0', members: \[{ \_id: 0, host: 'localhost:27017' }\] })"

3. Monitorear los registros de inicio:  
   Para verificar que Rocket.Chat se inicia correctamente y se conecta a la base de datos, puede seguir los registros en tiempo real:  
   Bash  
   docker compose logs \-f rocketchat

Una vez que los registros indiquen que el servidor se ha iniciado, navegue a la ROOT\_URL configurada (por ejemplo, http://localhost:3000) en un navegador web. Se le presentará el asistente de configuración inicial, donde deberá crear la primera cuenta de administrador.8

---

## **Parte 2: Configuración de Rocket.Chat para una Integración Iframe Transparente**

Una vez que la instancia de Rocket.Chat esté en funcionamiento y se haya accedido con la cuenta de administrador, es necesario configurar varios ajustes para permitir la integración segura y funcional del iframe. Es importante notar que estos ajustes se encuentran en diferentes secciones del panel de administración, pero deben ser configurados de manera cohesiva para que la integración funcione.

### **2.1. Habilitación de la Autenticación Iframe (La Puerta de Enlace SSO)**

Esta configuración es el núcleo del mecanismo de Single Sign-On.

1. Navegue a Administración \> Área de trabajo \> Configuración \> Cuentas \> Iframe.9  
2. Active la opción **Habilitado**.  
3. **URL del Iframe:** Esta es la URL de la página de inicio de sesión de su propia aplicación (la aplicación Next.js). Rocket.Chat redirigirá a esta URL si no puede autenticar al usuario a través de la API. Ejemplo: https://app.sudominio.com/login.  
4. **URL de la API:** Este es el ajuste más crítico. Debe apuntar al endpoint de SSO que se creará en el backend de Node.js. Ejemplo: https://api.sudominio.com/api/v1/sso/rocketchat.  
5. **Método de la API:** Seleccione POST, ya que es el método estándar esperado para el flujo de autenticación.9

### **2.2. Seguridad del Iframe y Endpoints de la API**

Estos ajustes protegen la instancia contra ataques como el clickjacking.

1. Navegue a Administración \> Área de trabajo \> Configuración \> General.9  
2. Busque la sección **Seguridad del Iframe**.  
3. **Restringir el acceso dentro de cualquier Iframe:** Durante el desarrollo local, esta opción puede desactivarse. Sin embargo, en producción, debe estar **activada** por seguridad.  
4. **Opciones para X-Frame-Options:** Cuando la restricción está activada, establezca este valor en ALLOW-FROM https://app.sudominio.com. Esto indica al navegador que solo permita que su aplicación Next.js incruste la interfaz de Rocket.Chat.13

### **2.3. Configuración del Intercambio de Recursos de Origen Cruzado (CORS)**

Esta configuración es esencial para permitir que el backend de Node.js se comunique con la API REST de Rocket.Chat.

1. Navegue a Administración \> Configuración \> General \> API REST.19  
2. Active la opción **Habilitar CORS**.  
3. **Orígenes permitidos para CORS:** Ingrese el dominio de su backend de Node.js. Ejemplo: https://api.sudominio.com.

### **2.4. Habilitación de la Comunicación con el Iframe (API postMessage)**

Estos ajustes permiten la comunicación bidireccional entre la aplicación Next.js (padre) y el iframe de Rocket.Chat (hijo).

1. Navegue a Administración \> Configuración \> General \> Integración de Iframe.9  
2. Active **Habilitar recepción**. Esto permite que la aplicación Next.js envíe comandos *hacia* el iframe.  
3. **Orígenes de recepción:** Ingrese el dominio de su frontend de Next.js. Ejemplo: https://app.sudominio.com.  
4. Active **Habilitar envío**. Esto permite que el iframe de Rocket.Chat envíe eventos *hacia* la aplicación Next.js.  
5. **Origen de destino del envío:** Ingrese nuevamente el dominio de su frontend de Next.js.

---

## **Parte 3: Construcción del Puente SSO: El Endpoint de Autenticación en Node.js**

El corazón de la experiencia de usuario transparente reside en un endpoint de API en el backend de Node.js que gestiona la autenticación entre la aplicación principal y Rocket.Chat.

### **3.1. El Flujo de Autenticación Iframe Explicado en Detalle**

El proceso de SSO se desarrolla de la siguiente manera 9:

1. Un usuario autenticado en la aplicación Next.js navega al módulo de chat.  
2. El frontend renderiza el componente iframe, cuya fuente apunta a la ROOT\_URL de Rocket.Chat.  
3. Rocket.Chat se carga dentro del iframe y detecta que la autenticación Iframe está habilitada.  
4. Automáticamente, el servidor de Rocket.Chat envía una solicitud POST a la **URL de la API** configurada en la Parte 2 (por ejemplo, https://api.sudominio.com/api/v1/sso/rocketchat).  
5. El endpoint de Node.js recibe esta solicitud. Su primera tarea es verificar la sesión del usuario en la aplicación principal (por ejemplo, a través de un token JWT o una cookie de sesión). Si el usuario no está autenticado, el endpoint debe responder con un estado 401 Unauthorized.  
6. Si el usuario está autenticado, el backend utiliza la API REST de Rocket.Chat para buscar un usuario que coincida (por ejemplo, por nombre de usuario o correo electrónico).  
7. Si el usuario no existe en Rocket.Chat, el backend lo crea utilizando la API.  
8. A continuación, el backend inicia sesión en nombre del usuario a través de la API para obtener un authToken.  
9. Finalmente, el endpoint de Node.js responde a la solicitud original de Rocket.Chat con un objeto JSON que contiene el token: $${"\\\\{"} "loginToken": "EL\_AUTH\_TOKEN\_OBTENIDO" ${"\\\\}"}.  
10. Rocket.Chat recibe este loginToken, establece la sesión del usuario dentro del iframe y la interfaz de chat se vuelve completamente funcional.

### **3.2. Interacción con la API REST de Rocket.Chat desde Node.js**

Para interactuar con la API de Rocket.Chat, se recomienda utilizar el SDK oficial para JavaScript, @rocket.chat/sdk, por su simplicidad y robustez.21

Instale el SDK en su proyecto de Node.js:

Bash

npm install @rocket.chat/sdk

Para realizar operaciones de gestión de usuarios (como crear cuentas), se necesita una instancia del SDK autenticada con un usuario administrador. Es una buena práctica crear un usuario "bot" o "service" en Rocket.Chat con permisos de administrador para este propósito.

### **3.3. Implementación: El Código del Endpoint /sso**

A continuación se muestra un ejemplo completo y comentado de una ruta de Express.js que implementa la lógica de SSO.

JavaScript

import express from 'express';  
import crypto from 'crypto';  
import { api } from '@rocket.chat/sdk';

const router \= express.Router();

// Middleware para verificar la sesión del usuario en la aplicación principal.  
// Este es un marcador de posición y debe ser reemplazado con su lógica de autenticación real.  
const verifyMainAppSession \= (req, res, next) \=\> {  
  // Ejemplo: verificar un token JWT en la cabecera de autorización.  
  const token \= req.headers.authorization?.split(' ');  
  if (\!token) {  
    return res.sendStatus(401);  
  }  
  // Lógica para validar el token y adjuntar los datos del usuario a \`req\`.  
  // Si es válido:  
  req.mainAppUser \= {  
    username: 'usuario.ejemplo', // Debe ser único  
    name: 'Usuario de Ejemplo',  
    email: 'usuario.ejemplo@sudominio.com',  
  };  
  next();  
  // Si no es válido:  
  // return res.sendStatus(401);  
};

router.post('/sso/rocketchat', verifyMainAppSession, async (req, res) \=\> {  
  try {  
    const { username, name, email } \= req.mainAppUser;

    // Configurar la conexión del SDK con credenciales de administrador  
    await api.connect({ host: process.env.ROCKETCHAT\_URL });  
    await api.login({  
      user: process.env.ROCKETCHAT\_ADMIN\_USER,  
      password: process.env.ROCKETCHAT\_ADMIN\_PASSWORD,  
    });

    // 1\. Buscar al usuario en Rocket.Chat  
    let rcUserResult;  
    try {  
      rcUserResult \= await api.get('users.info', { username });  
    } catch (e) {  
      // El SDK puede lanzar un error si el usuario no se encuentra  
      rcUserResult \= null;  
    }

    // 2\. Si el usuario no existe, crearlo  
    if (\!rcUserResult ||\!rcUserResult.user) {  
      const password \= crypto.randomBytes(16).toString('hex');  
      await api.post('users.register', {  
        name,  
        email,  
        username,  
        pass: password,  
      }); // \[22\]  
    }

    // 3\. Crear un token de inicio de sesión para el usuario (como administrador)  
    const tokenResult \= await api.post('users.createToken', { username });  
    if (tokenResult && tokenResult.data && tokenResult.data.authToken) {  
      const { authToken } \= tokenResult.data;  
        
      // 4\. Devolver el loginToken a Rocket.Chat  
      res.json({ loginToken: authToken }); // \[9\]  
    } else {  
      throw new Error('No se pudo crear el token de inicio de sesión para el usuario.');  
    }

    await api.logout();  
  } catch (error) {  
    console.error('Error en el flujo de SSO de Rocket.Chat:', error);  
    res.sendStatus(500);  
  }  
});

export default router;

Un desafío clave en este flujo es la gestión de contraseñas. La API users.register requiere una contraseña 22, pero en un sistema SSO, el usuario no debe conocer ni utilizar esta contraseña. El enfoque robusto, implementado anteriormente, evita este problema por completo:

1. El backend genera una contraseña aleatoria y segura para la creación inicial de la cuenta.  
2. En lugar de intentar iniciar sesión con esa contraseña, utiliza sus privilegios de administrador para invocar el endpoint users.createToken, que genera un authToken para el usuario especificado sin necesidad de su contraseña. Este patrón es más seguro y fiable.

---

## **Parte 4: Integración en el Frontend: Embebiendo Rocket.Chat en Next.js**

La última pieza del rompecabezas es renderizar y controlar la interfaz de Rocket.Chat dentro de la aplicación Next.js.

### **4.1. Creación del Componente React ChatModule**

A continuación se muestra un componente de Next.js que renderiza el iframe y gestiona la comunicación.

JavaScript

// components/ChatModule.js  
import React, { useRef, useEffect } from 'react';

const ChatModule \= ({ channel \= 'general' }) \=\> {  
  const iframeRef \= useRef(null);  
  const rocketChatUrl \= process.env.NEXT\_PUBLIC\_ROCKETCHAT\_URL;

  // Construir la URL de origen para el iframe  
  const iframeSrc \= \`${rocketChatUrl}/channel/${channel}?layout=embedded\`;

  // Ejemplo de cómo enviar un comando al iframe  
  const setUserStatusToAway \= () \=\> {  
    if (iframeRef.current && iframeRef.current.contentWindow) {  
      iframeRef.current.contentWindow.postMessage(  
        {  
          externalCommand: 'set-user-status',  
          status: 'away',  
        },  
        rocketChatUrl // Usar la URL específica como destino por seguridad  
      );  
    }  
  };

  return (  
    \<div style\={{ height: '100%', width: '100%' }}\>  
      \<iframe  
        ref\={iframeRef}  
        src\={iframeSrc}  
        title\="Rocket.Chat"  
        style\={{ width: '100%', height: '100%', border: 'none' }}  
      /\>  
    \</div\>  
  );  
};

export default ChatModule;

El parámetro de URL ?layout=embedded es fundamental, ya que instruye a Rocket.Chat para que renderice una vista simplificada, ocultando la barra lateral de canales y la barra de navegación superior, lo que resulta en una interfaz ideal para ser embebida.12

### **4.2. Comunicación del Host al Iframe con postMessage**

La API postMessage es el puente seguro para la comunicación entre la ventana padre de Next.js y el iframe hijo de Rocket.Chat.9 Permite que la aplicación principal controle dinámicamente la experiencia del chat.

**Tabla 2: Comandos postMessage Clave para el Control del Iframe**

| Comando | Valor de externalCommand | Parámetros | Descripción y Ejemplo |
| :---- | :---- | :---- | :---- |
| Navegar a Canal | go | path: string | Cambia programáticamente el canal o la vista dentro del iframe. Esencial para enlazar a conversaciones específicas desde la aplicación principal. iframeRef.current.contentWindow.postMessage({ externalCommand: 'go', path: '/direct/nombre.usuario' }, rocketChatUrl).13 |
| Establecer Estado de Usuario | set-user-status | status: string | Cambia el estado de presencia del usuario (ej. 'online', 'away', 'busy'). iframeRef.current.contentWindow.postMessage({ externalCommand: 'set-user-status', status: 'away' }, rocketChatUrl).23 |
| Cerrar Sesión | logout | Ninguno | Cierra la sesión del usuario de Rocket.Chat dentro del iframe. iframeRef.current.contentWindow.postMessage({ externalCommand: 'logout' }, rocketChatUrl).23 |

### **4.3. Integración Avanzada: Solución al Problema del "Botón Atrás" en SPAs**

Un problema común y no obvio al integrar iframes en aplicaciones de una sola página (SPA) como las de Next.js es la "contaminación" del historial del navegador. La navegación interna del iframe (cambiar de canal, abrir ajustes) añade entradas al historial, lo que provoca que el botón "atrás" del navegador quede "atrapado" dentro del iframe en lugar de navegar a la página anterior de la aplicación principal.25

La solución más efectiva implica modificar cómo se carga el iframe 25:

1. **Renderizar un iframe vacío inicialmente:** En lugar de establecer el src directamente en el JSX, renderice el iframe sin él.  
2. **Usar location.replace() en un useEffect:** Una vez que el componente se monta, use una referencia para acceder a la ventana del iframe y establezca su ubicación con iframeRef.current.contentWindow.location.replace(iframeSrc). El método replace() carga la URL sin crear una nueva entrada en el historial del navegador, resolviendo el problema de la carga inicial.

### **4.4. Personalización de la Interfaz y Tematización**

Para alinear la apariencia visual del chat embebido con la marca de la aplicación principal, Rocket.Chat permite la inyección de CSS personalizado.

1. Navegue a Administración \> Área de trabajo \> Configuración \> Disposición \> CSS personalizado.26  
2. En este campo, se puede introducir código CSS que anule los estilos predeterminados. Rocket.Chat utiliza variables CSS para su tematización, lo que facilita la personalización de colores.

Ejemplo de CSS para cambiar los colores primarios de los botones:

CSS

:root {  
  \--rcx-color\-button\-background\-primary-default: \#5C34A2; /\* Su color de marca \*/  
  \--rcx-color\-button\-background\-primary-hover: \#4A2A82;  
  \--rcx-color\-button\-background\-primary-press: \#3E236A;  
}

Este enfoque permite una personalización visual significativa sin necesidad de bifurcar o modificar el código base de Rocket.Chat.26

---

## **Parte 5: Despliegue en Producción en un Servidor Privado**

La transición del entorno de desarrollo local a un servidor de producción requiere configurar la capa de red y la seguridad.

### **5.1. Preparación del Servidor Privado**

Los prerrequisitos para la máquina anfitriona son:

* Docker y Docker Compose instalados.8  
* Un nombre de dominio (ej. sudominio.com) con registros DNS apuntando a la IP pública del servidor (un registro A para app.sudominio.com y otro para chat.sudominio.com).  
* El cortafuegos del servidor debe permitir el tráfico entrante en los puertos 80 (HTTP) y 443 (HTTPS).

### **5.2. Configuración del Proxy Inverso con Nginx**

Un proxy inverso es esencial para gestionar el tráfico entrante y dirigirlo al contenedor correcto basándose en el subdominio. También gestionará la terminación SSL.

A continuación se muestra un archivo de configuración de Nginx (/etc/nginx/sites-available/sudominio.conf):

Nginx

\# Redirigir todo el tráfico HTTP a HTTPS  
server {  
    listen 80;  
    server\_name app.sudominio.com chat.sudominio.com;  
    return 301 https://$host$request\_uri;  
}

\# Servidor para la aplicación Next.js  
server {  
    listen 443 ssl;  
    server\_name app.sudominio.com;

    \# Rutas a los certificados SSL (gestionados por Certbot)  
    ssl\_certificate /etc/letsencrypt/live/app.sudominio.com/fullchain.pem;  
    ssl\_certificate\_key /etc/letsencrypt/live/app.sudominio.com/privkey.pem;

    location / {  
        proxy\_pass http://localhost:3001; \# Asumiendo que Next.js corre en el puerto 3001  
        proxy\_set\_header Host $host;  
        proxy\_set\_header X-Real-IP $remote\_addr;  
        proxy\_set\_header X-Forwarded-For $proxy\_add\_x\_forwarded\_for;  
        proxy\_set\_header X-Forwarded-Proto $scheme;  
    }  
}

\# Servidor para Rocket.Chat  
server {  
    listen 443 ssl;  
    server\_name chat.sudominio.com;

    \# Rutas a los certificados SSL  
    ssl\_certificate /etc/letsencrypt/live/chat.sudominio.com/fullchain.pem;  
    ssl\_certificate\_key /etc/letsencrypt/live/chat.sudominio.com/privkey.pem;

    location / {  
        proxy\_pass http://localhost:3000; \# Apunta al puerto expuesto por Docker Compose  
        proxy\_http\_version 1.1;  
          
        \# Cabeceras críticas para el soporte de WebSocket  
        proxy\_set\_header Upgrade $http\_upgrade;  
        proxy\_set\_header Connection "upgrade";  
          
        proxy\_set\_header Host $host;  
        proxy\_set\_header X-Real-IP $remote\_addr;  
        proxy\_set\_header X-Forwarded-For $proxy\_add\_x\_forwarded\_for;  
        proxy\_set\_header X-Forwarded-Proto $scheme;  
        proxy\_set\_header X-Forwarded-Host $host;  
        proxy\_set\_header X-Forwarded-Port 443;  
    }  
}

Las cabeceras Upgrade y Connection "upgrade" son **absolutamente cruciales**. Rocket.Chat depende de WebSockets para su comunicación en tiempo real.2 Sin estas cabeceras, el proxy inverso no gestionará correctamente la conexión WebSocket, lo que resultará en un chat que carga pero no se actualiza en tiempo real.16

### **5.3. Aseguramiento de la Instalación con SSL/TLS**

Se recomienda encarecidamente el uso de Certbot para obtener y renovar automáticamente certificados SSL gratuitos de Let's Encrypt.

1. Instale Certbot y su plugin para Nginx:  
   Bash  
   sudo apt update  
   sudo apt install certbot python3-certbot-nginx

2. Ejecute Certbot para obtener los certificados y configurar Nginx automáticamente:  
   Bash  
   sudo certbot \--nginx

   Certbot detectará los server\_name en su configuración y le guiará a través del proceso.  
3. Finalmente, actualice la variable ROOT\_URL en su archivo .env de producción para que utilice https:  
   ROOT\_URL=https://chat.sudominio.com

### **5.4. Persistencia de Datos y Mantenimiento**

* **Copias de Seguridad:** Aunque los datos de MongoDB se almacenan en un volumen de Docker persistente, las copias de seguridad regulares son vitales. Se puede crear una copia de seguridad de la base de datos con el siguiente comando:  
  Bash  
  docker compose exec mongo mongodump \--archive \--db=rocketchat \-u root \-p 'SU\_CONTRASEÑA\_MONGO' \> rocketchat\_backup\_$(date \+%F).archive

  Este comando ejecuta mongodump dentro del contenedor y redirige la salida a un archivo en el host.6  
* **Actualizaciones:** Para actualizar la instancia de Rocket.Chat a una nueva versión:  
  1. Modifique la variable RELEASE en su archivo .env a la nueva versión deseada.  
  2. Descargue la nueva imagen: docker compose pull rocketchat.  
  3. Vuelva a crear el contenedor: docker compose up \-d \--force-recreate rocketchat.

Antes de actualizar, es imperativo consultar las notas de la versión de Rocket.Chat para cualquier cambio importante o requisitos de actualización de la versión de MongoDB.5

## **Conclusiones**

La integración de un servicio de chat autoalojado de Rocket.Chat en una aplicación web basada en Node.js y Next.js es un proceso estructurado que, si bien es complejo, ofrece un control total sobre los datos y la experiencia del usuario. La viabilidad del proyecto está confirmada, con la salvedad fundamental de que se debe incorporar una instancia de MongoDB, ya que PostgreSQL no es compatible.

La estrategia de implementación exitosa se basa en tres pilares clave: un despliegue robusto y correctamente configurado mediante Docker Compose, con especial atención a la configuración del conjunto de réplicas de MongoDB; un puente de autenticación SSO seguro y eficiente construido en el backend de Node.js para sincronizar usuarios de forma transparente; y una integración cuidadosa en el frontend de Next.js que no solo embebe la interfaz, sino que también gestiona la comunicación y resuelve problemas comunes de la experiencia del usuario, como la navegación del historial del navegador.

Siguiendo los pasos detallados en esta guía, desde la configuración inicial de la infraestructura hasta el despliegue final en producción con un proxy inverso y seguridad SSL, los equipos de desarrollo pueden añadir una potente funcionalidad de comunicación en tiempo real a sus aplicaciones, manteniendo la soberanía de los datos y una experiencia de usuario cohesiva y profesional.

#### **Fuentes citadas**

1. Architecture and Components \- Rocket.Chat Developer, acceso: septiembre 12, 2025, [https://developer.rocket.chat/docs/architecture-and-components](https://developer.rocket.chat/docs/architecture-and-components)  
2. System Requirements \- Rocket-Chat Documentation, acceso: septiembre 12, 2025, [https://docs.rocket.chat/docs/system-requirements](https://docs.rocket.chat/docs/system-requirements)  
3. Open source chat app server \- Need help\! : r/nextjs \- Reddit, acceso: septiembre 12, 2025, [https://www.reddit.com/r/nextjs/comments/1h6p23a/open\_source\_chat\_app\_server\_need\_help/](https://www.reddit.com/r/nextjs/comments/1h6p23a/open_source_chat_app_server_need_help/)  
4. Support Prerequisites \- Rocket-Chat Documentation, acceso: septiembre 12, 2025, [https://docs.rocket.chat/docs/support-prerequisites](https://docs.rocket.chat/docs/support-prerequisites)  
5. Deploy with Docker & Docker Compose \- Rocket-Chat Documentation, acceso: septiembre 12, 2025, [https://docs.rocket.chat/docs/deploy-with-docker-docker-compose](https://docs.rocket.chat/docs/deploy-with-docker-docker-compose)  
6. Deploy Rocket.Chat, acceso: septiembre 12, 2025, [https://docs.rocket.chat/docs/deploy-rocketchat](https://docs.rocket.chat/docs/deploy-rocketchat)  
7. How to Install Rocket.Chat with Docker \- Self-hosted Slack Alternative \- SSD Nodes, acceso: septiembre 12, 2025, [https://www.ssdnodes.com/blog/tutorial-rocket-chat-docker/](https://www.ssdnodes.com/blog/tutorial-rocket-chat-docker/)  
8. Adding a Rocket.Chat chat room to your web app, acceso: septiembre 12, 2025, [https://developer.rocket.chat/docs/adding-a-rocketchat-chat-room-to-your-web-app](https://developer.rocket.chat/docs/adding-a-rocketchat-chat-room-to-your-web-app)  
9. Iframe Integration \- Rocket.Chat Developer, acceso: septiembre 12, 2025, [https://developer.rocket.chat/docs/customize-and-embed-iframe-integration](https://developer.rocket.chat/docs/customize-and-embed-iframe-integration)  
10. Configuring Iframe Authentication \- Rocket.Chat Developer, acceso: septiembre 12, 2025, [https://developer.rocket.chat/docs/configuring-iframe-auth](https://developer.rocket.chat/docs/configuring-iframe-auth)  
11. Embedded Layout \- Rocket.Chat Developer, acceso: septiembre 12, 2025, [https://developer.rocket.chat/docs/embedded-layout](https://developer.rocket.chat/docs/embedded-layout)  
12. Tutorial: Adding a Chat Room to your Webapp \- Rocket.Chat, acceso: septiembre 12, 2025, [https://www.rocket.chat/blog/adding-a-chat-room-to-your-webapp](https://www.rocket.chat/blog/adding-a-chat-room-to-your-webapp)  
13. Check Node.js Version \- Rocket-Chat Documentation, acceso: septiembre 12, 2025, [https://docs.rocket.chat/docs/check-nodejs-version](https://docs.rocket.chat/docs/check-nodejs-version)  
14. Deploy Rocket.Chat SIX in five minutes, acceso: septiembre 12, 2025, [https://www.rocket.chat/blog/deploy-rocket-chat-six](https://www.rocket.chat/blog/deploy-rocket-chat-six)  
15. How To Integrate Rocket chat with the Social media website \- Agileblaze, acceso: septiembre 12, 2025, [https://agileblaze.com/how-to-integrate-rocket-chat-with-the-social-media-website/](https://agileblaze.com/how-to-integrate-rocket-chat-with-the-social-media-website/)  
16. Rocket.Chat Air-Gapped Deployment with Docker, acceso: septiembre 12, 2025, [https://docs.rocket.chat/docs/rocketchat-air-gapped-deployment](https://docs.rocket.chat/docs/rocketchat-air-gapped-deployment)  
17. RocketChat Made Easy \- ScottiByte's Discussion Forum, acceso: septiembre 12, 2025, [https://discussion.scottibyte.com/t/rocketchat-made-easy/511](https://discussion.scottibyte.com/t/rocketchat-made-easy/511)  
18. General Settings \- Rocket-Chat Documentation, acceso: septiembre 12, 2025, [https://docs.rocket.chat/docs/general](https://docs.rocket.chat/docs/general)  
19. RocketChat/EmbeddedChat: An easy to use full-stack component (ReactJS) embedding Rocket.Chat into your webapp \- GitHub, acceso: septiembre 12, 2025, [https://github.com/RocketChat/EmbeddedChat](https://github.com/RocketChat/EmbeddedChat)  
20. RocketChat/Rocket.Chat.js.SDK: Utility for apps and bots to interact with Rocket.Chat via DDP and/or API \- GitHub, acceso: septiembre 12, 2025, [https://github.com/RocketChat/Rocket.Chat.js.SDK](https://github.com/RocketChat/Rocket.Chat.js.SDK)  
21. Register User \- Rocket.Chat Developer, acceso: septiembre 12, 2025, [https://developer.rocket.chat/apidocs/register-user](https://developer.rocket.chat/apidocs/register-user)  
22. Iframe integration: Sending commands \- Rocket.Chat Developer, acceso: septiembre 12, 2025, [https://developer.rocket.chat/docs/iframe-integration-sending-commands](https://developer.rocket.chat/docs/iframe-integration-sending-commands)  
23. Rocket.Chat Documentation \- Iframe integration: Sending commands, acceso: septiembre 12, 2025, [https://martinschoeler.github.io/docs/developer-guides/iframe-integration/commands/](https://martinschoeler.github.io/docs/developer-guides/iframe-integration/commands/)  
24. Rocket chat iframe integration. Browser's navigation issue \- Stack Overflow, acceso: septiembre 12, 2025, [https://stackoverflow.com/questions/49853671/rocket-chat-iframe-integration-browsers-navigation-issue](https://stackoverflow.com/questions/49853671/rocket-chat-iframe-integration-browsers-navigation-issue)  
25. Customize Workspace Layout \- Rocket-Chat Documentation, acceso: septiembre 12, 2025, [https://docs.rocket.chat/docs/layout](https://docs.rocket.chat/docs/layout)  
26. Rocket.Chat | endoflife.date, acceso: septiembre 12, 2025, [https://endoflife.date/rocket-chat](https://endoflife.date/rocket-chat)