import pino from 'pino';
import { z } from 'zod';

// Esquema de configuración del logger
const LogLevelSchema = z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']);
type LogLevel = z.infer<typeof LogLevelSchema>;

// Configuración del entorno
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const logLevel = (process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info')) as LogLevel;

// Configuración base de Pino
const baseConfig: pino.LoggerOptions = {
  level: logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  base: {
    pid: process.pid,
    hostname: process.env.HOSTNAME || 'localhost',
    environment: process.env.NODE_ENV || 'development',
    service: 'capitolio-consultores',
  },
};

// Configuración específica para desarrollo
const developmentConfig: pino.LoggerOptions = {
  ...baseConfig,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      levelFirst: true,
      translateTime: 'yyyy-mm-dd HH:MM:ss.l',
      ignore: 'pid,hostname',
      messageFormat: '{msg}',
      errorLikeObjectKeys: ['err', 'error'],
      singleLine: false,
    },
  },
};

// Configuración para producción
const productionConfig: pino.LoggerOptions = {
  ...baseConfig,
  redact: {
    paths: [
      'password',
      'token',
      'authorization',
      'cookie',
      'api_key',
      'apiKey',
      'access_token',
      'refresh_token',
      'client_secret',
      'email',
      '*.password',
      '*.token',
      '*.authorization',
      '*.cookie',
      '*.api_key',
      '*.apiKey',
      '*.access_token',
      '*.refresh_token',
      '*.client_secret',
    ],
    remove: false,
    censor: '[REDACTED]',
  },
};

// Detectar si estamos en Edge Runtime
const isEdgeRuntime = typeof globalThis.EdgeRuntime !== 'undefined' || process.env.NEXT_RUNTIME === 'edge';

// Funciones de archivo solo para Node.js runtime
let ensureLogDirectory: (() => string) | null = null;
let getLogFileName: ((type: string) => string) | null = null;

if (!isEdgeRuntime) {
  // Solo importar y usar módulos de Node.js si NO estamos en Edge Runtime
  const path = require('path');
  const fs = require('fs');
  
  ensureLogDirectory = () => {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      console.log('📁 Directorio de logs creado:', logsDir);
    }
    return logsDir;
  };
  
  getLogFileName = (type: string) => {
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const logsDir = ensureLogDirectory!();
    return path.join(logsDir, `${type}-${dateStr}.log`);
  };
}

// Configuración para escribir logs en archivos (además de consola)
const createDualLogger = () => {
  // Si estamos en Edge Runtime, usar solo configuración básica sin archivos
  if (isEdgeRuntime) {
    return pino({
      ...baseConfig,
      level: logLevel,
      // Para Edge Runtime, usar formato JSON simple
      browser: {
        asObject: true,
      },
    });
  }
  
  const shouldLogToFile = process.env.LOG_TO_FILE === 'true';
  
  // En desarrollo, siempre usar pretty print en consola
  if (isDevelopment && !shouldLogToFile) {
    return pino(developmentConfig);
  }
  
  // Si queremos logs en archivos (desarrollo o producción) - solo en Node.js runtime
  if (shouldLogToFile && ensureLogDirectory && getLogFileName) {
    ensureLogDirectory();
    
    // Para browser, usar configuración simple
    if (typeof window !== 'undefined') {
      return pino(baseConfig);
    }
    
    // Para el server runtime, usar streams
    try {
      const streams = [];
      
      // En desarrollo, agregar stream de consola pretty
      if (isDevelopment) {
        streams.push({
          level: logLevel,
          stream: process.stdout,
        });
      }
      
      // Agregar streams de archivos (solo si las funciones están disponibles)
      if (getLogFileName) {
        streams.push(
          {
            level: logLevel,
            stream: pino.destination({
              dest: getLogFileName('combined'),
              sync: false,
            }),
          },
          {
            level: 'error',
            stream: pino.destination({
              dest: getLogFileName('error'),
              sync: false,
            }),
          }
        );
      }
      
      return pino(
        {
          ...baseConfig,
          level: logLevel,
        },
        pino.multistream(streams)
      );
    } catch (error) {
      console.warn('Error creando logger con archivos, usando configuración básica:', error);
      return pino(isDevelopment ? developmentConfig : productionConfig);
    }
  }
  
  // Por defecto, usar configuración según el entorno
  return pino(isProduction ? productionConfig : developmentConfig);
};

