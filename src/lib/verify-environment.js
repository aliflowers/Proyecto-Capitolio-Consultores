const { testConnection, query } = require('./db');

async function verifyEnvironment() {
  console.log('🔍 Verificando entorno de desarrollo local...\n');
  
  try {
    // Verificar conexión a la base de datos
    console.log('1. Verificando conexión a PostgreSQL...');
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ Error: No se pudo conectar a la base de datos');
      process.exit(1);
    }
    console.log('✅ Conexión establecida correctamente\n');
    
    // Verificar tablas principales
    console.log('2. Verificando estructura de base de datos...');
const tables = [
      'users', 'profiles', 'documentos', 'document_chunks', 
      'expedientes', 'clientes', 'expedientes_clientes', 'expedientes_documentos'
    ];
    
    for (const table of tables) {
      try {
        const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ✅ Tabla ${table}: ${result.rows[0].count} registros`);
      } catch (error) {
        console.error(`   ❌ Tabla ${table}: Error - ${error.message}`);
      }
    }
    console.log('');
    
    // Verificar Super Admin temporal
    console.log('3. Verificando Super Admin temporal...');
    const adminResult = await query(`
      SELECT u.email, u.is_super_admin, u.is_temporary_super_admin, p.full_name, p.role
      FROM users u
      JOIN profiles p ON u.id = p.id
      WHERE u.email = 'aliflores@capitolioconsultores.com'
    `);
    
    if (adminResult.rows.length > 0) {
      const admin = adminResult.rows[0];
      console.log(`   ✅ Usuario: ${admin.email}`);
      console.log(`   ✅ Nombre: ${admin.full_name}`);
      console.log(`   ✅ Rol: ${admin.role}`);
      console.log(`   ✅ Super Admin: ${admin.is_super_admin ? 'Sí' : 'No'}`);
      console.log(`   ✅ Temporal: ${admin.is_temporary_super_admin ? 'Sí' : 'No'}`);
    } else {
      console.log('   ⚠️  Super Admin temporal no encontrado');
    }
    console.log('');
    
    // Verificar extensiones
    console.log('4. Verificando extensiones de PostgreSQL...');
    const extensions = ['vector', 'uuid-ossp', 'pgcrypto'];
    
    for (const extension of extensions) {
      try {
        const result = await query(`SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = '${extension}') as exists`);
        if (result.rows[0].exists) {
          console.log(`   ✅ Extensión ${extension}: Instalada`);
        } else {
          console.log(`   ⚠️  Extensión ${extension}: No instalada`);
        }
      } catch (error) {
        console.error(`   ❌ Extensión ${extension}: Error - ${error.message}`);
      }
    }
    console.log('');
    
    // Verificar variables de entorno
    console.log('5. Verificando variables de entorno...');
    const requiredEnvVars = [
      'DATABASE_URL', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'
    ];
    
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`   ✅ ${envVar}: Configurada`);
      } else {
        console.log(`   ❌ ${envVar}: No configurada`);
      }
    }
    console.log('');
    
    console.log('🎉 Verificación completada exitosamente!');
    console.log('✅ El entorno de desarrollo local está listo para usar');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    process.exit(1);
  }
}

// Ejecutar verificación si este archivo se ejecuta directamente
if (require.main === module) {
  verifyEnvironment().catch(console.error);
}

module.exports = verifyEnvironment;
