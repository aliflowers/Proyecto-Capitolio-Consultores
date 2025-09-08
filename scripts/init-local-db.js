#!/usr/bin/env node

/**
 * Script de inicialización simple para base de datos local
 * Nexus Jurídico - Capitolio Consultores
 */

const { execSync } = require('child_process');

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[type]}${message}${colors.reset}`);
}

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

async function main() {
  try {
    log('🚀 Iniciando inicialización de base de datos local...', 'info');
    
    // Verificar Docker
    log('🔍 Verificando Docker...', 'info');
    const dockerVersion = executeCommand('docker --version', { stdio: 'pipe' });
    log(`✅ Docker instalado: ${dockerVersion}`, 'success');
    
    // Detener contenedores existentes
    log('⏹️ Deteniendo contenedores existentes...', 'info');
    executeCommand('docker-compose down', { stdio: 'pipe', ignoreErrors: true });
    
    // Iniciar contenedores
    log('▶️ Iniciando contenedores...', 'info');
    executeCommand('docker-compose up -d');
    
    // Esperar a que PostgreSQL esté listo
    log('⏳ Esperando a que PostgreSQL esté listo...', 'info');
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
      try {
        executeCommand('docker exec nexus-postgres pg_isready -U nexus_admin -d nexus_juridico', { stdio: 'pipe' });
        log('✅ PostgreSQL está listo', 'success');
        break;
      } catch (error) {
        // Ignorar errores temporales
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error('PostgreSQL no está listo después de varios intentos');
      }
      
      log(`⏳ Intento ${attempts}/${maxAttempts}... esperando 2 segundos`, 'warning');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Verificar tablas creadas
    log('📋 Verificando tablas creadas...', 'info');
    const tables = executeCommand('docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -t -c "\\dt"', { stdio: 'pipe' });
    log('✅ Tablas creadas:', 'success');
    console.log(tables);
    
    // Verificar usuario Super Admin
    log('👑 Verificando usuario Super Admin...', 'info');
    const adminUser = executeCommand(
      `docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -t -c "SELECT email, is_super_admin, is_temporary_super_admin FROM users WHERE email = 'aliflores@capitolioconsultores.com';"`,
      { stdio: 'pipe' }
    );
    
    if (adminUser && adminUser.includes('aliflores@capitolioconsultores.com')) {
      log('✅ Usuario Super Admin encontrado y configurado', 'success');
      console.log(adminUser);
    } else {
      log('⚠️ Usuario Super Admin no encontrado', 'warning');
    }
    
    log('🎉 ¡Inicialización de base de datos local completada exitosamente!', 'success');
    log('🔧 Comandos útiles:', 'info');
    log('   docker-compose ps          - Ver estado de contenedores', 'info');
    log('   docker-compose logs        - Ver logs de contenedores', 'info');
    log('   docker-compose restart     - Reiniciar contenedores', 'info');
    log('   node src/lib/final-test.js - Ejecutar pruebas de conexión', 'info');
    
  } catch (error) {
    log(`❌ Error durante la inicialización: ${error.message}`, 'error');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = main;
