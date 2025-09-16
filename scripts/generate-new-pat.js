// Script para generar un nuevo Personal Access Token con permisos completos
// Este script usa las credenciales de usuario/contraseña para crear un PAT válido

const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const RC_URL = process.env.RC_URL || 'http://localhost:4000';
const RC_ADMIN_USERNAME = process.env.RC_ADMIN_USERNAME || 'admin';
const RC_ADMIN_PASSWORD = process.env.RC_ADMIN_PASSWORD || 'NexusDev123!';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function generateNewPAT() {
  console.clear();
  log('\n🔐 GENERADOR DE PERSONAL ACCESS TOKEN PARA ROCKET.CHAT\n', 'bright');
  log(`Timestamp: ${new Date().toISOString()}\n`, 'blue');
  
  try {
    // Paso 1: Login con usuario y contraseña
    log('Paso 1: Autenticando con usuario y contraseña...', 'cyan');
    log(`Usuario: ${RC_ADMIN_USERNAME}`, 'blue');
    
    const loginResponse = await fetch(`${RC_URL}/api/v1/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: RC_ADMIN_USERNAME,
        password: RC_ADMIN_PASSWORD,
      }),
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok || loginData.status === 'error') {
      log('❌ Error al autenticar', 'red');
      log(`Mensaje: ${loginData.message || loginData.error}`, 'red');
      
      if (loginData.error === 'totp-required' || loginData.errorType === 'totp-required') {
        log('\n⚠️  Se requiere autenticación de dos factores (2FA)', 'yellow');
        log('Por favor, desactiva temporalmente 2FA para generar el token', 'yellow');
      }
      
      return;
    }
    
    log('✅ Autenticación exitosa', 'green');
    
    const userId = loginData.data.userId;
    const authToken = loginData.data.authToken;
    
    log(`User ID: ${userId}`, 'blue');
    log(`Auth Token temporal recibido`, 'blue');
    
    // Paso 2: Obtener información del usuario
    log('\nPaso 2: Obteniendo información del usuario...', 'cyan');
    
    const meResponse = await fetch(`${RC_URL}/api/v1/me`, {
      headers: {
        'X-User-Id': userId,
        'X-Auth-Token': authToken,
      },
    });
    
    const meData = await meResponse.json();
    
    if (!meResponse.ok) {
      log('❌ Error al obtener información del usuario', 'red');
      return;
    }
    
    log('✅ Información del usuario obtenida', 'green');
    log(`Username: ${meData.username}`, 'blue');
    log(`Email: ${meData.emails?.[0]?.address || 'N/A'}`, 'blue');
    log(`Roles: ${JSON.stringify(meData.roles || [])}`, 'blue');
    
    // Verificar si el usuario es admin
    const isAdmin = meData.roles?.includes('admin');
    if (!isAdmin) {
      log('\n⚠️  ADVERTENCIA: El usuario no tiene rol de administrador', 'yellow');
      log('Es posible que el PAT no tenga todos los permisos necesarios', 'yellow');
    }
    
    // Paso 3: Crear el Personal Access Token
    log('\nPaso 3: Creando Personal Access Token...', 'cyan');
    
    const tokenName = `SSO_Token_${Date.now()}`;
    
    const createTokenResponse = await fetch(`${RC_URL}/api/v1/users.generatePersonalAccessToken`, {
      method: 'POST',
      headers: {
        'X-User-Id': userId,
        'X-Auth-Token': authToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenName: tokenName,
        bypassTwoFactor: true,
      }),
    });
    
    const tokenData = await createTokenResponse.json();
    
    if (!createTokenResponse.ok || !tokenData.success) {
      log('❌ Error al crear el Personal Access Token', 'red');
      log(`Mensaje: ${tokenData.error || 'Error desconocido'}`, 'red');
      
      // Si falla, intentar con el endpoint alternativo
      log('\nIntentando método alternativo...', 'yellow');
      
      const altTokenResponse = await fetch(`${RC_URL}/api/v1/users.createToken`, {
        method: 'POST',
        headers: {
          'X-User-Id': userId,
          'X-Auth-Token': authToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
        }),
      });
      
      const altTokenData = await altTokenResponse.json();
      
      if (altTokenResponse.ok && altTokenData.success) {
        log('✅ Token creado con método alternativo', 'green');
        
        log('\n' + '='.repeat(60), 'cyan');
        log('🎉 NUEVO PERSONAL ACCESS TOKEN GENERADO', 'bright');
        log('='.repeat(60), 'cyan');
        
        log('\nActualiza tu archivo .env.local con estos valores:\n', 'yellow');
        log(`RC_ADMIN_ID="${userId}"`, 'green');
        log(`RC_ADMIN_TOKEN="${altTokenData.data.authToken}"`, 'green');
        
        log('\n⚠️  IMPORTANTE:', 'yellow');
        log('1. Copia estos valores y actualiza tu .env.local', 'yellow');
        log('2. Reinicia el servidor de Next.js después de actualizar', 'yellow');
        log('3. Este token tiene validez indefinida hasta que lo revoques', 'yellow');
      } else {
        log('❌ No se pudo crear el token con ningún método', 'red');
        log('Puede ser necesario crear el token manualmente desde la interfaz web', 'yellow');
      }
      
      return;
    }
    
    log('✅ Personal Access Token creado exitosamente', 'green');
    
    // Debug: Ver la estructura completa de la respuesta
    console.log('\nRespuesta completa del token:', JSON.stringify(tokenData, null, 2));
    
    // Determinar el token correcto
    const newToken = tokenData.data?.token || tokenData.token || tokenData.data?.authToken;
    
    if (!newToken) {
      log('\n⚠️  La estructura de respuesta es inesperada', 'yellow');
      log('Por favor, revisa la respuesta completa arriba', 'yellow');
      return;
    }
    
    // Mostrar los resultados
    log('\n' + '='.repeat(60), 'cyan');
    log('🎉 NUEVO PERSONAL ACCESS TOKEN GENERADO', 'bright');
    log('='.repeat(60), 'cyan');
    
    log('\nActualiza tu archivo .env.local con estos valores:\n', 'yellow');
    log(`RC_ADMIN_ID="${userId}"`, 'green');
    log(`RC_ADMIN_TOKEN="${newToken}"`, 'green');
    
    log('\n⚠️  IMPORTANTE:', 'yellow');
    log('1. Copia estos valores y actualiza tu .env.local', 'yellow');
    log('2. Reinicia el servidor de Next.js después de actualizar', 'yellow');
    log('3. Este token tiene validez indefinida hasta que lo revoques', 'yellow');
    
    // Paso 4: Verificar el nuevo token
    log('\nPaso 4: Verificando el nuevo token...', 'cyan');
    
    const verifyResponse = await fetch(`${RC_URL}/api/v1/me`, {
      headers: {
        'X-User-Id': userId,
        'X-Auth-Token': newToken,
      },
    });
    
    if (verifyResponse.ok) {
      log('✅ Token verificado y funcionando correctamente', 'green');
    } else {
      log('⚠️  No se pudo verificar el token, pero puede estar funcionando', 'yellow');
    }
    
  } catch (error) {
    log(`\n❌ Error fatal: ${error.message}`, 'red');
    console.error(error);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

// Ejecutar el generador
generateNewPAT();
