/**
 * Script para generar un nuevo Personal Access Token (PAT) en Rocket.Chat
 * con todos los permisos necesarios para la integración SSO
 */

const RC_URL = 'http://localhost:4000';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'NexusDev123!';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login() {
  console.log(`${colors.cyan}► Haciendo login como admin...${colors.reset}`);
  
  const response = await fetch(`${RC_URL}/api/v1/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    }),
  });

  const data = await response.json();
  
  if (!response.ok || data.status === 'error') {
    throw new Error(`Login falló: ${data.error || data.message || response.statusText}`);
  }

  console.log(`${colors.green}✓ Login exitoso${colors.reset}`);
  return {
    userId: data.data.userId,
    authToken: data.data.authToken
  };
}

async function deleteOldTokens(userId, authToken) {
  console.log(`${colors.cyan}► Buscando tokens existentes...${colors.reset}`);
  
  // Obtener lista de tokens existentes
  const listResponse = await fetch(`${RC_URL}/api/v1/users.getPersonalAccessTokens`, {
    method: 'GET',
    headers: {
      'X-User-Id': userId,
      'X-Auth-Token': authToken,
      'Content-Type': 'application/json',
    },
  });

  if (listResponse.ok) {
    const listData = await listResponse.json();
    if (listData.tokens && listData.tokens.length > 0) {
      console.log(`${colors.yellow}► Encontrados ${listData.tokens.length} tokens existentes${colors.reset}`);
      
      for (const token of listData.tokens) {
        if (token.name === 'SSO Integration Token' || token.name === 'API Access Token') {
          console.log(`  ► Eliminando token: ${token.name}`);
          
          const deleteResponse = await fetch(`${RC_URL}/api/v1/users.removePersonalAccessToken`, {
            method: 'POST',
            headers: {
              'X-User-Id': userId,
              'X-Auth-Token': authToken,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tokenName: token.name
            }),
          });
          
          if (deleteResponse.ok) {
            console.log(`  ${colors.green}✓ Token eliminado: ${token.name}${colors.reset}`);
          } else {
            console.log(`  ${colors.yellow}⚠ No se pudo eliminar: ${token.name}${colors.reset}`);
          }
        }
      }
    } else {
      console.log(`${colors.cyan}► No hay tokens existentes${colors.reset}`);
    }
  }
}

async function generateNewPAT(userId, authToken) {
  console.log(`${colors.cyan}► Generando nuevo Personal Access Token...${colors.reset}`);
  
  // Esperar un poco para evitar rate limiting
  await sleep(1000);
  
  const response = await fetch(`${RC_URL}/api/v1/users.generatePersonalAccessToken`, {
    method: 'POST',
    headers: {
      'X-User-Id': userId,
      'X-Auth-Token': authToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tokenName: 'SSO Integration Token',
      bypassTwoFactor: true
    }),
  });

  const data = await response.json();
  
  if (!response.ok || !data.success) {
    // Si falla, intentar con un nombre diferente
    console.log(`${colors.yellow}► Reintentando con nombre alternativo...${colors.reset}`);
    await sleep(2000);
    
    const retryResponse = await fetch(`${RC_URL}/api/v1/users.generatePersonalAccessToken`, {
      method: 'POST',
      headers: {
        'X-User-Id': userId,
        'X-Auth-Token': authToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tokenName: `SSO Token ${new Date().toISOString()}`,
        bypassTwoFactor: true
      }),
    });
    
    const retryData = await retryResponse.json();
    
    if (!retryResponse.ok || !retryData.success) {
      throw new Error(`No se pudo generar PAT: ${retryData.error || retryResponse.statusText}`);
    }
    
    return retryData.token;
  }

  return data.token;
}

async function verifyToken(userId, token) {
  console.log(`${colors.cyan}► Verificando el nuevo token...${colors.reset}`);
  
  const response = await fetch(`${RC_URL}/api/v1/me`, {
    method: 'GET',
    headers: {
      'X-User-Id': userId,
      'X-Auth-Token': token,
    },
  });

  const data = await response.json();
  
  if (!response.ok || !data.success) {
    throw new Error(`Token no válido: ${data.error || response.statusText}`);
  }

  console.log(`${colors.green}✓ Token verificado correctamente${colors.reset}`);
  console.log(`  Usuario: ${data.username} (${data.name})`);
  console.log(`  Roles: ${data.roles?.join(', ') || 'ninguno'}`);
  
  return true;
}

async function updateEnvFile(userId, token) {
  const fs = require('fs').promises;
  const path = require('path');
  
  const envPath = path.join(__dirname, '..', '.env.local');
  
  try {
    let envContent = await fs.readFile(envPath, 'utf8');
    
    // Actualizar RC_ADMIN_ID
    envContent = envContent.replace(
      /RC_ADMIN_ID=.*/,
      `RC_ADMIN_ID="${userId}"`
    );
    
    // Actualizar RC_ADMIN_TOKEN
    envContent = envContent.replace(
      /RC_ADMIN_TOKEN=.*/,
      `RC_ADMIN_TOKEN="${token}"`
    );
    
    // Si no existen, añadirlas al final
    if (!envContent.includes('RC_ADMIN_ID=')) {
      envContent += `\nRC_ADMIN_ID="${userId}"`;
    }
    if (!envContent.includes('RC_ADMIN_TOKEN=')) {
      envContent += `\nRC_ADMIN_TOKEN="${token}"`;
    }
    
    await fs.writeFile(envPath, envContent, 'utf8');
    console.log(`${colors.green}✓ Archivo .env.local actualizado${colors.reset}`);
  } catch (error) {
    console.log(`${colors.yellow}⚠ No se pudo actualizar .env.local automáticamente${colors.reset}`);
    console.log(`  Error: ${error.message}`);
  }
}

async function main() {
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}  Generador de Personal Access Token para Rocket.Chat  ${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`);

  try {
    // 1. Login
    const { userId, authToken } = await login();
    
    // 2. Eliminar tokens antiguos (opcional)
    await deleteOldTokens(userId, authToken);
    
    // 3. Generar nuevo PAT
    const newToken = await generateNewPAT(userId, authToken);
    
    // 4. Verificar el token
    await verifyToken(userId, newToken);
    
    // 5. Actualizar .env.local
    await updateEnvFile(userId, newToken);
    
    // 6. Mostrar resultado
    console.log(`\n${colors.bright}${colors.green}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}${colors.green}                   ¡TOKEN GENERADO!                    ${colors.reset}`);
    console.log(`${colors.bright}${colors.green}═══════════════════════════════════════════════════════${colors.reset}\n`);
    
    console.log(`${colors.bright}Actualiza tu archivo .env.local con estos valores:${colors.reset}\n`);
    console.log(`${colors.cyan}RC_ADMIN_ID="${userId}"${colors.reset}`);
    console.log(`${colors.cyan}RC_ADMIN_TOKEN="${newToken}"${colors.reset}`);
    
    console.log(`\n${colors.yellow}⚠ IMPORTANTE: Este token tiene acceso completo de administrador.${colors.reset}`);
    console.log(`${colors.yellow}  No lo compartas ni lo subas a repositorios públicos.${colors.reset}`);
    
    console.log(`\n${colors.green}✓ Proceso completado exitosamente${colors.reset}`);
    
  } catch (error) {
    console.error(`\n${colors.red}✗ Error: ${error.message}${colors.reset}`);
    console.error(`\n${colors.yellow}Posibles soluciones:${colors.reset}`);
    console.error(`1. Verifica que Rocket.Chat esté corriendo en ${RC_URL}`);
    console.error(`2. Verifica que las credenciales sean correctas`);
    console.error(`3. Espera unos segundos si hay rate limiting`);
    console.error(`4. Reinicia Rocket.Chat si es necesario`);
    process.exit(1);
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { login, generateNewPAT, verifyToken };
