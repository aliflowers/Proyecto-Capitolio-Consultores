import { NextRequest, NextResponse } from 'next/server';
import { protectApiRoute } from '@/lib/server-auth';
import { query } from '@/lib/db';
import bcrypt from 'bcrypt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/auth/change-password { currentPassword, newPassword }
export async function POST(req: NextRequest) {
  const auth = await protectApiRoute();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const { currentPassword, newPassword } = await req.json().catch(() => ({}));
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ success: false, error: 'Contraseñas requeridas' }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ success: false, error: 'La nueva contraseña debe tener al menos 8 caracteres' }, { status: 400 });
  }

  try {
    // Obtener hash actual
    const res = await query('SELECT encrypted_password FROM users WHERE id=$1', [user.id]);
    if (!res.rowCount) return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });

    const ok = await bcrypt.compare(currentPassword, res.rows[0].encrypted_password);
    if (!ok) return NextResponse.json({ success: false, error: 'Contraseña actual incorrecta' }, { status: 401 });

    const hash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET encrypted_password=$2, updated_at=NOW() WHERE id=$1', [user.id, hash]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Error al cambiar contraseña' }, { status: 500 });
  }
}

