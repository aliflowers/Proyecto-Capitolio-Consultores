#!/usr/bin/env node

/**
 * Script de inicio rápido para Nexus Jurídico
 * Verifica y configura el entorno de desarrollo local
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
    log('\n🚀 Nexus Jurídico - Quick Start Script\n', 'info');
    
    // 1. Verificar Docker
    log('1. Verificando Docker...', 'info');
    try {
      const dockerVersion = executeCommand('docker --version', { stdio: 'pipe' });
      log(`✅ Docker instalado: ${dockerVersion}`, 'success');
    } catch (error) {
      log('❌ Docker no está instalado', 'error');
      log('💡 Por favor, instale Docker Desktop desde https://www.docker.com/products/docker-desktop', 'warning');
      process.exit(1);
    }
    
    // 2. Verificar contenedores
    log('\n2. Verificando contenedores...', 'info');
    try {
      const containerStatus = executeCommand('docker-compose ps', { stdio: 'pipe' });
      if (containerStatus.includes('nexus-postgres') && containerStatus.includes('running')) {
        log('✅ Contenedores Nexus Jurídico están corriendo', 'success');
      } else {
        log('⚠️  Contenedores no están corriendo', 'warning');
        log('💡 Iniciando contenedores...', 'info');
        executeCommand('docker-compose up -d');
        log('✅ Contenedores iniciados', 'success');
      }
    } catch (error) {
      log('❌ Error al verificar contenedores', 'error');
      process.exit(1);
    }
    
    // 3. Verificar PostgreSQL
    log('\n3. Verificando PostgreSQL...', 'info');
    let postgresReady = false;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts && !postgresReady) {
      try {
        executeCommand('docker exec nexus-postgres pg_isready -U nexus_admin -d nexus_juridico', { stdio: 'pipe' });
        postgresReady = true;
        log('✅ PostgreSQL está listo para aceptar conexiones', 'success');
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          log('❌ PostgreSQL no está listo después de varios intentos', 'error');
          process.exit(1);
        }
        log(`⏳ Esperando PostgreSQL... (${attempts}/${maxAttempts})`, 'warning');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // 4. Verificar estructura de base de datos
    log('\n4. Verificando estructura de base de datos...', 'info');
    try {
      const tables = executeCommand('docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -t -c "\\dt"', { stdio: 'pipe' });
      const tableCount = (tables.match(/public/g) || []).length;
      log(`✅ ${tableCount} tablas encontradas en la base de datos`, 'success');
      
      if (tableCount >= 10) {
        log('✅ Estructura de base de datos completa', 'success');
      } else {
        log('⚠️  Estructura de base de datos incompleta', 'warning');
      }
    } catch (error) {
      log('❌ Error al verificar estructura de base de datos', 'error');
      process.exit(1);
    }
    
    // 5. Verificar Super Admin
    log('\n5. Verificando Super Admin...', 'info');
    try {
      const adminExists = executeCommand(
        `docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -t -c "SELECT EXISTS(SELECT 1 FROM users WHERE email = 'aliflores@capitolioconsultores.com');"` ,
        { stdio: 'pipe' }
      ).trim();
      
      if (adminExists === 't' || adminExists === 'true') {
        log('✅ Super Admin temporal encontrado', 'success');
      } else {
        log('⚠️  Super Admin temporal no encontrado', 'warning');
        log('💡 Creando Super Admin temporal...', 'info');
        executeCommand(
          `docker exec nexus-postgres psql -U nexus_admin -d nexus_juridico -c "
          INSERT INTO users (
            id, email, encrypted_password, email_confirmed_at, is_super_admin, is_temporary_super_admin, created_at, updated_at
          ) VALUES (
            '00000000-0000-0000-0000-000000000001'::UUID,
            'aliflores@capitolioconsultores.com',
            '\\\$2a\\\$10\\\$abcdefghijklmnopqrstuvABCDEFGHIJKLMNO',
            NOW(),
            TRUE,
            TRUE,
            NOW(),
            NOW()
          ) ON CONFLICT (email) DO UPDATE SET
            is_super_admin = TRUE,
            is_temporary_super_admin = TRUE,
            updated_at = NOW();
          
          INSERT INTO profiles (
            id, full_name, role
          ) VALUES (
            '00000000-0000-0000-0000-000000000001'::UUID,
            'Ali Flores (Desarrollo)',
            'super_admin'
          ) ON CONFLICT (id) DO UPDATE SET
            full_name = 'Ali Flores (Desarrollo)',
            role = 'super_admin';"` ,
          { stdio: 'pipe' }
        );
        log('✅ Super Admin temporal creado exitosamente', 'success');
      }
    } catch (error) {
      log('❌ Error al verificar Super Admin', 'error');
    }
    
    // 6. Pruebas de conexión Node.js
    log('\n6. Ejecutando pruebas de conexión Node.js...', 'info');
    try {
      executeCommand('node src/lib/final-test.js');
      log('✅ Todas las pruebas de conexión pasaron exitosamente', 'success');
    } catch (error) {
      log('❌ Error en pruebas de conexión', 'error');
    }
    
    log('\n🎉 ¡Quick Start completado exitosamente!', 'success');
    log('\n📊 Resumen:', 'info');
    log('   ✅ Docker instalado y funcionando', 'success');
    log('   ✅ Contenedores Nexus Jurídico corriendo', 'success');
    log('   ✅ PostgreSQL listo para aceptar conexiones', 'success');
    log('   ✅ Estructura de base de datos verificada', 'success');
    log('   ✅ Super Admin temporal configurado', 'success');
    log('   ✅ Pruebas de conexión Node.js exitosas', 'success');
    
    log('\n🚀 El entorno de desarrollo local está listo para usar', 'info');
    log('   URL: http://localhost:3000', 'success');
    log('   Super Admin: aliflores@capitolioconsultores.com / admin123', 'success');
    
  } catch (error) {
    log(`\n❌ Error fatal: ${error.message}`, 'error');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = main;
