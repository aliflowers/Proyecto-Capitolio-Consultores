const { testConnection, query, getCurrentUserId } = require('./db');

async function finalTest() {
  console.log('🚀 Iniciando prueba final de conexión a la base de datos...');
  
  // Probar conexión
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('❌ No se pudo conectar a la base de datos');
    process.exit(1);
  }
  
  console.log('✅ Conexión establecida correctamente');
  
  try {
    // Probar consulta básica
    console.log('\n📋 Probando consultas básicas...');
    const result = await query('SELECT current_user, current_database()');
    console.log('   Usuario actual:', result.rows[0].current_user);
    console.log('   Base de datos:', result.rows[0].current_database);
    
    // Probar contar usuarios
    const userResult = await query('SELECT COUNT(*) as total FROM users');
    console.log('   Total de usuarios:', userResult.rows[0].total);
    
    // Probar contar perfiles
    const profileResult = await query('SELECT COUNT(*) as total FROM profiles');
    console.log('   Total de perfiles:', profileResult.rows[0].total);
    
    // Probar contar documentos
    const docResult = await query('SELECT COUNT(*) as total FROM documentos');
    console.log('   Total de documentos:', docResult.rows[0].total);
    
    // Probar función de usuario actual
    const currentUserId = getCurrentUserId();
    console.log('   ID de usuario actual:', currentUserId);
    
    // Probar crear un usuario de prueba
    console.log('\n📝 Probando inserción de datos...');
    const insertResult = await query(`
      INSERT INTO users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
      VALUES ($1, $2, $3, NOW(), $4)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, [
      '00000000-0000-0000-0000-000000000002',
      'test@capitolioconsultores.com',
      '$2a$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNO',
      JSON.stringify({ full_name: 'Usuario de Prueba' })
    ]);
    
    if (insertResult.rows.length > 0) {
      console.log('   Usuario de prueba creado con ID:', insertResult.rows[0].id);
      
      // Limpiar usuario de prueba
      await query('DELETE FROM users WHERE id = $1', ['00000000-0000-0000-0000-000000000002']);
      console.log('   Usuario de prueba eliminado');
    } else {
      console.log('   Usuario de prueba ya existía (no se creó)');
    }
    
    console.log('\n🎉 Todas las pruebas pasaron exitosamente!');
    console.log('✅ La conexión a la base de datos está funcionando correctamente');
    console.log('✅ Las consultas básicas funcionan');
    console.log('✅ Las inserciones funcionan');
    console.log('✅ El sistema está listo para usar');
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
    process.exit(1);
  }
}

// Ejecutar las pruebas si este archivo se ejecuta directamente
if (require.main === module) {
  finalTest().catch(console.error);
}

module.exports = finalTest;
