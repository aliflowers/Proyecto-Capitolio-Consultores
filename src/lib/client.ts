'use client'

// Para desarrollo local, usar conexión directa a PostgreSQL
// Para producción, usar Supabase
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Verificar si estamos en desarrollo local
  if (process.env.NODE_ENV === 'development') {
    // En desarrollo local, retornar cliente con autenticación local
    return {
      auth: {
        signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
          try {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok || !body?.success) {
              const err = { message: body?.error || 'Credenciales inválidas' };
              return { data: null, error: err, status: res.status };
            }
            // Guardar sesión en localStorage para desarrollo
            localStorage.setItem('local_auth_token', body.token);
            localStorage.setItem('local_user_email', email);
            localStorage.setItem('local_user_id', body.user.id);
            return { data: { user: body.user }, error: null, status: res.status };
          } catch (error) {
            return { data: null, error: { message: 'Error en la autenticación' }, status: 0 };
          }
        },
        signOut: async () => {
          try {
            // Cerrar sesión en el servidor
            await fetch('/api/auth/logout', {
              method: 'POST',
            });
            
            // Eliminar datos locales
            localStorage.removeItem('local_auth_token');
            localStorage.removeItem('local_user_email');
            localStorage.removeItem('local_user_id');
            return { error: null };
          } catch (error) {
            return { error: { message: 'Error al cerrar sesión' } };
          }
        },
        getUser: async () => {
          const token = localStorage.getItem('local_auth_token');
          const email = localStorage.getItem('local_user_email');
          const userId = localStorage.getItem('local_user_id');
          
          if (token && email && userId) {
            return { 
              data: { 
                user: { 
                  email, 
                  id: userId 
                } 
              }, 
              error: null 
            };
          } else {
            return { data: { user: null }, error: { message: 'No hay sesión activa' } };
          }
        }
      }
    };
  } else {
    // Usar Supabase en producción
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
}
