// Logger simplificado para Edge Runtime (middleware)
// No usa módulos de Node.js como 'path' o 'fs'

import pino from 'pino';

// Configuración básica para Edge Runtime
const logLevel = process.env.LOG_LEVEL || 'info';

// Logger simple para Edge Runtime
const edgeLogger = pino({
  level: logLevel,
  base: {
    runtime: 'edge',
    service: 'capitolio-consultores',
  },
  browser: {
    asObject: true,
    transmit: {
      send: function (level, logEvent) {
        // En Edge Runtime, solo loggear a consola
        const msg = logEvent.messages[0];
        
        if (typeof console !== 'undefined') {
          switch (level.label) {
            case 'error':
            case 'fatal':
              console.error(msg);
              break;
            case 'warn':
              console.warn(msg);
              break;
            case 'info':
              console.info(msg);
              break;
            case 'debug':
            case 'trace':
              console.log(msg);
              break;
            default:
              console.log(msg);
          }
        }
      }
    }
  },
});

// Clase Logger simplificada para Edge Runtime
export class EdgeLogger {
  private context: Record<string, any>;

  constructor(context: Record<string, any> = {}) {
    this.context = context;
  }

  private log(level: string, message: string, data?: Record<string, any>) {
    const logData = {
      level,
      msg: message,
      time: new Date().toISOString(),
      ...this.context,
      ...data,
    };
    
    // En Edge Runtime, usar console directamente
    const logString = JSON.stringify(logData);
    
    switch (level) {
      case 'error':
      case 'fatal':
        console.error(logString);
        break;
      case 'warn':
        console.warn(logString);
        break;
      case 'info':
        console.info(logString);
        break;
      default:
        console.log(logString);
    }
  }

  trace(message: string, data?: Record<string, any>) {
    this.log('trace', message, data);
  }

  debug(message: string, data?: Record<string, any>) {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, any>) {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, any>) {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error | unknown, data?: Record<string, any>) {
    const errorData = error instanceof Error 
      ? { error: { message: error.message, stack: error.stack } }
      : error ? { error } : {};
    
    this.log('error', message, { ...errorData, ...data });
  }

  fatal(message: string, error?: Error | unknown, data?: Record<string, any>) {
    const errorData = error instanceof Error 
      ? { error: { message: error.message, stack: error.stack } }
      : error ? { error } : {};
    
    this.log('fatal', message, { ...errorData, ...data });
  }

  child(additionalContext: Record<string, any>): EdgeLogger {
    return new EdgeLogger({ ...this.context, ...additionalContext });
  }

  startTimer(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.info(`${label} completed`, { duration_ms: duration });
    };
  }
}

// Exportar instancia por defecto
export const defaultEdgeLogger = new EdgeLogger({ module: 'edge-app' });
