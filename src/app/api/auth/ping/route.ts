import { NextResponse } from 'next/server';
import { protectApiRoute } from '@/lib/server-auth';

export async function POST() {
  // Si hay usuario, la llamada a protectApiRoute refrescará la expiración de la sesión y actualizará cookie
  const auth = await protectApiRoute();
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ success: true });
}

