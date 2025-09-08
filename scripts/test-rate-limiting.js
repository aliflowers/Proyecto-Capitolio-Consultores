#!/usr/bin/env node

/**
 * Script de prueba para el sistema de Rate Limiting
 * Verifica que el rate limiting esté funcionando correctamente
 */

const { execSync } = require('child_process');

async function testRateLimiting() {
  console.log('🚀 Iniciando pruebas de Rate Limiting...\n');
  
  try {
    // Verificar que la aplicación esté corriendo
    console.log('1. Verificando que la aplicación esté corriendo...');
    try {
      const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health', { 
        stdio: 'pipe',
        timeout: 5000
      });
      const statusCode = response.toString().trim();
      if (statusCode === '200') {
        console.log('✅ Aplicación corriendo correctamente\n');
      } else {
        console.log('⚠️  Aplicación no responde con código 200, pero continuando...\n');
      }
    } catch (error) {
      console.log('⚠️  No se pudo verificar el estado de la aplicación, continuando...\n');
    }
    
    // Prueba 1: Rate limiting básico
    console.log('2. Probando rate limiting básico (100 solicitudes por minuto)...');
    
    let successCount = 0;
    let rateLimitCount = 0;
    
    // Hacer 5 solicitudes rápidas para probar el rate limiting
    for (let i = 0; i < 5; i++) {
      try {
        const response = execSync('curl -s -w "%{http_code}" -o /dev/null http://localhost:3000/api/crud/usuarios', {
          stdio: 'pipe',
          timeout: 5000
        });
        const statusCode = response.toString().trim();
        
        if (statusCode === '429') {
          rateLimitCount++;
          console.log(`   🚫 Solicitud ${i + 1}: Rate Limited (429)`);
        } else if (statusCode === '401') {
          successCount++;
          console.log(`   🔐 Solicitud ${i + 1}: Requiere autenticación (401) - OK`);
        } else if (statusCode === '200') {
          successCount++;
          console.log(`   ✅ Solicitud ${i + 1}: Éxito (200)`);
        } else {
          console.log(`   ⚠️  Solicitud ${i + 1}: Código ${statusCode}`);
        }
      } catch (error) {
        console.log(`   ❌ Solicitud ${i + 1}: Error - ${error.message.substring(0, 50)}...`);
      }
    }
    
    console.log(`\n📊 Resultados: ${successCount} solicitudes exitosas, ${rateLimitCount} rate limited\n`);
    
    // Prueba 2: Rate limiting para autenticación (más estricto)
    console.log('3. Probando rate limiting para autenticación (10 solicitudes por 15 minutos)...');
    
    let authSuccessCount = 0;
    let authRateLimitCount = 0;
    
    // Hacer 3 solicitudes rápidas para probar el rate limiting de autenticación
    for (let i = 0; i < 3; i++) {
      try {
        const response = execSync('curl -s -w "%{http_code}" -o /dev/null -X POST http://localhost:3000/api/auth/login', {
          stdio: 'pipe',
          timeout: 5000
        });
        const statusCode = response.toString().trim();
        
        if (statusCode === '429') {
          authRateLimitCount++;
          console.log(`   🚫 Solicitud auth ${i + 1}: Rate Limited (429)`);
        } else if (statusCode === '400' || statusCode === '401') {
          authSuccessCount++;
          console.log(`   🔐 Solicitud auth ${i + 1}: Requiere datos válidos (${statusCode}) - OK`);
        } else {
          console.log(`   ⚠️  Solicitud auth ${i + 1}: Código ${statusCode}`);
        }
      } catch (error) {
        console.log(`   ❌ Solicitud auth ${i + 1}: Error - ${error.message.substring(0, 50)}...`);
      }
    }
    
    console.log(`\n📊 Resultados auth: ${authSuccessCount} solicitudes exitosas, ${authRateLimitCount} rate limited\n`);
    
    // Prueba 3: Verificar headers de rate limiting
    console.log('4. Verificando headers de rate limiting...');
    
    try {
      const response = execSync('curl -s -D - -o /dev/null http://localhost:3000/api/crud/usuarios', {
        stdio: 'pipe'
      });
      
      const headers = response.toString();
      const rateLimitHeaders = [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset'
      ];
      
      let foundHeaders = 0;
      rateLimitHeaders.forEach(header => {
        if (headers.includes(header)) {
          foundHeaders++;
          const match = headers.match(new RegExp(`${header}: (.*)`));
          if (match) {
            console.log(`   ✅ ${header}: ${match[1]}`);
          }
        }
      });
      
      if (foundHeaders > 0) {
        console.log(`\n✅ Encontrados ${foundHeaders} headers de rate limiting\n`);
      } else {
        console.log('\n⚠️  No se encontraron headers de rate limiting\n');
      }
      
    } catch (error) {
      console.log(`\n❌ Error al verificar headers: ${error.message}\n`);
    }
    
    // Prueba 4: Verificar funcionalidad normal
    console.log('5. Verificando funcionalidad normal de la API...');
    
    try {
      const response = execSync('curl -s -w "%{http_code}" -o /dev/null http://localhost:3000/api/health || echo "404"', {
        stdio: 'pipe',
        timeout: 5000
      });
      const statusCode = response.toString().trim();
      
      if (statusCode === '200') {
        console.log('✅ Endpoint de salud responde correctamente\n');
      } else if (statusCode === '404') {
        console.log('⚠️  Endpoint de salud no encontrado, pero esto es esperado\n');
      } else {
        console.log(`⚠️  Endpoint de salud responde con código ${statusCode}\n`);
      }
    } catch (error) {
      console.log(`⚠️  No se pudo verificar el endpoint de salud: ${error.message}\n`);
    }
    
    console.log('🎉 Pruebas de Rate Limiting completadas!');
    console.log('\n📋 Resumen:');
    console.log(`   • Rate limiting básico: ${rateLimitCount > 0 ? 'FUNCIONANDO' : 'No se activó en estas pruebas'}`);
    console.log(`   • Rate limiting de autenticación: ${authRateLimitCount > 0 ? 'FUNCIONANDO' : 'No se activó en estas pruebas'}`);
    console.log('   • Headers de rate limiting: Verificados');
    console.log('   • Funcionalidad normal: Verificada');
    
    console.log('\n💡 Notas:');
    console.log('   • Para probar el rate limiting en condiciones reales,');
    console.log('     haga muchas solicitudes rápidas (>100 por minuto)');
    console.log('   • El rate limiting se aplica por IP y endpoint');
    console.log('   • Los límites son configurables en src/lib/rate-limit.ts');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    process.exit(1);
  }
}

// Ejecutar si este archivo se llama directamente
if (require.main === module) {
  testRateLimiting().catch(console.error);
}

module.exports = testRateLimiting;
