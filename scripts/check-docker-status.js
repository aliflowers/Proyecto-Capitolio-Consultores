#!/usr/bin/env node

/**
 * Script simple para verificar el estado de Docker y contenedores
 */

const { execSync } = require('child_process');

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // cyan
    success: '\x1b[32m',  // green
    error: '\x1b[31m',    // red
    warning: '\x1b[33m',  // yellow
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function executeCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      stdio: options.stdio || 'pipe',
      cwd: process.cwd(),
      ...options
    });
    return result ? result.toString().trim() : '';
  } catch (error) {
    if (!options.ignoreErrors) {
      throw error;
    }
    return null;
  }
}

async function main() {
  try {
    // Permitir omitir la verificación si se establece la variable de entorno
    if ((process.env.SKIP_DOCKER_CHECK || '').toLowerCase() === 'true' || process.env.SKIP_DOCKER_CHECK === '1') {
      log('⏭️  SKIP_DOCKER_CHECK activo: omitiendo verificación de Docker.', 'warning')
      return
    }

    log('🔍 Verificando estado de Docker...', 'info');
    
    // Verificar versión de Docker
    const dockerVersion = executeCommand('docker --version', { stdio: 'pipe' });
    log(`✅ Docker instalado: ${dockerVersion}`, 'success');
    
    // Verificar Docker Compose
    const composeVersion = executeCommand('docker-compose --version', { stdio: 'pipe' });
    log(`✅ Docker Compose instalado: ${composeVersion}`, 'success');
    
    // Verificar que Docker Desktop esté corriendo
    log('🔄 Verificando que Docker Desktop esté corriendo...', 'info');
    try {
      const dockerInfo = executeCommand('docker info', { stdio: 'pipe' });
      if (dockerInfo.includes('Server:') && dockerInfo.includes('running')) {
        log('✅ Docker Desktop está corriendo correctamente', 'success');
      } else {
        log('⚠️  Docker Desktop puede no estar corriendo', 'warning');
        log('💡 Por favor, asegúrese de que Docker Desktop esté iniciado', 'info');
        process.exit(1);
      }
    } catch (error) {
      log('❌ Docker Desktop no está corriendo', 'error');
      log('💡 Por favor, inicie Docker Desktop manualmente', 'info');
      process.exit(1);
    }
    
    // Verificar contenedores existentes
    log('🔍 Verificando contenedores existentes...', 'info');
    try {
      const containers = executeCommand('docker-compose ps', { stdio: 'pipe' });
      if (containers && containers.length > 0) {
        log('📋 Contenedores existentes:', 'info');
        console.log(containers);
      } else {
        log('📭 No hay contenedores existentes', 'info');
      }
    } catch (error) {
      log('⚠️  No se pudieron listar los contenedores', 'warning');
    }
    
    log('🎉 Verificación completada exitosamente!', 'success');
    log('🚀 Listo para iniciar el entorno de desarrollo local', 'info');
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'error');
    log('💡 Solución:', 'info');
    log('   1. Verifique que Docker Desktop esté instalado', 'info');
    log('   2. Asegúrese de que Docker Desktop esté corriendo', 'info');
    log('   3. Reinicie Docker Desktop si es necesario', 'info');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = main;
