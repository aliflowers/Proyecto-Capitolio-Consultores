import { query } from './db';
import bcrypt from 'bcrypt';
import { Logger } from './logger';

// Crear logger específico para el módulo de autenticación
const logger = new Logger({ module: 'auth' });

// Tipos para la autenticación (pueden ser movidos a un archivo de tipos dedicado)
interface User {
  id: string;
  email: string;
  is_super_admin: boolean;
  is_temporary_super_admin: boolean;
}

// Verificar credenciales de usuario de forma segura
export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  const authLogger = logger.child({ action: 'verifyCredentials' });
  const timer = authLogger.startTimer('Credential verification');
  
  try {
    authLogger.debug('Attempting to verify user credentials', { email });
    // 1. Obtener el usuario y su contraseña hasheada de la base de datos
    const result = await query(
      'SELECT id, email, encrypted_password, is_super_admin, is_temporary_super_admin FROM users WHERE email = $1',
      [email]
    );

    // Si no se encuentra el usuario, retornar null para dar un mensaje genérico
    if (result.rows.length === 0) {
      authLogger.info('User not found in database', { email });
      timer();
      return null;
    }

    const user = result.rows[0];
    const hashedPassword = user.encrypted_password;

    // 2. Comparar la contraseña proporcionada con el hash almacenado
    const isValid = await bcrypt.compare(password, hashedPassword);

    // 3. Si la contraseña es válida, retornar los datos del usuario
    if (isValid) {
      authLogger.info('User authenticated successfully', { 
        userId: user.id, 
        email: user.email,
        is_super_admin: user.is_super_admin 
      });
      timer();
      return {
        id: user.id,
        email: user.email,
        is_super_admin: user.is_super_admin,
        is_temporary_super_admin: user.is_temporary_super_admin,
      };
    }

    // Si la contraseña no es válida, retornar null
    authLogger.warn('Invalid password attempt', { email });
    timer();
    return null;
    
  } catch (error) {
    authLogger.error('Error verifying credentials', error, { email });
    timer();
    // En caso de un error de base de datos u otro, no filtrar información
    return null;
  }
}
