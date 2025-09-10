import { NextRequest, NextResponse } from 'next/server';
import { protectApiRoute } from '@/lib/server-auth';
import { withSuperAdmin } from '@/lib/auth-middleware';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/admin/users/revoke { userId: string, disable?: boolean }
export async function POST(req: NextRequest) {
  const auth = await protectApiRoute();
  if (auth instanceof NextResponse) return auth;

  const superAdmin = await withSuperAdmin();
  const superCheck = await superAdmin(req as unknown as Request);
  if (superCheck instanceof NextResponse) return superCheck;

  const { userId, disable = true } = await req.json().catch(() => ({}));
  if (!userId) return NextResponse.json({ success: false, error: 'userId requerido' }, { status: 400 });

  try {
    await query('BEGIN');
    // Invalidar sesiones activas
    await query('UPDATE sessions SET is_active = FALSE WHERE user_id = $1', [userId]);
    // Deshabilitar usuario si se solicita
    if (disable) {
      await query('UPDATE users SET is_disabled = TRUE, updated_at = NOW() WHERE id = $1', [userId]);
    }
    await query('COMMIT');
    return NextResponse.json({ success: true, disabled: !!disable });
  } catch (e) {
    await query('ROLLBACK');
    return NextResponse.json({ success: false, error: 'Error revocando sesiones' }, { status: 500 });
  }
}

