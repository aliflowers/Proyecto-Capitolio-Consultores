// src/lib/rocketchat.ts
import { Logger } from './logger';

// Crear logger específico para el módulo Rocket.Chat
const logger = new Logger({ module: 'rocketchat' });

const RC_URL = process.env.RC_URL || process.env.NEXT_PUBLIC_ROCKETCHAT_URL || '';
const RC_ADMIN_ID = process.env.RC_ADMIN_ID || '';
const RC_ADMIN_TOKEN = process.env.RC_ADMIN_TOKEN || '';
const RC_ADMIN_USERNAME = process.env.RC_ADMIN_USERNAME || '';
const RC_ADMIN_PASSWORD = process.env.RC_ADMIN_PASSWORD || '';

// Cache para el token de sesión
let sessionCache: { userId: string; authToken: string; expiresAt: number } | null = null;

function ensureConfig() {
  if (!RC_URL) {
    logger.fatal('FALTA RC_URL EN VARIABLES DE ENTORNO', undefined, {
      RC_URL: RC_URL ? 'OK' : 'FALTA'
    });
    throw new Error('Rocket.Chat URL no está configurada.');
  }
  
  // Verificar que tengamos alguna forma de autenticación
  const hasToken = RC_ADMIN_ID && RC_ADMIN_TOKEN;
  const hasCredentials = RC_ADMIN_USERNAME && RC_ADMIN_PASSWORD;
  
  if (!hasToken && !hasCredentials) {
    logger.fatal('FALTAN CREDENCIALES DE ROCKET.CHAT', undefined, {
      hasToken,
      hasCredentials
    });
    throw new Error('Necesitas configurar RC_ADMIN_ID/RC_ADMIN_TOKEN o RC_ADMIN_USERNAME/RC_ADMIN_PASSWORD');
  }
}

