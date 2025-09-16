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

// Configuración de reintentos
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 segundo
  maxDelay: 10000, // 10 segundos
  backoffMultiplier: 2
};

// Helper para sleep
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

async function rcFetch(path: string, options: RequestInit = {}, retryCount = 0): Promise<any> {
  const apiLogger = logger.child({ 
    action: 'api-fetch',
    method: options.method || 'GET',
    path,
    retryCount 
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

  try {
    const response = await fetch(url, { ...options, headers });
    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Manejar errores específicos
      const error = responseData.error || response.statusText;
      
      // Si es un error de rate limiting, esperar y reintentar
      if (response.status === 429 || error.includes('too many requests')) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        const waitTime = Math.min(retryAfter * 1000, RETRY_CONFIG.maxDelay);
        
        if (retryCount < RETRY_CONFIG.maxRetries) {
          apiLogger.warn(`Rate limited, esperando ${waitTime}ms antes de reintentar...`, {
            retryCount,
            waitTime
          });
          timer();
          await sleep(waitTime);
          return rcFetch(path, options, retryCount + 1);
        }
      }
      
      // Si es un error de autenticación y estamos usando cache, limpiar cache y reintentar
      if ((response.status === 401 || error.includes('not authorized')) && sessionCache && retryCount === 0) {
        apiLogger.warn('Token expirado o inválido, limpiando cache y reintentando...');
        sessionCache = null;
        timer();
        return rcFetch(path, options, retryCount + 1);
      }
      
      apiLogger.error(`API Error ${response.status}`, undefined, {
        status: response.status,
        url,
        error,
        responseData
      });
      timer();
      throw new Error(error || `Error en API de Rocket.Chat: ${response.statusText}`);
    }

    apiLogger.info('API request successful', { 
      status: response.status,
      success: responseData.success 
    });
    timer();
    return responseData;
    
  } catch (error: any) {
    // Si es un error de red y podemos reintentar
    if (retryCount < RETRY_CONFIG.maxRetries && !error.message.includes('not authorized')) {
      const delay = Math.min(
        RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount),
        RETRY_CONFIG.maxDelay
      );
      
      apiLogger.warn(`Error de red, reintentando en ${delay}ms...`, {
        retryCount,
        error: error.message
      });
      timer();
      await sleep(delay);
      return rcFetch(path, options, retryCount + 1);
    }
    
    throw error;
  }
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

// Función mejorada para SSO usando impersonación
export async function createSSOTokenForUser(username: string, email: string): Promise<string> {
  const ssoLogger = logger.child({ 
    action: 'create-sso-token',
    username,
    email 
  });
  
  ssoLogger.info('Creando token SSO para usuario');
  
  try {
    // Primero, buscar el usuario para obtener su ID
    const userInfo = await rcFetch(`/api/v1/users.info?username=${username}`);
    
    if (!userInfo.success || !userInfo.user) {
      throw new Error(`Usuario ${username} no encontrado en Rocket.Chat`);
    }
    
    const userId = userInfo.user._id;
    
    // Método 1: Intentar generar un Personal Access Token para el usuario
    try {
      ssoLogger.debug('Intentando generar PAT para el usuario');
      
      const patResponse = await rcFetch('/api/v1/users.generatePersonalAccessToken', {
        method: 'POST',
        body: JSON.stringify({
          tokenName: `SSO_${Date.now()}`,
          bypassTwoFactor: true,
          userId: userId // Intentar generar para otro usuario (requiere permisos admin)
        }),
      });
      
      if (patResponse.success && patResponse.token) {
        ssoLogger.info('PAT generado exitosamente para SSO');
        return patResponse.token;
      }
    } catch (patError: any) {
      ssoLogger.debug('No se pudo generar PAT, intentando método alternativo', { error: patError.message });
    }
    
    // Método 2: Usar el método de login con contraseña temporal
    ssoLogger.debug('Usando método de contraseña temporal');
    
    // Generar una contraseña temporal segura
    const tempPassword = `SSO_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    
    // Actualizar la contraseña del usuario
    const updateResponse = await rcFetch('/api/v1/users.update', {
      method: 'POST',
      body: JSON.stringify({
        userId: userId,
        data: {
          password: tempPassword,
          requirePasswordChange: false,
          verified: true
        }
      }),
    });
    
    if (!updateResponse.success) {
      // Si falla la actualización, intentar con un enfoque diferente
      ssoLogger.warn('No se pudo actualizar contraseña, intentando método setPassword');
      
      const setPasswordResponse = await rcFetch('/api/v1/users.setPassword', {
        method: 'POST',
        body: JSON.stringify({
          userId: userId,
          password: tempPassword
        }),
      });
      
      if (!setPasswordResponse.success) {
        throw new Error('No se pudo establecer contraseña temporal para el usuario');
      }
    }
    
    // Hacer login con la contraseña temporal
    ssoLogger.debug('Realizando login con contraseña temporal');
    
    // Esperar un poco para evitar problemas de sincronización
    await sleep(500);
    
    const loginResponse = await fetch(`${RC_URL}/api/v1/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: username,
        password: tempPassword,
      }),
    });
    
    const loginData = await loginResponse.json();
    
    if (loginResponse.ok && loginData.status !== 'error' && loginData.data?.authToken) {
      ssoLogger.info('Token SSO creado exitosamente', {
        userId: loginData.data.userId,
        hasAuthToken: true
      });
      
      return loginData.data.authToken;
    }
    
    throw new Error(`No se pudo crear token SSO: ${loginData.error || loginData.message || 'Error desconocido'}`);
    
  } catch (error: any) {
    ssoLogger.error('Error al crear token SSO', error);
    throw new Error(`Error en SSO: ${error.message}`);
  }
}

// Mantener función anterior por compatibilidad pero usar la nueva
export async function loginUserDirectly(username: string, email: string) {
  const loginLogger = logger.child({ 
    action: 'direct-login-legacy',
    username,
    email 
  });
  
  loginLogger.warn('Usando función legacy loginUserDirectly, redirigiendo a createSSOTokenForUser');
  return createSSOTokenForUser(username, email);
}

// Función auxiliar para obtener el ID del usuario por username
async function getUserIdByUsername(username: string): Promise<string> {
  const response = await rcFetch(`/api/v1/users.info?username=${username}`);
  if (response.success && response.user) {
    return response.user._id;
  }
  throw new Error(`Usuario ${username} no encontrado`);
}

// Función actualizada para usar el nuevo método SSO
export async function createLoginTokenForUser(rcUserId: string, username?: string) {
  const tokenLogger = logger.child({ 
    action: 'create-login-token',
    rcUserId,
    username 
  });
  
  tokenLogger.info('Creando token de login para usuario');
  
  // Si no tenemos username, buscarlo
  if (!username) {
    try {
      const userInfo = await rcFetch(`/api/v1/users.info?userId=${rcUserId}`);
      if (userInfo.success && userInfo.user) {
        username = userInfo.user.username;
      }
    } catch (error) {
      tokenLogger.error('No se pudo obtener información del usuario', error);
    }
  }
  
  if (!username) {
    throw new Error('Username requerido para crear token de login');
  }
  
  // Obtener email del usuario si es posible
  const userInfo = await rcFetch(`/api/v1/users.info?username=${username}`);
  const email = userInfo.user?.emails?.[0]?.address || `${username}@local`;
  
  // Usar el nuevo método SSO
  return createSSOTokenForUser(username, email);
}
