import { NextRequest, NextResponse } from 'next/server';
import { createRcUserIfNotExists, createLoginTokenForUser } from '@/lib/rocketchat';
import { protectApiRoute } from '@/lib/server-auth';

function getRcOrigin() {
  const base = process.env.RC_URL || process.env.NEXT_PUBLIC_ROCKETCHAT_URL || '';
  try {
    return new URL(base).origin;
  } catch {
    return '*';
  }
}

// Preflight CORS for Rocket.Chat calling this endpoint (Iframe Auth)
export async function OPTIONS() {
  const rcOrigin = getRcOrigin();
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': rcOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin',
    },
  });
}

// Endpoint SSO: devuelve { loginToken } para el usuario autenticado en la app
export async function POST(req: NextRequest) {
  const rcOrigin = getRcOrigin();

  // Verificar sesión en la app (el usuario debe estar autenticado)
  const auth = await protectApiRoute();
  if (auth instanceof NextResponse) {
    const res = auth as NextResponse;
    res.headers.set('Access-Control-Allow-Origin', rcOrigin);
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Vary', 'Origin');
    return res; // típicamente 401/403
  }
  const { user } = auth as any;

  try {
    const rcUser = await createRcUserIfNotExists(user.full_name || user.email, user.email);
    const token = await createLoginTokenForUser(rcUser._id, (rcUser as any)?.username);

    const res = NextResponse.json({ loginToken: token });
    res.headers.set('Access-Control-Allow-Origin', rcOrigin);
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Vary', 'Origin');
    return res;
  } catch (e: any) {
    const res = NextResponse.json({ error: e?.message || 'No fue posible emitir loginToken' }, { status: 500 });
    res.headers.set('Access-Control-Allow-Origin', rcOrigin);
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Vary', 'Origin');
    return res;
  }
}

