import { createServerClient as createSupabaseClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/lib/server-auth'

// Cliente para entorno de desarrollo local
export async function createClient() {
  // Verificar si estamos en desarrollo local
  if (process.env.NODE_ENV === 'development') {
    // Retornar un cliente simulado para desarrollo local
    return {
      auth: {
        getUser: async () => {
          const user = await getCurrentUser();
          if (user) {
            return { data: { user }, error: null };
          } else {
            return { data: { user: null }, error: new Error('No user found') };
          }
        },
      },
      from: (table: string) => {
        // Simulación básica de Supabase client para desarrollo local
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: () => ({
                  data: [],
                  error: null
                })
              })
            })
          })
        };
      }
    };
  } else {
    // Usar Supabase en producción
    const cookieStore = await cookies();
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    );
  }
}
