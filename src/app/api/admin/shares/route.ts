import { NextRequest, NextResponse } from 'next/server';
import { protectApiRoute } from '@/lib/server-auth';
import { query } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit-logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Utilidad: obtener owner y validar permisos (owner o super admin)
async function getOwnerAndAuthorize(user: any, resourceType: string, resourceId: string) {
  let ownerQuery = '';
  if (resourceType === 'documento') ownerQuery = 'SELECT user_id FROM documentos WHERE id = $1';
  if (resourceType === 'expediente') ownerQuery = 'SELECT user_id FROM expedientes WHERE id = $1';
  if (resourceType === 'cliente') ownerQuery = 'SELECT user_id FROM clientes WHERE id = $1';
  if (!ownerQuery) throw new Error('resourceType inválido');
  const ownRes = await query(ownerQuery, [resourceId]);
  if (!ownRes.rowCount) throw new Error('Recurso no encontrado');
  const ownerUserId = ownRes.rows[0].user_id as string;
  if (!user.is_super_admin && user.id !== ownerUserId) {
    throw new Error('No autorizado: solo el dueño del recurso o un super admin pueden compartir');
  }
  return ownerUserId;
}

// POST /api/admin/shares { resourceType, resourceId, targetUserId, access }
export async function POST(req: NextRequest) {
  const auth = await protectApiRoute();
  if (auth instanceof NextResponse) return auth;

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
    const ownerUserId = await getOwnerAndAuthorize((auth as any).user, resourceType, resourceId);

    await query(
      `INSERT INTO resource_shares (resource_type, resource_id, owner_user_id, target_user_id, access)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (resource_type, resource_id, target_user_id)
       DO UPDATE SET access = EXCLUDED.access, created_at = NOW()`,
      [resourceType, resourceId, ownerUserId, targetUserId, access]
    );

    await logAuditEvent((auth as any).user, 'SHARE_RESOURCE', 'resource_share', resourceId, {
      resource_type: resourceType,
      target_user_id: targetUserId,
      access
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = e?.message || 'Error al compartir recurso';
    const code = msg.includes('No autorizado') ? 403 : (msg.includes('no encontrado') ? 404 : 500);
    return NextResponse.json({ success: false, error: msg }, { status: code });
  }
}

// DELETE /api/admin/shares?resourceType=...&resourceId=...&targetUserId=...
export async function DELETE(req: NextRequest) {
  const auth = await protectApiRoute();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const resourceType = searchParams.get('resourceType');
  const resourceId = searchParams.get('resourceId');
  const targetUserId = searchParams.get('targetUserId');
  if (!resourceType || !resourceId || !targetUserId) {
    return NextResponse.json({ success: false, error: 'Parámetros requeridos' }, { status: 400 });
  }

  try {
    await getOwnerAndAuthorize((auth as any).user, resourceType, resourceId);

    await query(
      `DELETE FROM resource_shares WHERE resource_type=$1 AND resource_id=$2 AND target_user_id=$3`,
      [resourceType, resourceId, targetUserId]
    );

    await logAuditEvent((auth as any).user, 'UNSHARE_RESOURCE', 'resource_share', resourceId, {
      resource_type: resourceType,
      target_user_id: targetUserId
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    const msg = e?.message || 'Error al remover compartición';
    const code = msg.includes('No autorizado') ? 403 : (msg.includes('no encontrado') ? 404 : 500);
    return NextResponse.json({ success: false, error: msg }, { status: code });
  }
}

