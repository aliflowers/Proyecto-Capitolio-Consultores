import { testConnection, query } from './db';

async function testDatabase() {
  console.log('Probando conexión a la base de datos...');
  
  // Probar conexión
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('No se pudo conectar a la base de datos');
    process.exit(1);
  }
  
  console.log('Conexión establecida correctamente');
  
  // Probar consulta básica
  try {
    const result = await query('SELECT COUNT(*) as count FROM users');
    console.log('Consulta exitosa:', result.rows[0]);
  } catch (error) {
    console.error('Error en consulta:', error);
  }
  
  // Probar consulta a perfiles
  try {
    const result = await query('SELECT COUNT(*) as count FROM profiles');
    console.log('Perfiles encontrados:', result.rows[0]);
  } catch (error) {
    console.error('Error en consulta de perfiles:', error);
  }
  
  // Probar consulta a documentos
  try {
    const result = await query('SELECT COUNT(*) as count FROM documentos');
    console.log('Documentos encontrados:', result.rows[0]);
  } catch (error) {
    console.error('Error en consulta de documentos:', error);
  }
  
  console.log('Pruebas completadas');
}

// Ejecutar las pruebas si este archivo se ejecuta directamente
if (require.main === module) {
  testDatabase().catch(console.error);
}

export default testDatabase;
