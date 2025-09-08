import { NextRequest, NextResponse } from 'next/server';
import { rateLimit as existingRateLimit, apiRateLimit as existingApiRateLimit, authRateLimit as existingAuthRateLimit } from '@/lib/rate-limit';

// Re-exportar las funciones existentes con mejor tipado
interface RateLimitResult {
  success: boolean;
  headers?: Record<string, string>;
  remaining?: number;
  resetTime?: number;
}

/**
 * Middleware de Rate Limiting para proteger APIs contra DDoS
 * Wrapper alrededor de la implementación existente en lib/rate-limit.ts
 * @param config - Configuración del rate limiting
 * @returns Middleware function
 */
export function rateLimit(config: {
  limit?: number;
  windowMs?: number;
  skipSuccessfulRequests?: boolean;
} = {}) {
  return async function rateLimitMiddleware(request: NextRequest): Promise<RateLimitResult | null> {
    try {
      // Usar la implementación existente
      const result = await existingRateLimit(request, config);
      
      if (result) {
        // Si hay resultado, significa que se excedió el límite
        return {
          success: false,
          headers: {
            'Retry-After': result.headers.get('Retry-After') || '60',
            'X-RateLimit-Limit': result.headers.get('X-RateLimit-Limit') || config.limit?.toString() || '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.headers.get('X-RateLimit-Reset') || Math.floor((Date.now() + 60000) / 1000).toString()
          }
        };
      }
      
      // Permitir la solicitud
      return null;
      
    } catch (error) {
      console.error('Error en rate limiting:', error);
      // Permitir la solicitud en caso de error para no bloquear el servicio
      return null;
    }
  };
}

/**
 * Rate limiting específico para APIs protegidas
 * @returns Middleware function
 */
export function apiRateLimit() {
  return async function apiRateLimitMiddleware(request: NextRequest): Promise<RateLimitResult | null> {
    try {
      const result = await existingApiRateLimit(request);
      
      if (result) {
        return {
          success: false,
          headers: {
            'Retry-After': result.headers.get('Retry-After') || '60',
            'X-RateLimit-Limit': '50',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.floor((Date.now() + 60000) / 1000).toString()
          }
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error en API rate limiting:', error);
      return null;
    }
  };
}

/**
 * Rate limiting específico para endpoints de autenticación
 * @returns Middleware function
 */
export function authRateLimit() {
  return async function authRateLimitMiddleware(request: NextRequest): Promise<RateLimitResult | null> {
    try {
      const result = await existingAuthRateLimit(request);
      
      if (result) {
        return {
          success: false,
          headers: {
            'Retry-After': result.headers.get('Retry-After') || '900',
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.floor((Date.now() + 900000) / 1000).toString()
          }
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error en auth rate limiting:', error);
      return null;
    }
  };
}

/**
 * Rate limiting específico para endpoints públicos
 * @returns Middleware function
 */
export function publicRateLimit() {
  return rateLimit({
    limit: 200, // Más permisivo para endpoints públicos
    windowMs: 60 * 1000 // 1 minuto
  });
}

/**
 * Obtener la IP del cliente de la solicitud
 * @param request - La solicitud HTTP
 * @returns string - La IP del cliente
 */
export function getClientIP(request: NextRequest): string {
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
  
  // Fallback: usar forwarded-for o unknown
  return request.headers.get('forwarded-for') || 'unknown';
}
