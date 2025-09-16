import { NextRequest, NextResponse } from 'next/server';
import { Logger } from '@/lib/logger';

// Crear logger específico para el middleware
const logger = new Logger({ module: 'http-middleware' });

// Función para extraer información relevante de los headers
function getHeadersInfo(headers: Headers): Record<string, string> {
  const relevantHeaders = ['user-agent', 'referer', 'x-forwarded-for', 'x-real-ip'];
  const info: Record<string, string> = {};
  
  relevantHeaders.forEach(header => {
    const value = headers.get(header);
    if (value) {
      info[header] = value;
    }
  });
  
  return info;
}

// Función para determinar si la ruta debe ser loggeada
function shouldLogRoute(pathname: string): boolean {
  // No loggear assets estáticos
  const excludedPaths = [
    '/_next/',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '.css',
    '.js',
    '.map',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.woff',
    '.woff2',
  ];
  
  return !excludedPaths.some(path => pathname.includes(path));
}

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const { pathname, search } = request.nextUrl;
  const method = request.method;
  
  // Solo loggear rutas relevantes
  if (!shouldLogRoute(pathname)) {
    return NextResponse.next();
  }
  
  // Crear logger con contexto de la petición
  const requestLogger = logger.child({
    requestId,
    method,
    path: pathname,
    query: search,
  });
  
  // Obtener información de headers
  const headersInfo = getHeadersInfo(request.headers);
  
  // Log de la petición entrante
  requestLogger.info('Incoming request', {
    url: request.url,
    headers: headersInfo,
    ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
  });
  
  // Clonar la respuesta para poder modificarla
  const response = NextResponse.next();
  
  // Añadir headers personalizados
  response.headers.set('X-Request-Id', requestId);
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
  
  // Log de la respuesta
  const responseTime = Date.now() - startTime;
  requestLogger.info('Request completed', {
    statusCode: response.status,
    responseTime_ms: responseTime,
  });
  
  // Log de performance si la petición fue lenta
  if (responseTime > 1000) {
    requestLogger.warn('Slow request detected', {
      responseTime_ms: responseTime,
      threshold_ms: 1000,
    });
  }
  
  return response;
}

// Configuración del middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
