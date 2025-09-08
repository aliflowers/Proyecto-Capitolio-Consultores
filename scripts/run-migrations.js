#!/usr/bin/env node

/**
 * Script para ejecutar migraciones de base de datos en orden
 * Nexus Jurídico - Capitolio Consultores
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para la salida en consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
  }
};

// Funciones de utilidad para logging
function log(message, color = colors.fg.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.fg.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.fg.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.fg.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.fg.blue);
}

function logStep(step, message) {
  log(`\n${colors.fg.cyan}${step}. ${message}${colors.reset}`);
}

function logProgress(message) {
  log(`🔄 ${message}`, colors.fg.magenta);
}

// Función para ejecutar comandos con manejo de errores
function executeCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      stdio: options.stdio || 'inherit',
      cwd: process.cwd(),
      ...options
    });
    return result ? result.toString().trim() : '';
  } catch (error) {
    if (!options.ignoreErrors) {
      throw new Error(`Comando fallido: ${command}\nError: ${error.message}`);
    }
    return null;
  }
}

// Verificar que Docker esté corriendo
async function checkDocker() {
  logStep(1, 'Verificando que Docker esté corriendo...');
  
  try {
    const dockerVersion = executeCommand('docker --version', { stdio: 'pipe' });
    logSuccess(`Docker instalado: ${dockerVersion}`);
    
    const dockerInfo = executeCommand('docker info', { stdio: 'pipe' });
    if (dockerInfo.includes('Server:') && dockerInfo.includes('running')) {
      logSuccess('Docker Desktop está corriendo correctamente');
      return true;
    } else {
      logWarning('Docker Desktop puede no estar corriendo');
      return false;
    }
  } catch (error) {
    logError(`Error al verificar Docker: ${error.message}`);
    return false;
  }
}

// Verificar que el contenedor PostgreSQL esté corriendo
async function checkPostgreSQLContainer() {
  logStep(2, 'Verificando contenedor PostgreSQL...');
  
  try {
    const containerStatus = executeCommand('docker-compose ps', { stdio: 'pipe' });
    if (containerStatus.includes('nexus-postgres') && containerStatus.includes('running')) {
      logSuccess('Contenedor PostgreSQL está corriendo');
      return true;
    } else {
      logWarning('Contenedor PostgreSQL no está corriendo');
      logInfo('Intentando iniciar contenedor...');
      
      try {
        executeCommand('docker-compose up -d');
        logSuccess('Contenedor iniciado correctamente');
        return true;
      } catch (error) {
        logError(`Error al iniciar contenedor: ${error.message}`);
        return false;
      }
    }
  } catch (error) {
    logError(`Error al verificar contenedor: ${error.message}`);
    return false;
  }
}

// Verificar que PostgreSQL esté listo para aceptar conexiones
async function checkPostgreSQLReady() {
  logStep(3, 'Verificando que PostgreSQL esté listo...');
  
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    try {
      executeCommand('docker exec nexus-postgres pg_isready -U nexus_admin -d nexus_juridico', { stdio: 'pipe' });
      logSuccess('PostgreSQL está listo para aceptar conexiones');
      return true;
    } catch (error) {
      // Ignorar errores temporales
    }
    
    attempts++;
    if (attempts >= maxAttempts) {
      logError('PostgreSQL no está listo después de varios intentos');
      return false;
    }
    
    logProgress(`Intento ${attempts}/${maxAttempts}... esperando 2 segundos`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return true;
}

// Ejecutar migraciones en orden
async function runMigrations() {
  logStep(4, 'Ejecutando migraciones de base de datos...');
  
  const migrationsDir = './migrations';
  if (!fs.existsSync(migrationsDir)) {
    logError(`Directorio de migraciones no encontrado: ${migrationsDir}`);
    return false;
  }
  
  // Obtener todos los archivos .sql ordenados por nombre
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  if (migrationFiles.length === 0) {
    logWarning('No se encontraron archivos de migración');
    return true;
  }
  
  logInfo(`Encontrados ${migrationFiles.length} archivos de migración`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const file of migrationFiles) {
    try {
      logProgress(`Ejecutando migración: ${file}`);
      const filePath = path.join(migrationsDir, file);
      
      // Ejecutar el script SQL
      executeCommand(`docker exec -i nexus-postgres psql -U nexus_admin -d nexus_juridico < "${filePath}"`);
      
      logSuccess(`Migración completada: ${file}`);
      successCount++;
    } catch (error) {
      logError(`Error en migración ${file}: ${error.message}`);
      errorCount++;
    }
  }
  
  log('\n📊 Resumen de migraciones:');
  logSuccess(`   ✅ Completadas: ${successCount}`);
  if (errorCount > 0) {
    logError(`   ❌ Errores: ${errorCount}`);
  } else {
    logSuccess(`   🎉 Todas las migraciones se ejecutaron exitosamente`);
  }
  
  return errorCount === 0;
}

// Verificar estructura de base de datos final
async function verifyDatabaseStructure() {
  logStep(5, 'Verificando estructura de base de datos final...');
  
  const requiredTables = [
    'users', 'profiles', 'documentos', 'document_chunks', 'casos',
    'clientes', 'casos_clientes', 'casos_documentos', 'storage_buckets', 'storage_objects'
  ];
  
  try {
    for (const table of requiredTables) {
      const result = executeCommand(
        `docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -t -c "SELECT COUNT(*) FROM ${table};"`,
        { stdio: 'pipe' }
      );
      const count = result.trim();
      logSuccess(`Tabla ${table}: ${count} registros`);
    }
    
    logSuccess('Todas las tablas requeridas están presentes');
    return true;
  } catch (error) {
    logError(`Error al verificar estructura de base de datos: ${error.message}`);
    return false;
  }
}

// Verificar usuario Super Admin temporal
async function verifySuperAdmin() {
  logStep(6, 'Verificando usuario Super Admin temporal...');
  
  try {
    const result = executeCommand(
      `docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -t -c "SELECT email, is_super_admin, is_temporary_super_admin FROM users WHERE email = 'aliflores@capitolioconsultores.com';"` ,
      { stdio: 'pipe' }
    );
    
    if (result && result.includes('aliflores@capitolioconsultores.com')) {
      logSuccess('Usuario Super Admin temporal encontrado y configurado correctamente');
      console.log(result);
      return true;
    } else {
      logWarning('Usuario Super Admin temporal no encontrado');
      return false;
    }
  } catch (error) {
    logError(`Error al verificar Super Admin: ${error.message}`);
    return false;
  }
}

// Función principal
async function main() {
  try {
    log('\n🚀 Iniciando ejecución de migraciones para Nexus Jurídico...\n', colors.fg.cyan);
    
    // Verificar Docker
    if (!(await checkDocker())) {
      throw new Error('Docker no está disponible');
    }
    
    // Verificar contenedor PostgreSQL
    if (!(await checkPostgreSQLContainer())) {
      throw new Error('No se pudo iniciar el contenedor PostgreSQL');
    }
    
    // Verificar que PostgreSQL esté listo
    if (!(await checkPostgreSQLReady())) {
      throw new Error('PostgreSQL no está listo para aceptar conexiones');
    }
    
    // Ejecutar migraciones
    if (!(await runMigrations())) {
      throw new Error('Algunas migraciones fallaron');
    }
    
    // Verificar estructura de base de datos
    if (!(await verifyDatabaseStructure())) {
      throw new Error('La estructura de base de datos no es correcta');
    }
    
    // Verificar Super Admin temporal
    if (!(await verifySuperAdmin())) {
      logWarning('El usuario Super Admin temporal no está configurado correctamente');
    }
    
    log('\n🎉 ¡Ejecución de migraciones completada exitosamente!', colors.fg.green);
    log('\n✨ La base de datos está lista para usar.', colors.fg.blue);
    log('\n📖 Consulte la documentación en Documentacion_Tecnica_Local.md para más detalles.', colors.fg.yellow);
    
  } catch (error) {
    logError(`\n❌ Error fatal durante la ejecución de migraciones: ${error.message}`);
    logInfo('\n💡 Solución sugerida:');
    log('   1. Verifique que Docker Desktop esté instalado y corriendo');
    log('   2. Asegúrese de tener permisos suficientes');
    log('   3. Revise los logs de Docker: docker-compose logs');
    log('   4. Intente ejecutar el script nuevamente');
    process.exit(1);
  }
}

// Ejecutar si este archivo se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = main;
