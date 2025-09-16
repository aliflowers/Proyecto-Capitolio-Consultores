import pino from 'pino';
import path from 'path';
import fs from 'fs';

// Configuración para logs en archivos con rotación
export function createFileLogger() {
  const logsDir = path.join(process.cwd(), 'logs');
  
  // Crear directorio de logs si no existe
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Generar nombre de archivo con fecha
  const getLogFileName = (type: string) => {
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return path.join(logsDir, `${type}-${dateStr}.log`);
  };

  // Configuración para diferentes niveles de logs
  const targets = [
    {
      level: 'info',
      target: 'pino/file',
      options: {
        destination: getLogFileName('combined'),
        mkdir: true,
        sync: false,
      },
    },
    {
      level: 'error',
      target: 'pino/file',
      options: {
        destination: getLogFileName('error'),
        mkdir: true,
        sync: false,
      },
    },
    {
      level: 'debug',
      target: 'pino/file',
      options: {
        destination: getLogFileName('debug'),
        mkdir: true,
        sync: false,
      },
    },
  ];

  // Escribir a archivos si está en producción O si LOG_TO_FILE está activado
  const shouldLogToFile = process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true';
  
  if (shouldLogToFile) {
    return pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        targets,
      },
    });
  }

  // En desarrollo sin LOG_TO_FILE, usar el logger normal con pretty print
  return null;
}

// Función para rotar logs manualmente
export function rotateLogs() {
  const logsDir = path.join(process.cwd(), 'logs');
  const archiveDir = path.join(logsDir, 'archive');

  // Crear directorio de archivo si no existe
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  // Obtener todos los archivos de log
  const files = fs.readdirSync(logsDir).filter(file => file.endsWith('.log'));

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  files.forEach(file => {
    // No rotar logs del día actual
    if (!file.includes(todayStr)) {
      const oldPath = path.join(logsDir, file);
      const newPath = path.join(archiveDir, file);
      
      // Mover archivo al directorio de archivo
      fs.renameSync(oldPath, newPath);
    }
  });
}

// Función para limpiar logs antiguos (más de 30 días)
export function cleanOldLogs(daysToKeep: number = 30) {
  const logsDir = path.join(process.cwd(), 'logs', 'archive');
  
  if (!fs.existsSync(logsDir)) {
    return;
  }

  const files = fs.readdirSync(logsDir);
  const now = Date.now();
  const maxAge = daysToKeep * 24 * 60 * 60 * 1000; // días en milisegundos

  files.forEach(file => {
    const filePath = path.join(logsDir, file);
    const stats = fs.statSync(filePath);
    
    if (now - stats.mtime.getTime() > maxAge) {
      fs.unlinkSync(filePath);
    }
  });
}

// Configurar rotación automática diaria
export function setupAutoRotation() {
  // Rotar logs cada día a medianoche
  const scheduleRotation = () => {
    const now = new Date();
    const night = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // Próximo día
      0, 0, 0 // Medianoche
    );
    const msToMidnight = night.getTime() - now.getTime();

    setTimeout(() => {
      rotateLogs();
      cleanOldLogs();
      scheduleRotation(); // Programar la siguiente rotación
    }, msToMidnight);
  };

  // Activar rotación si estamos en producción o si LOG_TO_FILE está activado
  if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
    scheduleRotation();
  }
}
