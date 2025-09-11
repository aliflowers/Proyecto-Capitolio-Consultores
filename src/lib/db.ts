import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración de la conexión a la base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // O configuración individual:
  // host: process.env.DB_HOST || 'localhost',
  // port: parseInt(process.env.DB_PORT || '5432'),
  // database: process.env.DB_NAME || 'nexus_juridico',
  // user: process.env.DB_USER || 'nexus_admin',
  // password: process.env.DB_PASSWORD,
  // max: 20, // número máximo de conexiones en el pool
  // idleTimeoutMillis: 30000, // tiempo de espera para conexiones inactivas
  // connectionTimeoutMillis: 2000, // tiempo de espera para nuevas conexiones
});

// Función para ejecutar consultas
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Consulta ejecutada', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('Error en consulta', { text, duration, error });
    throw error;
  }
}

// Función para obtener una conexión del pool
export async function getClient() {
  return await pool.connect();
}

// Función para cerrar el pool de conexiones
export async function close() {
  await pool.end();
}

// Exportar el pool para uso directo si es necesario
export { pool };

export type DBClient = PoolClient;

// Ejecuta una función dentro de una transacción configurando
// SET LOCAL app.current_user_id para habilitar RLS real en la BD.
export async function withUserRLS<T>(userId: string, fn: (client: DBClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Establecer variable de sesión para RLS
    await client.query("SET LOCAL app.current_user_id = $1", [userId]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    throw err;
  } finally {
    client.release();
  }
}

// Función para simular auth.uid() de Supabase
export function getCurrentUserId(): string | null {
  // En desarrollo, retornamos el ID del usuario admin
  // En producción, esto debería obtenerse del contexto de autenticación
  return process.env.NODE_ENV === 'development' 
    ? '00000000-0000-0000-0000-000000000001' 
    : null;
}

// Función para verificar la conexión
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('Conexión a la base de datos establecida correctamente');
    return true;
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    return false;
  }
}
