import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Dev-only password reset endpoint.
export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ success: false, error: 'Forbidden outside development' }, { status: 403 });
    }

    const { email, newPassword, token } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json({ success: false, error: 'Email y nueva contraseña son requeridos' }, { status: 400 });
    }

    const requiredToken = process.env.DEV_RESET_TOKEN || 'DEVONLY';
    if (requiredToken && token !== requiredToken) {
      return NextResponse.json({ success: false, error: 'Token inválido' }, { status: 401 });
    }

    // Hash in database using pgcrypto's crypt() with Blowfish (bcrypt-compatible)
    const result = await query(
      "UPDATE users SET encrypted_password = crypt($2, gen_salt('bf', 10)), updated_at = NOW() WHERE email = $1",
      [email, newPassword]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('reset-password error:', err);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
