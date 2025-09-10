import { NextRequest, NextResponse } from 'next/server';
import { protectApiRoute } from '@/lib/server-auth';
import { withSuperAdmin } from '@/lib/auth-middleware';
import { query } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/admin/shares { resourceType, resourceId, targetUserId, access }
export async function POST(req: NextRequest) {
  const auth = await protectApiRoute();
  if (auth instanceof NextResponse) return auth;
  const superAdmin = await withSuperAdmin();
  const superCheck = await superAdmin(req as unknown as Request);
  if (superCheck instanceof NextResponse) return superCheck;

  const { resourceType, resourceId, targetUserId, access = 'read' } = await req.json().catch(() => ({}));
  if (!resourceType || !resourceId || !targetUserId) {
    return NextResponse.json({ success: false, error: 'resourceType, resourceId y targetUserId son requeridos' }, { status: 400 });
  }
  if (!['documento','expediente','cliente'].includes(resourceType)) {
    return NextResponse.json({ success: false, error: 'resourceType inválido' }, { status: 400 });
  }
  if (!['read','write'].includes(access)) {
    return NextResponse.json({ success: false, error: 'access inválido' }, { status: 400 });
  }

  try {
    // Determinar owner_user_id desde cada tabla
    let ownerQuery = '';
    if (resourceType === 'documento') ownerQuery = 'SELECT user_id FROM documentos WHERE id = $1';
    if (resourceType === 'expediente') ownerQuery = 'SELECT user_id FROM expedientes WHERE id = $1';
    if (resourceType === 'cliente') ownerQuery = 'SELECT user_id FROM clientes WHERE id = $1';

    const ownRes = await query(ownerQuery, [resourceId]);
    if (!ownRes.rowCount) return NextResponse.json({ success: false, error: 'Recurso no encontrado' }, { status: 404 });

    const ownerUserId = ownRes.rows[0].user_id as string;
    await query(
      `INSERT INTO resource_shares (resource_type, resource_id, owner_user_id, target_user_id, access)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (resource_type, resource_id, target_user_id)
       DO UPDATE SET access = EXCLUDED.access, created_at = NOW()`,
      [resourceType, resourceId, ownerUserId, targetUserId, access]
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Error al compartir recurso' }, { status: 500 });
  }
}

// DELETE /api/admin/shares?resourceType=...&resourceId=...&targetUserId=...
export async function DELETE(req: NextRequest) {
  const auth = await protectApiRoute();
  if (auth instanceof NextResponse) return auth;
  const superAdmin = await withSuperAdmin();
  const superCheck = await superAdmin(req as unknown as Request);
  if (superCheck instanceof NextResponse) return superCheck;

  const { searchParams } = new URL(req.url);
  const resourceType = searchParams.get('resourceType');
  const resourceId = searchParams.get('resourceId');
  const targetUserId = searchParams.get('targetUserId');
  if (!resourceType || !resourceId || !targetUserId) {
    return NextResponse.json({ success: false, error: 'Parámetros requeridos' }, { status: 400 });
  }

  try {
    await query(
      `DELETE FROM resource_shares WHERE resource_type=$1 AND resource_id=$2 AND target_user_id=$3`,
      [resourceType, resourceId, targetUserId]
    );
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Error al remover compartición' }, { status: 500 });
  }
}

