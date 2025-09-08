import { query } from './db';
import bcrypt from 'bcrypt';

// Tipos para la autenticación (pueden ser movidos a un archivo de tipos dedicado)
interface User {
  id: string;
  email: string;
  is_super_admin: boolean;
  is_temporary_super_admin: boolean;
}

// Verificar credenciales de usuario de forma segura
export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  try {
    // 1. Obtener el usuario y su contraseña hasheada de la base de datos
    const result = await query(
      'SELECT id, email, encrypted_password, is_super_admin, is_temporary_super_admin FROM users WHERE email = $1',
      [email]
    );

    // Si no se encuentra el usuario, retornar null para dar un mensaje genérico
    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    const hashedPassword = user.encrypted_password;

    // 2. Comparar la contraseña proporcionada con el hash almacenado
    const isValid = await bcrypt.compare(password, hashedPassword);

    // 3. Si la contraseña es válida, retornar los datos del usuario
    if (isValid) {
      return {
        id: user.id,
        email: user.email,
        is_super_admin: user.is_super_admin,
        is_temporary_super_admin: user.is_temporary_super_admin,
      };
    }

    // Si la contraseña no es válida, retornar null
    return null;
    
  } catch (error) {
    console.error('Error verifying credentials:', error);
    // En caso de un error de base de datos u otro, no filtrar información
    return null;
  }
}
