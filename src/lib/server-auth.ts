import { query } from './db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

// Tipos para la autenticación
export interface User {
  id: string;
  email: string;
  is_super_admin: boolean;
  is_temporary_super_admin: boolean;
}

interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  is_active: boolean;
}

// Generar token de sesión seguro
function generateSessionToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}

// Crear sesión para el usuario
export async function createSession(userId: string, userEmail: string): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
  
  try {
    // Crear sesión en la base de datos
    await query(
      'INSERT INTO sessions (user_id, token, expires_at, is_active) VALUES ($1, $2, $3, $4)',
      [userId, token, expiresAt, true]
    );
    
    // Establecer cookies
    const cookieStore = await cookies();
    cookieStore.set('auth_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });
    
    cookieStore.set('user_email', userEmail, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });
    
    return token;
  } catch (error) {
    console.error('Error creating session:', error);
    throw new Error('Failed to create session');
  }
}

// Verificar sesión activa
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('auth_session')?.value;
    
    if (!sessionToken) {
      return null;
    }
    
    const result = await query(
      'SELECT * FROM sessions WHERE token = $1 AND is_active = true AND expires_at > NOW()',
      [sessionToken]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

// Obtener usuario actual
export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await getSession();
    if (!session) {
      return null;
    }
    
    const result = await query(
      'SELECT id, email, is_super_admin, is_temporary_super_admin FROM users WHERE id = $1',
      [session.user_id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Verificar si el usuario está autenticado
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

// Cerrar sesión
export async function logout(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('auth_session')?.value;
    
    if (sessionToken) {
      // Invalidar sesión en la base de datos
      await query(
        'UPDATE sessions SET is_active = false WHERE token = $1',
        [sessionToken]
      );
    }
    
    // Eliminar cookies
    cookieStore.delete('auth_session');
    cookieStore.delete('user_email');
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

// Proteger rutas privadas
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  return user;
}

// Proteger rutas de API
export async function protectApiRoute(): Promise<NextResponse | { user: User }> {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'No autorizado' },
      { status: 401 }
    );
  }
  
  return { user };
}
