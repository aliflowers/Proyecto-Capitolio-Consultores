import { NextRequest, NextResponse } from 'next/server';
import { protectApiRoute } from '@/lib/server-auth';
import { withSuperAdmin } from '@/lib/auth-middleware';
import { query } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit-logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/admin/users/enable { userId: string }
export async function POST(req: NextRequest) {
  const auth = await protectApiRoute();
  if (auth instanceof NextResponse) return auth;

  const superAdmin = await withSuperAdmin();
  const superCheck = await superAdmin(req as unknown as Request);
  if (superCheck instanceof NextResponse) return superCheck;

  const { userId } = await req.json().catch(() => ({}));
  if (!userId) return NextResponse.json({ success: false, error: 'userId requerido' }, { status: 400 });

  try {
    await query('UPDATE users SET is_disabled = FALSE, updated_at = NOW() WHERE id = $1', [userId]);

    // Auditoría
    await logAuditEvent((auth as any).user, 'ENABLE_USER', 'user', userId);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Error al habilitar usuario' }, { status: 500 });
  }
}

