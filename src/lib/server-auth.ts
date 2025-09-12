import { query } from './db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

// Tiempo de inactividad máximo por sesión (rolling session): 5 minutos
const SESSION_IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos

// Tipos para la autenticación
export interface User {
  id: string;
  email: string;
  is_super_admin: boolean;
  is_temporary_super_admin: boolean;
  full_name?: string; // opcional, tomado de profiles
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

// Crear sesión para el usuario (expira por inactividad)
export async function createSession(userId: string, userEmail: string): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_IDLE_TIMEOUT_MS);
  
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

// Refrescar (extender) una sesión activa por actividad del usuario
// allowCookieSet: cuando true, también actualiza la cookie (solo permitido en Route Handlers/Server Actions)
async function refreshSession(session: Session, allowCookieSet: boolean): Promise<void> {
  const newExpiresAt = new Date(Date.now() + SESSION_IDLE_TIMEOUT_MS);
  try {
    await query('UPDATE sessions SET expires_at = $2 WHERE id = $1', [session.id, newExpiresAt]);
    if (allowCookieSet) {
      const cookieStore = await cookies();
      cookieStore.set('auth_session', session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: newExpiresAt,
        path: '/',
      });
    }
  } catch (error) {
    // No bloquear el flujo por un fallo al refrescar; solo registrar.
    console.error('Error refreshing session expiration:', error);
  }
}

// Verificar sesión activa (y extenderla por actividad)
export async function getSession(allowCookieSet: boolean = false): Promise<Session | null> {
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
    
    const session: Session = result.rows[0];

    // Rolling session: extender vencimiento por actividad
    await refreshSession(session, allowCookieSet);

    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

// Obtener usuario actual
export async function getCurrentUser(allowCookieSet: boolean = false): Promise<User | null> {
  try {
    const session = await getSession(allowCookieSet);
    if (!session) {
      return null;
    }
    
    const result = await query(
      'SELECT u.id, u.email, u.is_super_admin, u.is_temporary_super_admin, p.full_name\n       FROM users u\n       LEFT JOIN profiles p ON p.id = u.id\n       WHERE u.id = $1',
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
  // En rutas API sí podemos refrescar y setear cookies
  const user = await getCurrentUser(true);
  
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'No autorizado' },
      { status: 401 }
    );
  }
  
  return { user };
}
