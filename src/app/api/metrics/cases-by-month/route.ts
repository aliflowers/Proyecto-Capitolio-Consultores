import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { protectApiRoute } from '@/lib/server-auth';

// Backward-compatible alias for charts still requesting "cases" terminology.
export async function GET(request: Request) {
  try {
    const authResult = await protectApiRoute();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const result = await query(
      `SELECT 
         TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
         COUNT(*) as count
       FROM expedientes
       WHERE user_id = $1
       GROUP BY month
       ORDER BY month ASC`,
      [user.id]
    );

    const data = result.rows.map((row: any) => ({
      month: row.month,
      count: parseInt(row.count, 10),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error al obtener métricas cases-by-month:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener métricas cases-by-month' },
      { status: 500 }
    );
  }
}

