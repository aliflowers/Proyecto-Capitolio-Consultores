import { NextResponse, NextRequest } from 'next/server';
import { getAuditStats } from '@/lib/audit-logger';
import { protectApiRoute } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    // TODO: Añadir verificación de rol de administrador aquí

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    const stats = await getAuditStats(days);

    return NextResponse.json({ success: true, data: stats });

  } catch (error) {
    console.error('Error al obtener estadísticas de auditoría:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