// Crear el logger principal con soporte dual
const logger = createDualLogger();

// Log inicial para confirmar configuración (solo en Node.js runtime)
if (!isEdgeRuntime && process.env.LOG_TO_FILE === 'true') {
  logger.info('📦 Sistema de logging iniciado', {
    mode: process.env.NODE_ENV,
    level: logLevel,
    loggingToFile: true,
    runtime: isEdgeRuntime ? 'edge' : 'nodejs',
  });
}

// Tipos para contexto estructurado
export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  action?: string;
  module?: string;
  metadata?: Record<string, any>;
}

// Helper para crear child loggers con contexto
export function createLogger(context: LogContext) {
  return logger.child(context);
}

// Clase Logger con métodos convenientes
export class Logger {
  private context: LogContext;
  private pinoLogger: pino.Logger;

  constructor(context: LogContext = {}) {
    this.context = context;
    this.pinoLogger = createLogger(context);
  }

  // Métodos de logging con contexto adicional
  trace(message: string, data?: Record<string, any>) {
    this.pinoLogger.trace({ ...this.context, ...data }, message);
  }

  debug(message: string, data?: Record<string, any>) {
    this.pinoLogger.debug({ ...this.context, ...data }, message);
  }

  info(message: string, data?: Record<string, any>) {
    this.pinoLogger.info({ ...this.context, ...data }, message);
  }

  warn(message: string, data?: Record<string, any>) {
    this.pinoLogger.warn({ ...this.context, ...data }, message);
  }

  error(message: string, error?: Error | unknown, data?: Record<string, any>) {
    if (error instanceof Error) {
      this.pinoLogger.error({ ...this.context, err: error, ...data }, message);
    } else if (error) {
      this.pinoLogger.error({ ...this.context, error, ...data }, message);
    } else {
      this.pinoLogger.error({ ...this.context, ...data }, message);
    }
  }

  fatal(message: string, error?: Error | unknown, data?: Record<string, any>) {
    if (error instanceof Error) {
      this.pinoLogger.fatal({ ...this.context, err: error, ...data }, message);
    } else if (error) {
      this.pinoLogger.fatal({ ...this.context, error, ...data }, message);
    } else {
      this.pinoLogger.fatal({ ...this.context, ...data }, message);
    }
  }

  // Método para crear un child logger con contexto adicional
  child(additionalContext: LogContext): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }

  // Método para medir tiempo de ejecución
  startTimer(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.info(`${label} completed`, { duration_ms: duration });
    };
  }

  // Método para logging de API calls
  logApiCall(method: string, url: string, statusCode?: number, duration?: number) {
    const data: Record<string, any> = {
      api_method: method,
      api_url: url,
      api_status: statusCode,
      api_duration_ms: duration,
    };
    
    if (statusCode && statusCode >= 400) {
      this.error('API call failed', undefined, data);
    } else {
      this.info('API call completed', data);
    }
  }
}

// Logger por defecto para uso general
export const defaultLogger = new Logger({ module: 'app' });

// Exportar el logger de Pino crudo si es necesario
export { logger as pinoLogger };

// Función helper para logging de performance
export function logPerformance(fn: Function, name: string, logger: Logger) {
  return async function (...args: any[]) {
    const timer = logger.startTimer(name);
    try {
      const result = await fn.apply(this, args);
      timer();
      return result;
    } catch (error) {
      timer();
      logger.error(`${name} failed`, error);
      throw error;
    }
  };
}

// Exportar tipos y utilidades
export type { LogLevel };
