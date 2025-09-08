import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials } from '@/lib/auth';
import { createSession } from '@/lib/server-auth';
import { authRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Aplicar rate limiting antes de procesar la lógica
    const rateLimitResponse = await authRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { email, password } = await request.json();
    
    // Verificar credenciales
    const user = await verifyCredentials(email, password);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }
    
    // Crear sesión
    const token = await createSession(user.id, user.email);
    
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        is_super_admin: user.is_super_admin,
        is_temporary_super_admin: user.is_temporary_super_admin
      }
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { success: false, error: 'Error en la autenticación' },
      { status: 500 }
    );
  }
}
