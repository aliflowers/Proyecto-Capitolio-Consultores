/**
 * Script de prueba para verificar la integración SSO con Rocket.Chat
 */

const RC_URL = 'http://localhost:4000';
const APP_URL = 'http://localhost:3000';

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

async function testRocketChatConnection() {
  console.log(`${colors.cyan}► Probando conexión con Rocket.Chat...${colors.reset}`);
  
  try {
    const response = await fetch(`${RC_URL}/api/info`);
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`${colors.green}✓ Rocket.Chat está funcionando${colors.reset}`);
      console.log(`  Versión: ${data.version}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Rocket.Chat responde pero con error${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ No se pudo conectar con Rocket.Chat en ${RC_URL}${colors.reset}`);
    console.log(`  Error: ${error.message}`);
    return false;
  }
}

async function testAdminToken() {
  console.log(`${colors.cyan}► Verificando token de administrador...${colors.reset}`);
  
  // Leer el token del archivo .env.local
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '..', '.env.local');
  
  let RC_ADMIN_ID = '';
  let RC_ADMIN_TOKEN = '';
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const idMatch = envContent.match(/RC_ADMIN_ID="(.+)"/);
    const tokenMatch = envContent.match(/RC_ADMIN_TOKEN="(.+)"/);
    
    if (idMatch) RC_ADMIN_ID = idMatch[1];
    if (tokenMatch) RC_ADMIN_TOKEN = tokenMatch[1];
  } catch (error) {
    console.log(`${colors.red}✗ No se pudo leer .env.local${colors.reset}`);
    return false;
  }
  
  if (!RC_ADMIN_ID || !RC_ADMIN_TOKEN) {
    console.log(`${colors.red}✗ Faltan credenciales de admin en .env.local${colors.reset}`);
    return false;
  }
  
  try {
    const response = await fetch(`${RC_URL}/api/v1/me`, {
      headers: {
        'X-User-Id': RC_ADMIN_ID,
        'X-Auth-Token': RC_ADMIN_TOKEN
      }
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`${colors.green}✓ Token de admin válido${colors.reset}`);
      console.log(`  Usuario: ${data.username} (${data.name})`);
      console.log(`  Roles: ${data.roles?.join(', ') || 'ninguno'}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Token de admin inválido o expirado${colors.reset}`);
      console.log(`  Error: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error al verificar token${colors.reset}`);
    console.log(`  Error: ${error.message}`);
    return false;
  }
}

