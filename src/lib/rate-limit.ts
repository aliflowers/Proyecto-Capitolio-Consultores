import { NextRequest, NextResponse } from 'next/server';

// Mapa para almacenar las solicitudes por IP
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const REQUEST_LIMIT = 100; // Máximo de solicitudes por ventana
const WINDOW_SIZE = 60 * 1000; // Ventana de 1 minuto en milisegundos

/**
 * Middleware para limitar la tasa de solicitudes por IP
 * @param request - La solicitud HTTP
 * @param options - Opciones de configuración
 * @returns NextResponse | null - Respuesta si se excede el límite, null si está permitido
 */
export async function rateLimit(
  request: NextRequest,
  options: {
    limit?: number;
    windowMs?: number;
    skipSuccessfulRequests?: boolean;
  } = {}
): Promise<NextResponse | null> {
  const {
    limit = REQUEST_LIMIT,
    windowMs = WINDOW_SIZE,
    skipSuccessfulRequests = false
  } = options;

  // Obtener la IP del cliente
  const ip = getClientIP(request);
  
  // Obtener el tiempo actual
  const now = Date.now();
  
  // Obtener o crear el contador para esta IP
  let requestCount = requestCounts.get(ip);
  
  // Si no existe o ha expirado, crear uno nuevo
  if (!requestCount || requestCount.resetTime <= now) {
    requestCount = {
      count: 0,
      resetTime: now + windowMs
    };
    requestCounts.set(ip, requestCount);
  }
  
  // Incrementar el contador
  requestCount.count++;
  
  // Verificar si se excede el límite
  if (requestCount.count > limit) {
    // Calcular tiempo de espera hasta el reset
    const retryAfter = Math.ceil((requestCount.resetTime - now) / 1000);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Too Many Requests',
        message: 'Demasiadas solicitudes. Por favor, inténtelo de nuevo más tarde.',
        retryAfter: retryAfter
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.floor(requestCount.resetTime / 1000).toString()
        }
      }
    );
  }
  
  // Actualizar headers de rate limit
  const remaining = limit - requestCount.count;
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', limit.toString());
  headers.set('X-RateLimit-Remaining', remaining.toString());
  headers.set('X-RateLimit-Reset', Math.floor(requestCount.resetTime / 1000).toString());
  
  // Devolver null para indicar que la solicitud está permitida
  // Los headers se pueden aplicar en la respuesta final
  return null;
}

/**
 * Obtener la IP del cliente de la solicitud
 * @param request - La solicitud HTTP
 * @returns string - La IP del cliente
 */
function getClientIP(request: NextRequest): string {
  // Intentar obtener IP de diferentes headers
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  
  const xRealIP = request.headers.get('x-real-ip');
  if (xRealIP) {
    return xRealIP.trim();
  }
  
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }
  
  // Si no se encuentra en headers, usar unknown como fallback
  return 'unknown';
}

/**
 * Limpiar IPs antiguas periódicamente
 */
function cleanupOldEntries() {
  const now = Date.now();
  for (const [ip, requestCount] of requestCounts.entries()) {
    if (requestCount.resetTime <= now) {
      requestCounts.delete(ip);
    }
  }
}

// Limpiar entradas antiguas cada 5 minutos
setInterval(cleanupOldEntries, 5 * 60 * 1000);

/**
 * Middleware específico para APIs protegidas
 * @param request - La solicitud HTTP
 * @param options - Opciones adicionales
 * @returns NextResponse | null - Respuesta si se excede el límite, null si está permitido
 */
export async function apiRateLimit(
  request: NextRequest,
  options: {
    limit?: number;
    windowMs?: number;
    skipSuccessfulRequests?: boolean;
  } = {}
): Promise<NextResponse | null> {
  return rateLimit(request, {
    limit: options.limit || 50, // Más estricto para APIs
    windowMs: options.windowMs || 60 * 1000, // 1 minuto
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    ...options
  });
}

/**
 * Middleware específico para endpoints de autenticación
 * @param request - La solicitud HTTP
 * @param options - Opciones adicionales
 * @returns NextResponse | null - Respuesta si se excede el límite, null si está permitido
 */
export async function authRateLimit(
  request: NextRequest,
  options: {
    limit?: number;
    windowMs?: number;
    skipSuccessfulRequests?: boolean;
  } = {}
): Promise<NextResponse | null> {
  return rateLimit(request, {
    limit: options.limit || 10, // Muy estricto para login/register
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutos
    skipSuccessfulRequests: options.skipSuccessfulRequests !== undefined ? options.skipSuccessfulRequests : true, // No contar solicitudes exitosas
    ...options
  });
}