// Función para obtener token de sesión mediante login
async function getSessionToken(): Promise<{ userId: string; authToken: string }> {
  const sessionLogger = logger.child({ action: 'get-session-token' });
  
  // Si tenemos un token en cache y no ha expirado, usarlo
  if (sessionCache && sessionCache.expiresAt > Date.now()) {
    sessionLogger.debug('Usando token de sesión en cache');
    return { userId: sessionCache.userId, authToken: sessionCache.authToken };
  }
  
  // Si tenemos PAT configurado, usarlo directamente
  if (RC_ADMIN_ID && RC_ADMIN_TOKEN) {
    sessionLogger.debug('Usando Personal Access Token configurado');
    return { userId: RC_ADMIN_ID, authToken: RC_ADMIN_TOKEN };
  }
  
  // Si no, hacer login con usuario/contraseña
  sessionLogger.info('Realizando login con usuario/contraseña');
  
  const loginResponse = await fetch(`${RC_URL}/api/v1/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user: RC_ADMIN_USERNAME,
      password: RC_ADMIN_PASSWORD,
    }),
  });
  
  const loginData = await loginResponse.json();
  
  if (!loginResponse.ok || loginData.status === 'error') {
    sessionLogger.error('Error al hacer login', undefined, {
      error: loginData.error,
      message: loginData.message
    });
    throw new Error(`Login fallido: ${loginData.error || loginData.message}`);
  }
  
  // Guardar en cache por 30 minutos
  sessionCache = {
    userId: loginData.data.userId,
    authToken: loginData.data.authToken,
    expiresAt: Date.now() + (30 * 60 * 1000) // 30 minutos
  };
  
  sessionLogger.info('Login exitoso, token en cache por 30 minutos');
  
  return { userId: loginData.data.userId, authToken: loginData.data.authToken };
}

async function rcFetch(path: string, options: RequestInit = {}) {
  const apiLogger = logger.child({ 
    action: 'api-fetch',
    method: options.method || 'GET',
    path 
  });
  const timer = apiLogger.startTimer(`RC API: ${options.method || 'GET'} ${path}`);
  
  // Asegurarse de que la configuración existe antes de cada llamada
  ensureConfig();
  
  // Obtener token de sesión (usará PAT si está disponible, o hará login)
  const { userId, authToken } = await getSessionToken();
  
  const url = `${RC_URL.replace(/\/$/, '')}${path}`;
  
  const headers = new Headers(options.headers || {});
  headers.set('X-User-Id', userId);
  headers.set('X-Auth-Token', authToken);
  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  apiLogger.debug('Making API request', { url, hasBody: !!options.body });

  const response = await fetch(url, { ...options, headers });

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    apiLogger.error(`API Error ${response.status}`, undefined, {
      status: response.status,
      url,
      error: responseData.error,
      responseData
    });
    timer();
    // Lanzamos un error con un mensaje claro que incluye el tipo de error de RC
    throw new Error(responseData.error || `Error en API de Rocket.Chat: ${response.statusText}`);
  }

  apiLogger.info('API request successful', { 
    status: response.status,
    success: responseData.success 
  });
  timer();
  return responseData;
}

export async function createRcUserIfNotExists(name: string, email: string) {
  const username = email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '');
  const userLogger = logger.child({ 
    action: 'create-user-if-not-exists',
    email,
    username 
  });
  
  userLogger.info('Buscando o creando usuario de RC');

  try {
    // 1. Intentar encontrar al usuario por su username
    const result = await rcFetch(`/api/v1/users.info?username=${username}`);
    if (result.success && result.user) {
      userLogger.info('Usuario encontrado', {
        userId: result.user._id,
        username: result.user.username
      });
      return result.user;
    }
    // Si success es false pero no lanzó error, es un caso raro
    throw new Error('La API de RC no encontró al usuario, pero no devolvió un error estándar.');

  } catch (error: any) {
    // 2. Si el error indica "User not found", procedemos a crearlo
    if (error.message && error.message.toLowerCase().includes('user not found')) {
      userLogger.info('Usuario no encontrado. Creando nuevo usuario');
      const randomPassword = Math.random().toString(36).slice(-12);
      
      const creationResult = await rcFetch('/api/v1/users.create', {
        method: 'POST',
        body: JSON.stringify({
          email,
          name,
          username,
          password: randomPassword,
        }),
      });

      if (creationResult && creationResult.user) {
        userLogger.info('Usuario creado exitosamente', {
          userId: creationResult.user._id,
          username: creationResult.user.username
        });
        return creationResult.user;
      } else {
        userLogger.error('ERROR CRÍTICO: La API de RC no devolvió un usuario al crearlo', undefined, {
          creationResult
        });
        throw new Error('La API de RC no devolvió un usuario al crearlo.');
      }
    }
    
    // 3. Si es cualquier otro tipo de error, es un problema real (ej. credenciales de admin mal configuradas)
    userLogger.error('Error inesperado durante la búsqueda/creación de usuario', error);
    throw error;
  }
}

export async function createLoginTokenForUser(rcUserId: string) {
  const tokenLogger = logger.child({ 
    action: 'create-login-token',
    rcUserId 
  });
  
  tokenLogger.info('Creando token de login para RC user');
  try {
    const data = await rcFetch('/api/v1/users.createToken', {
      method: 'POST',
      body: JSON.stringify({ userId: rcUserId }),
    });

    const token = data?.data?.authToken;
    if (token) {
      tokenLogger.info('Token de login creado exitosamente', {
        hasAuthToken: true,
        hasUserId: !!data?.data?.userId
      });
      return token;
    }
    
    tokenLogger.error('ERROR CRÍTICO: users.createToken respondió sin authToken', undefined, {
      responseData: data
    });
    throw new Error('users.createToken respondió sin authToken');

  } catch (e: any) {
    tokenLogger.error('Falló la creación del token', e);
    throw new Error(`Falló users.createToken: ${e.message}`);
  }
}
