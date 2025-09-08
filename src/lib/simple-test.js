const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  console.log('Probando conexión a PostgreSQL...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Conexión establecida correctamente');
    
    // Probar una consulta simple
    const res = await client.query('SELECT NOW() as hora_actual');
    console.log('✅ Consulta exitosa:', res.rows[0].hora_actual);
    
    // Probar contar usuarios
    const userRes = await client.query('SELECT COUNT(*) as total FROM users');
    console.log('👥 Usuarios en la base de datos:', userRes.rows[0].total);
    
    // Probar contar perfiles
    const profileRes = await client.query('SELECT COUNT(*) as total FROM profiles');
    console.log('👤 Perfiles en la base de datos:', profileRes.rows[0].total);
    
    // Probar contar documentos
    const docRes = await client.query('SELECT COUNT(*) as total FROM documentos');
    console.log('📄 Documentos en la base de datos:', docRes.rows[0].total);
    
    await client.end();
    console.log('✅ Prueba completada exitosamente');
    
  } catch (err) {
    console.error('❌ Error en la conexión:', err.message);
    if (client) {
      await client.end();
    }
    process.exit(1);
  }
}

testConnection();