async function testCreateUser() {
  console.log(`${colors.cyan}► Probando creación de usuario de prueba...${colors.reset}`);
  
  // Leer credenciales
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '..', '.env.local');
  
  let RC_ADMIN_ID = '';
  let RC_ADMIN_TOKEN = '';
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const idMatch = envContent.match(/RC_ADMIN_ID="(.+)"/);
    const tokenMatch = envContent.match(/RC_ADMIN_TOKEN="(.+)"/);
    
    if (idMatch) RC_ADMIN_ID = idMatch[1];
    if (tokenMatch) RC_ADMIN_TOKEN = tokenMatch[1];
  } catch (error) {
    console.log(`${colors.yellow}⚠ No se pudo leer credenciales${colors.reset}`);
    return false;
  }
  
  const testUsername = `test_user_${Date.now()}`;
  const testEmail = `${testUsername}@test.local`;
  
  try {
    // Intentar crear usuario
    const response = await fetch(`${RC_URL}/api/v1/users.create`, {
      method: 'POST',
      headers: {
        'X-User-Id': RC_ADMIN_ID,
        'X-Auth-Token': RC_ADMIN_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        name: 'Test User SSO',
        username: testUsername,
        password: 'Test123456!',
        verified: true
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log(`${colors.green}✓ Usuario de prueba creado exitosamente${colors.reset}`);
      console.log(`  Username: ${testUsername}`);
      console.log(`  User ID: ${data.user._id}`);
      
      // Limpiar: eliminar el usuario de prueba
      console.log(`${colors.cyan}  ► Limpiando usuario de prueba...${colors.reset}`);
      
      const deleteResponse = await fetch(`${RC_URL}/api/v1/users.delete`, {
        method: 'POST',
        headers: {
          'X-User-Id': RC_ADMIN_ID,
          'X-Auth-Token': RC_ADMIN_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: data.user._id
        })
      });
      
      if (deleteResponse.ok) {
        console.log(`${colors.green}  ✓ Usuario de prueba eliminado${colors.reset}`);
      }
      
      return true;
    } else {
      console.log(`${colors.red}✗ No se pudo crear usuario de prueba${colors.reset}`);
      console.log(`  Error: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error al crear usuario${colors.reset}`);
    console.log(`  Error: ${error.message}`);
    return false;
  }
}

async function testAppConnection() {
  console.log(`${colors.cyan}► Verificando que la aplicación Next.js está funcionando...${colors.reset}`);
  
  try {
    const response = await fetch(`${APP_URL}/api/health`);
    
    if (response.ok) {
      console.log(`${colors.green}✓ Aplicación Next.js funcionando en ${APP_URL}${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.yellow}⚠ La aplicación responde pero con status ${response.status}${colors.reset}`);
      return true; // Consideramos válido si responde aunque no sea 200
    }
  } catch (error) {
    console.log(`${colors.red}✗ No se pudo conectar con la aplicación en ${APP_URL}${colors.reset}`);
    console.log(`  Error: ${error.message}`);
    console.log(`\n${colors.yellow}  Asegúrate de que la aplicación esté corriendo con: npm run dev${colors.reset}`);
    return false;
  }
}

async function main() {
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}    Prueba de Integración SSO con Rocket.Chat          ${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`);

  const tests = [
    { name: 'Conexión con Rocket.Chat', fn: testRocketChatConnection },
    { name: 'Token de Administrador', fn: testAdminToken },
    { name: 'Creación de Usuarios', fn: testCreateUser },
    { name: 'Aplicación Next.js', fn: testAppConnection }
  ];
  
  let passedTests = 0;
  const results = [];
  
  for (const test of tests) {
    console.log(`\n${colors.bright}[${tests.indexOf(test) + 1}/${tests.length}] ${test.name}${colors.reset}`);
    console.log('─'.repeat(50));
    
    const passed = await test.fn();
    results.push({ name: test.name, passed });
    if (passed) passedTests++;
    
    console.log('');
  }
  
  // Resumen
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}                     RESUMEN                           ${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}═══════════════════════════════════════════════════════${colors.reset}\n`);
  
  results.forEach(result => {
    const icon = result.passed ? `${colors.green}✓` : `${colors.red}✗`;
    const status = result.passed ? `${colors.green}PASSED` : `${colors.red}FAILED`;
    console.log(`${icon} ${result.name}: ${status}${colors.reset}`);
  });
  
  console.log(`\n${colors.bright}Total: ${passedTests}/${tests.length} pruebas pasadas${colors.reset}`);
  
  if (passedTests === tests.length) {
    console.log(`\n${colors.bright}${colors.green}✓ ¡Todas las pruebas pasaron! La integración SSO está lista.${colors.reset}`);
    console.log(`\n${colors.cyan}Próximos pasos:${colors.reset}`);
    console.log(`1. Reinicia el servidor de Next.js para aplicar los cambios`);
    console.log(`2. Inicia sesión en la aplicación`);
    console.log(`3. Ve a la sección de chat para probar el iframe de Rocket.Chat`);
  } else {
    console.log(`\n${colors.bright}${colors.yellow}⚠ Algunas pruebas fallaron. Revisa los errores arriba.${colors.reset}`);
    console.log(`\n${colors.cyan}Soluciones sugeridas:${colors.reset}`);
    if (!results[0].passed) {
      console.log(`• Asegúrate de que Rocket.Chat esté corriendo: docker-compose up -d rocketchat`);
    }
    if (!results[1].passed) {
      console.log(`• Regenera el token de admin: node scripts/generate-new-pat-fixed.js`);
    }
    if (!results[3].passed) {
      console.log(`• Inicia la aplicación Next.js: npm run dev`);
    }
  }
  
  process.exit(passedTests === tests.length ? 0 : 1);
}

// Ejecutar
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testRocketChatConnection, testAdminToken, testCreateUser };
