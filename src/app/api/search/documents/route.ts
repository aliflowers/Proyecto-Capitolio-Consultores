import { NextResponse } from 'next/server';
import { protectApiRoute } from '@/lib/server-auth';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const auth = await protectApiRoute();
    if (auth instanceof NextResponse) return auth;
    const { user } = auth;
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('query') || '').trim();
    if (!q) {
      return NextResponse.json({ success: true, data: [] });
    }
    const like = `%${q}%`;
    let sql = 'SELECT id, name FROM documentos WHERE name ILIKE $1';
    const params: any[] = [like];
    if (!user.is_super_admin) {
      sql += ' AND user_id = $2';
      params.push(user.id);
    }
    sql += ' ORDER BY created_at DESC LIMIT 10';
    const res = await query(sql, params);
    return NextResponse.json({ success: true, data: res.rows });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Error al buscar documentos' }, { status: 500 });
  }
}
