// Script de prueba para el flujo SSO con Rocket.Chat
// Este script prueba el flujo completo de autenticación

const fetch = require('node-fetch');

// Configuración
const APP_URL = 'http://localhost:3000';
const RC_URL = process.env.RC_URL || 'http://localhost:4000';
const RC_ADMIN_ID = process.env.RC_ADMIN_ID;
const RC_ADMIN_TOKEN = process.env.RC_ADMIN_TOKEN;

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

function logStep(step, message) {
  log(`[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(key, value) {
  console.log(`   ${colors.blue}${key}:${colors.reset} ${value}`);
}

// Función para probar la API de Rocket.Chat directamente
async function testRocketChatAPI() {
  logSection('PRUEBA 1: Conexión directa con Rocket.Chat API');
  
  logStep('1.1', 'Verificando variables de entorno');
  logInfo('RC_URL', RC_URL);
  logInfo('RC_ADMIN_ID', RC_ADMIN_ID ? '✓ Configurado' : '✗ No configurado');
  logInfo('RC_ADMIN_TOKEN', RC_ADMIN_TOKEN ? '✓ Configurado' : '✗ No configurado');
  
  if (!RC_ADMIN_ID || !RC_ADMIN_TOKEN) {
    logError('Faltan credenciales de administrador de Rocket.Chat');
    return false;
  }
  
  try {
    logStep('1.2', 'Probando endpoint /api/v1/me');
    const meResponse = await fetch(`${RC_URL}/api/v1/me`, {
      headers: {
        'X-User-Id': RC_ADMIN_ID,
        'X-Auth-Token': RC_ADMIN_TOKEN,
      },
    });
    
    const meData = await meResponse.json();
    
    if (meResponse.ok && meData.success) {
      logSuccess('Autenticación exitosa con Rocket.Chat');
      logInfo('Usuario', meData.username || meData.name);
      logInfo('ID', meData._id);
      logInfo('Roles', JSON.stringify(meData.roles || []));
      return true;
    } else {
      logError('Fallo en autenticación con Rocket.Chat');
      logInfo('Status', meResponse.status);
      logInfo('Error', meData.error || 'Sin mensaje de error');
      return false;
    }
  } catch (error) {
    logError(`Error al conectar con Rocket.Chat: ${error.message}`);
    return false;
  }
}

// Función para probar la creación de tokens
async function testTokenCreation() {
  logSection('PRUEBA 2: Capacidad de crear tokens de usuario');
  
  try {
    // Primero, obtener información del usuario admin
    logStep('2.1', 'Obteniendo información del usuario admin');
    const meResponse = await fetch(`${RC_URL}/api/v1/me`, {
      headers: {
        'X-User-Id': RC_ADMIN_ID,
        'X-Auth-Token': RC_ADMIN_TOKEN,
      },
    });
    
    const meData = await meResponse.json();
    
    if (!meResponse.ok) {
      logError('No se pudo obtener información del usuario admin');
      return false;
    }
    
    const adminUserId = meData._id;
    logInfo('Admin User ID', adminUserId);
    
    // Intentar crear un token para el mismo usuario admin
    logStep('2.2', 'Intentando crear token para el usuario admin');
    const tokenResponse = await fetch(`${RC_URL}/api/v1/users.createToken`, {
      method: 'POST',
      headers: {
        'X-User-Id': RC_ADMIN_ID,
        'X-Auth-Token': RC_ADMIN_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: adminUserId }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenResponse.ok && tokenData.success) {
      logSuccess('Token creado exitosamente');
      logInfo('Auth Token', tokenData.data.authToken ? '✓ Recibido' : '✗ No recibido');
      logInfo('User ID', tokenData.data.userId);
      return true;
    } else {
      logError('No se pudo crear el token');
      logInfo('Status', tokenResponse.status);
      logInfo('Error', tokenData.error || 'Sin mensaje de error');
      logInfo('Error Type', tokenData.errorType || 'Desconocido');
      
      if (tokenResponse.status === 400 || tokenResponse.status === 403) {
        logWarning('El usuario/token no tiene permisos suficientes');
        logWarning('Necesitas un token con permisos de administrador');
      }
      return false;
    }
  } catch (error) {
    logError(`Error durante la prueba de creación de tokens: ${error.message}`);
    return false;
  }
}

// Función para probar permisos del usuario
async function testUserPermissions() {
  logSection('PRUEBA 3: Verificación de permisos del usuario');
  
  try {
    logStep('3.1', 'Obteniendo permisos del usuario actual');
    const permissionsResponse = await fetch(`${RC_URL}/api/v1/permissions.listAll`, {
      headers: {
        'X-User-Id': RC_ADMIN_ID,
        'X-Auth-Token': RC_ADMIN_TOKEN,
      },
    });
    
    const permissionsData = await permissionsResponse.json();
    
    if (permissionsResponse.ok) {
      logSuccess('Permisos obtenidos');
      
      // Buscar permisos relevantes
      const relevantPermissions = [
        'create-personal-access-tokens',
        'create-user',
        'edit-other-user-info',
        'edit-other-user-password',
      ];
      
      logStep('3.2', 'Permisos relevantes para SSO:');
      relevantPermissions.forEach(perm => {
        const hasPermission = permissionsData.permissions?.some(p => p._id === perm);
        if (hasPermission) {
          logSuccess(`  ${perm}`);
        } else {
          logWarning(`  ${perm} - No encontrado`);
        }
      });
    } else {
      logWarning('No se pudieron obtener los permisos');
      logInfo('Nota', 'Esto podría indicar permisos insuficientes');
    }
  } catch (error) {
    logError(`Error al verificar permisos: ${error.message}`);
  }
}

// Función para probar el endpoint SSO de la aplicación
async function testAppSSOEndpoint() {
  logSection('PRUEBA 4: Endpoint SSO de la aplicación');
  
  try {
    logStep('4.1', 'Llamando al endpoint /api/rc/sso');
    
    // Simular una petición al endpoint SSO
    // Nota: Esto fallará si no hay una sesión válida
    const ssoResponse = await fetch(`${APP_URL}/api/rc/sso`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const ssoData = await ssoResponse.json();
    
    if (ssoResponse.ok) {
      logSuccess('Endpoint SSO respondió exitosamente');
      logInfo('Login Token', ssoData.loginToken ? '✓ Recibido' : '✗ No recibido');
    } else {
      if (ssoResponse.status === 401 || ssoResponse.status === 403) {
        logWarning('No hay sesión activa (esperado en esta prueba)');
      } else {
        logError('Error en endpoint SSO');
        logInfo('Status', ssoResponse.status);
        logInfo('Error', ssoData.error || 'Sin mensaje');
      }
    }
  } catch (error) {
    logError(`Error al probar endpoint SSO: ${error.message}`);
  }
}

// Función principal
async function runTests() {
  console.clear();
  log('\n🔍 SISTEMA DE DIAGNÓSTICO SSO - ROCKET.CHAT\n', 'bright');
  log(`Timestamp: ${new Date().toISOString()}`, 'blue');
  
  // Cargar variables de entorno
  require('dotenv').config({ path: '.env.local' });
  
  // Ejecutar pruebas
  const test1 = await testRocketChatAPI();
  const test2 = await testTokenCreation();
  await testUserPermissions();
  await testAppSSOEndpoint();
  
  // Resumen
  logSection('RESUMEN DEL DIAGNÓSTICO');
  
  if (test1 && test2) {
    logSuccess('✅ El sistema SSO está correctamente configurado');
    log('\nTodo indica que el PAT tiene los permisos necesarios.', 'green');
  } else if (test1 && !test2) {
    logError('❌ PROBLEMA IDENTIFICADO: Permisos insuficientes del PAT');
    log('\nSOLUCIÓN RECOMENDADA:', 'yellow');
    log('1. Accede a Rocket.Chat como administrador', 'yellow');
    log('2. Ve a tu perfil > My Account > Personal Access Tokens', 'yellow');
    log('3. Crea un nuevo token con el rol "admin"', 'yellow');
    log('4. Asegúrate de que el usuario tenga rol de administrador', 'yellow');
    log('5. Actualiza .env.local con el nuevo token', 'yellow');
  } else {
    logError('❌ PROBLEMA CRÍTICO: No se puede conectar con Rocket.Chat');
    log('\nVERIFICA:', 'yellow');
    log('1. Que Rocket.Chat esté corriendo en el puerto 4000', 'yellow');
    log('2. Que las variables RC_ADMIN_ID y RC_ADMIN_TOKEN sean correctas', 'yellow');
    log('3. Que el token no haya expirado o sido revocado', 'yellow');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

// Ejecutar las pruebas
runTests().catch(error => {
  logError(`Error fatal: ${error.message}`);
  process.exit(1);
});
