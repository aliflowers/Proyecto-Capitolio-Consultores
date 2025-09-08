import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

export async function POST() {
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
    
    // Las cookies se eliminan del lado del cliente en el cliente browser
    // Esta API solo se encarga de invalidar la sesión en la base de datos
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error en logout:', error);
    return NextResponse.json(
      { success: false, error: 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
}
