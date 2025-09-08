import { NextResponse, NextRequest } from 'next/server';
import { getAuditLogs } from '@/lib/audit-logger';
import { protectApiRoute } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    // TODO: Añadir verificación de rol de administrador aquí

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const action = searchParams.get('action') || undefined;
    const resourceType = searchParams.get('resourceType') || undefined;
    const days = parseInt(searchParams.get('days') || '30', 10);

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const logs = await getAuditLogs(limit, offset, { action, resourceType, startDate });

    return NextResponse.json({ success: true, data: logs });

  } catch (error) {
    console.error('Error al obtener logs de auditoría:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
