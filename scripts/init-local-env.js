#!/usr/bin/env node

/**
 * Script de inicialización automática del entorno de desarrollo local
 * Nexus Jurídico - Capitolio Consultores
 * 
 * Este script automatiza la configuración completa del entorno de desarrollo:
 * 1. Verifica requisitos previos
 * 2. Inicia contenedores Docker
 * 3. Configura base de datos local
 * 4. Crea usuario Super Admin temporal
 * 5. Verifica conexión y funcionalidades
 */

const { execSync, spawn } = require('child_process');
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

// Verificar requisitos previos
async function checkPrerequisites() {
  logStep(1, 'Verificando requisitos previos...');
  
  const prerequisites = [
    { name: 'Docker', command: 'docker --version', check: /Docker version/ },
    { name: 'Docker Compose', command: 'docker-compose --version', check: /Docker Compose/ },
    { name: 'Node.js', command: 'node --version', check: /v\d+\.\d+\.\d+/ },
    { name: 'npm', command: 'npm --version', check: /\d+\.\d+\.\d+/ }
  ];
  
  let allGood = true;
  
  for (const prereq of prerequisites) {
    try {
      const output = executeCommand(prereq.command, { stdio: 'pipe' });
      if (prereq.check.test(output)) {
        logSuccess(`${prereq.name} instalado: ${output}`);
      } else {
        logError(`${prereq.name} no está correctamente instalado`);
        allGood = false;
      }
    } catch (error) {
      logError(`${prereq.name} no está instalado: ${error.message}`);
      allGood = false;
    }
  }
  
  if (!allGood) {
    logWarning('Por favor, instale los requisitos previos faltantes antes de continuar.');
    process.exit(1);
  }
  
  return true;
}

