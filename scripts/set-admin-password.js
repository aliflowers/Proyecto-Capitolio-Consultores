const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.development' });

// Configuración de la base de datos desde variables de entorno
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function updateUserPassword(email, newPassword) {
  if (!email || !newPassword) {
    console.error('Error: Debes proporcionar un email y una nueva contraseña.');
    console.log('Uso: node scripts/set-admin-password.js <email> <nueva_contraseña>');
    return;
  }

  try {
    console.log(`Iniciando actualización de contraseña para el usuario: ${email}...`);

    // Generar el hash de la nueva contraseña
    const saltRounds = 10;
    console.log('Generando hash de la contraseña...');
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    console.log('Hash generado exitosamente.');

    // Conectar a la base de datos
    const client = await pool.connect();
    console.log('Conectado a la base de datos.');

    // Actualizar la contraseña en la tabla de usuarios
    const result = await client.query(
      'UPDATE users SET encrypted_password = $1 WHERE email = $2',
      [hashedPassword, email]
    );

    // Liberar el cliente
    client.release();
    console.log('Conexión a la base de datos cerrada.');

    // Verificar si se actualizó algún registro
    if (result.rowCount > 0) {
      console.log(`\n¡Éxito! La contraseña para ${email} ha sido actualizada.`);
      console.log('Ahora puedes iniciar sesión con tu nueva contraseña.');
    } else {
      console.error(`\nError: No se encontró ningún usuario con el email "${email}".`);
    }
  } catch (error) {
    console.error('\nOcurrió un error durante el proceso:', error);
  } finally {
    // Cerrar el pool de conexiones
    await pool.end();
  }
}

// Obtener argumentos de la línea de comandos
const email = process.argv[2];
const newPassword = process.argv[3];

// Ejecutar la función
updateUserPassword(email, newPassword);
