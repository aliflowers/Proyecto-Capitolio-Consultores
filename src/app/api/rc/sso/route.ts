import { NextRequest, NextResponse } from 'next/server';
import { createRcUserIfNotExists, createLoginTokenForUser } from '@/lib/rocketchat';
import { protectApiRoute } from '@/lib/server-auth';
import { Logger } from '@/lib/logger';

// Crear logger específico para el módulo SSO
const logger = new Logger({ module: 'rc-sso-api' });

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
  const requestLogger = logger.child({ 
    action: 'sso-login',
    requestId: crypto.randomUUID()
  });
  const timer = requestLogger.startTimer('SSO Authentication Flow');
  
  requestLogger.info('--- INICIANDO VERIFICACIÓN DE SSO ---', {
    RC_URL: process.env.RC_URL,
    RC_ADMIN_ID: process.env.RC_ADMIN_ID,
    hasAdminToken: !!process.env.RC_ADMIN_TOKEN
  });
  
  const rcOrigin = getRcOrigin();

  // Verificar sesión en la app (el usuario debe estar autenticado)
  const auth = await protectApiRoute();
  if (auth instanceof NextResponse) {
    requestLogger.warn('User not authenticated - returning auth response', {
      status: auth.status
    });
    timer();
    const res = auth as NextResponse;
    res.headers.set('Access-Control-Allow-Origin', rcOrigin);
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Vary', 'Origin');
    return res; // típicamente 401/403
  }
  const { user } = auth as any;
  
  requestLogger.info('User authenticated', {
    userId: user.id,
    email: user.email,
    fullName: user.full_name
  });

  try {
    requestLogger.debug('Creating RC user if not exists', { email: user.email });
    const rcUser = await createRcUserIfNotExists(user.full_name || user.email, user.email);
    
    requestLogger.debug('RC user obtained', { 
      rcUserId: rcUser._id,
      rcUsername: (rcUser as any)?.username 
    });
    
    requestLogger.debug('Creating login token for RC user', {
      username: (rcUser as any)?.username,
      rcUserId: rcUser._id
    });
    
    // Pasar siempre el username para usar el método de login directo
    const username = (rcUser as any)?.username;
    if (!username) {
      throw new Error('Username no disponible para el usuario de Rocket.Chat');
    }
    
    const token = await createLoginTokenForUser(rcUser._id, username);
    
    requestLogger.info('SSO login token generated successfully', {
      userId: user.id,
      rcUserId: rcUser._id,
      hasToken: !!token
    });
    timer();

    const res = NextResponse.json({ loginToken: token });
    res.headers.set('Access-Control-Allow-Origin', rcOrigin);
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Vary', 'Origin');
    return res;
  } catch (e: any) {
    requestLogger.error('Failed to generate SSO login token', e, {
      userId: user?.id,
      email: user?.email,
      errorMessage: e?.message
    });
    timer();
    
    const res = NextResponse.json({ error: e?.message || 'No fue posible emitir loginToken' }, { status: 500 });
    res.headers.set('Access-Control-Allow-Origin', rcOrigin);
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Vary', 'Origin');
    return res;
  }
}