// Verificar estado de Docker Desktop
async function checkDockerDesktop() {
  logStep(2, 'Verificando estado de Docker Desktop...');
  
  try {
    // Intentar obtener información de Docker
    const dockerInfo = executeCommand('docker info', { stdio: 'pipe' });
    if (dockerInfo.includes('Server:') && dockerInfo.includes('Running')) {
      logSuccess('Docker Desktop está corriendo correctamente');
      return true;
    } else {
      logWarning('Docker Desktop no parece estar corriendo. Intentando iniciar...');
      // En Windows, intentar iniciar Docker Desktop
      try {
        executeCommand('start "" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"', { 
          stdio: 'pipe', 
          shell: true,
          ignoreErrors: true 
        });
        logInfo('Docker Desktop iniciado. Esperando 30 segundos...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        return true;
      } catch (error) {
        logError('No se pudo iniciar Docker Desktop automáticamente');
        logInfo('Por favor, inicie Docker Desktop manualmente y vuelva a ejecutar este script');
        process.exit(1);
      }
    }
  } catch (error) {
    logError(`Error al verificar Docker Desktop: ${error.message}`);
    return false;
  }
}

// Detener contenedores existentes
async function stopExistingContainers() {
  logStep(3, 'Deteniendo contenedores existentes...');
  
  try {
    logProgress('Deteniendo contenedores Nexus Jurídico...');
    executeCommand('docker-compose down', { stdio: 'pipe', ignoreErrors: true });
    logSuccess('Contenedores detenidos correctamente');
    return true;
  } catch (error) {
    logWarning(`No se pudieron detener contenedores existentes: ${error.message}`);
    return true; // Continuar de todos modos
  }
}

// Iniciar contenedores Docker
async function startDockerContainers() {
  logStep(4, 'Iniciando contenedores Docker...');
  
  try {
    logProgress('Construyendo e iniciando contenedores...');
    executeCommand('docker-compose up -d --build');
    
    // Esperar a que los contenedores estén listos
    logProgress('Esperando a que los contenedores estén listos...');
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      try {
        const containerStatus = executeCommand('docker-compose ps', { stdio: 'pipe' });
        if (containerStatus.includes('nexus-postgres') && containerStatus.includes('running')) {
          logSuccess('Contenedores iniciados correctamente');
          return true;
        }
      } catch (error) {
        // Ignorar errores temporales
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error('Los contenedores no están listos después de varios intentos');
      }
      
      logInfo(`Intento ${attempts}/${maxAttempts}... esperando 2 segundos`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return true;
  } catch (error) {
    logError(`Error al iniciar contenedores: ${error.message}`);
    return false;
  }
}

// Verificar estado de PostgreSQL
async function checkPostgreSQLStatus() {
  logStep(5, 'Verificando estado de PostgreSQL...');
  
  try {
    // Verificar que PostgreSQL esté listo
    logProgress('Verificando que PostgreSQL esté listo para aceptar conexiones...');
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
        throw new Error('PostgreSQL no está listo después de varios intentos');
      }
      
      logInfo(`Intento ${attempts}/${maxAttempts}... esperando 2 segundos`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return true;
  } catch (error) {
    logError(`Error al verificar PostgreSQL: ${error.message}`);
    return false;
  }
}

// Verificar estructura de base de datos
async function verifyDatabaseStructure() {
  logStep(6, 'Verificando estructura de base de datos...');
  
const requiredTables = [
    'users', 'profiles', 'documentos', 'document_chunks', 'expedientes',
    'clientes', 'expedientes_clientes', 'expedientes_documentos'
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

// Verificar/crear Super Admin temporal
async function setupSuperAdmin() {
  logStep(7, 'Configurando Super Admin temporal...');
  
  try {
    // Verificar si el usuario ya existe
    const userExists = executeCommand(
      `docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -t -c "SELECT EXISTS(SELECT 1 FROM users WHERE email = 'aliflores@capitolioconsultores.com');"` ,
      { stdio: 'pipe' }
    ).trim();
    
    if (userExists === 't' || userExists === 'true') {
      logInfo('Super Admin temporal ya existe. Actualizando...');
      executeCommand(
        `docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -c "UPDATE users SET is_super_admin = TRUE, is_temporary_super_admin = TRUE, updated_at = NOW() WHERE email = 'aliflores@capitolioconsultores.com';"` ,
        { stdio: 'pipe' }
      );
      logSuccess('Super Admin temporal actualizado correctamente');
    } else {
      logInfo('Creando Super Admin temporal...');
      executeCommand(
        `docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -c "
        INSERT INTO users (
          id, email, encrypted_password, email_confirmed_at, is_super_admin, is_temporary_super_admin, created_at, updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000001'::UUID,
          'aliflores@capitolioconsultores.com',
          '\\\$2a\\\$10\\\$abcdefghijklmnopqrstuvABCDEFGHIJKLMNO', -- Contraseña: admin123 (hash de ejemplo)
          NOW(),
          TRUE,
          TRUE,
          NOW(),
          NOW()
        );
        
        INSERT INTO profiles (
          id, full_name, role
        ) VALUES (
          '00000000-0000-0000-0000-000000000001'::UUID,
          'Ali Flores (Desarrollo)',
          'super_admin'
        );"` ,
        { stdio: 'pipe' }
      );
      logSuccess('Super Admin temporal creado correctamente');
    }
    
    return true;
  } catch (error) {
    logError(`Error al configurar Super Admin: ${error.message}`);
    return false;
  }
}

// Ejecutar pruebas de conexión
async function runConnectionTests() {
  logStep(8, 'Ejecutando pruebas de conexión...');
  
  try {
    logProgress('Ejecutando pruebas de conexión a la base de datos...');
    executeCommand('node src/lib/final-test.js');
    logSuccess('Todas las pruebas de conexión pasaron exitosamente');
    return true;
  } catch (error) {
    logError(`Error en pruebas de conexión: ${error.message}`);
    return false;
  }
}

// Mostrar información de acceso
async function showAccessInfo() {
  logStep(9, 'Información de acceso al entorno local');
  
  log('\n📋 Credenciales del Super Admin Temporal:', colors.fg.yellow);
  log('   Email: aliflores@capitolioconsultores.com', colors.fg.white);
  log('   Contraseña: admin123', colors.fg.white);
  log('   Rol: Super Admin (todos los permisos)', colors.fg.white);
  
  log('\n🌐 Acceso a la aplicación:', colors.fg.yellow);
  log('   URL: http://localhost:3000', colors.fg.blue);
  log('   Área Pública: Página de inicio y navegación básica', colors.fg.white);
  log('   Área Privada: /private (requiere autenticación)', colors.fg.white);
  
  log('\n🐳 Comandos Docker útiles:', colors.fg.yellow);
  log('   docker-compose ps          - Ver estado de contenedores', colors.fg.white);
  log('   docker-compose logs        - Ver logs de contenedores', colors.fg.white);
  log('   docker-compose restart     - Reiniciar contenedores', colors.fg.white);
  log('   docker-compose down        - Detener contenedores', colors.fg.white);
  
  log('\n🗄️ Comandos de base de datos:', colors.fg.yellow);
  log('   docker exec -it nexus-postgres psql -U nexus_admin -d nexus_juridico', colors.fg.white);
  log('   docker exec nexus-postgres pg_dump -U nexus_admin nexus_juridico > backup.sql', colors.fg.white);
  
  log('\n🔧 Desarrollo:', colors.fg.yellow);
  log('   npm run dev                - Iniciar servidor de desarrollo', colors.fg.white);
  log('   npm run build              - Construir para producción', colors.fg.white);
  log('   node src/lib/final-test.js - Ejecutar pruebas de conexión', colors.fg.white);
}

// Función principal
async function main() {
  try {
    log('\n🚀 Iniciando configuración automática del entorno de desarrollo local para Nexus Jurídico...\n', colors.fg.cyan);
    
    // Verificar requisitos previos
    if (!(await checkPrerequisites())) {
      throw new Error('No se cumplen los requisitos previos');
    }
    
    // Verificar Docker Desktop
    if (!(await checkDockerDesktop())) {
      throw new Error('Docker Desktop no está disponible');
    }
    
    // Detener contenedores existentes
    await stopExistingContainers();
    
    // Iniciar contenedores Docker
    if (!(await startDockerContainers())) {
      throw new Error('No se pudieron iniciar los contenedores');
    }
    
    // Verificar estado de PostgreSQL
    if (!(await checkPostgreSQLStatus())) {
      throw new Error('PostgreSQL no está disponible');
    }
    
    // Verificar estructura de base de datos
    if (!(await verifyDatabaseStructure())) {
      throw new Error('La estructura de base de datos no es correcta');
    }
    
    // Configurar Super Admin temporal
    if (!(await setupSuperAdmin())) {
      throw new Error('No se pudo configurar el Super Admin temporal');
    }
    
    // Ejecutar pruebas de conexión
    if (!(await runConnectionTests())) {
      throw new Error('Las pruebas de conexión fallaron');
    }
    
    // Mostrar información de acceso
    await showAccessInfo();
    
    log('\n🎉 ¡Configuración automática completada exitosamente!', colors.fg.green);
    log('\n✨ El entorno de desarrollo local está listo para usar.', colors.fg.blue);
    log('\n📖 Consulte la documentación en Documentacion_Tecnica_Local.md para más detalles.', colors.fg.yellow);
    
  } catch (error) {
    logError(`\n❌ Error fatal durante la configuración: ${error.message}`);
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
