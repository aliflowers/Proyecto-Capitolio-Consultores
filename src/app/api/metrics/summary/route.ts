import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { protectApiRoute } from '@/lib/server-auth';

export async function GET(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    // Obtener métricas para el usuario autenticado
    const totalCasesResult = await query(
      `SELECT COUNT(*) FROM expedientes WHERE user_id = $1`,
      [user.id]
    );
    const openCasesResult = await query(
      `SELECT COUNT(*) FROM expedientes WHERE user_id = $1 AND status = 'abierto'`,
      [user.id]
    );
    const totalDocumentsResult = await query(
      `SELECT COUNT(*) FROM documentos WHERE user_id = $1`,
      [user.id]
    );
    const totalClientsResult = await query(
      `SELECT COUNT(*) FROM clientes WHERE user_id = $1`,
      [user.id]
    );

    const metrics = {
      totalCases: parseInt(totalCasesResult.rows[0].count, 10),
      openCases: parseInt(openCasesResult.rows[0].count, 10),
      totalDocuments: parseInt(totalDocumentsResult.rows[0].count, 10),
      totalClients: parseInt(totalClientsResult.rows[0].count, 10),
      // Tareas pendientes no implementadas aún en DB, se puede añadir después
      pendingTasks: 0, 
    };

    return NextResponse.json({ success: true, data: metrics });

  } catch (error) {
    console.error('Error al obtener métricas del dashboard:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener métricas del dashboard',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
