import { query } from '@/lib/db';

const RC_URL = process.env.RC_URL || process.env.NEXT_PUBLIC_ROCKETCHAT_URL || '';
const RC_ADMIN_ID = process.env.RC_ADMIN_ID || '';
const RC_ADMIN_TOKEN = process.env.RC_ADMIN_TOKEN || '';

function ensureConfig() {
  if (!RC_URL) {
    throw new Error('Rocket.Chat no está configurado. Defina RC_URL (o NEXT_PUBLIC_ROCKETCHAT_URL) en el entorno.');
  }
}

let cachedAuth: { userId: string; authToken: string } | null = null;

async function getAdminAuth() {
  ensureConfig();
  if (cachedAuth) return cachedAuth;
  // Uso estrictamente un PAT de administrador (recomendado por la guía)
  if (RC_ADMIN_ID && RC_ADMIN_TOKEN) {
    cachedAuth = { userId: RC_ADMIN_ID, authToken: RC_ADMIN_TOKEN };
    return cachedAuth;
  }
  throw new Error(
    'Faltan RC_ADMIN_ID y RC_ADMIN_TOKEN. Crea un Personal Access Token (PAT) para el usuario admin en Rocket.Chat ' +
    'y expórtalo como variables de entorno del backend (server-only).'
  );
}

async function rcFetch(path: string, options: RequestInit = {}) {
  ensureConfig();
  const { userId, authToken } = await getAdminAuth();
  const url = `${RC_URL.replace(/\/$/, '')}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Auth-Token': authToken,
    'X-User-Id': userId,
    ...(options.headers as any),
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`RC API ${path} ${res.status}: ${text}`);
  }
  return res.json();
}

export async function findRcUserByEmail(email: string) {
  // v7+: users.info ya no acepta email; usar users.list con query por emails.address
  const query = encodeURIComponent(JSON.stringify({ 'emails.address': email }));
  const data = await rcFetch(`/api/v1/users.list?query=${query}`, { method: 'GET' }).catch(() => null);
  const user = data?.users?.[0] || null;
  return user; // { _id, username, name, emails, ... }
}

export async function findRcUserByUsername(username: string) {
  const data = await rcFetch(`/api/v1/users.info?username=${encodeURIComponent(username)}`, { method: 'GET' }).catch(() => null);
  if (!data || data.success === false) return null;
  return data.user;
}

function toUsernameFromEmail(email: string) {
  return email.split('@')[0].replace(/[^a-zA-Z0-9_\.\-]/g, '').slice(0, 24) || `user${Math.floor(Math.random()*10000)}`;
}

export async function createRcUserIfNotExists(name: string, email: string) {
  // 1) buscar por email
  const byEmail = await findRcUserByEmail(email);
  if (byEmail) return byEmail;

  // 2) si no existe por email, probar por username derivado
  let baseUsername = toUsernameFromEmail(email);
  const byUsername = await findRcUserByUsername(baseUsername);
  if (byUsername) return byUsername;

  // 3) intentar crear; si el username está tomado, generar variaciones y reintentar
  const password = `Tmp_${Math.random().toString(36).slice(2)}_${Date.now()}`; // temporal
  let attemptUsername = baseUsername;
  for (let i = 0; i < 5; i++) {
    try {
      const data = await rcFetch('/api/v1/users.create', {
        method: 'POST',
        body: JSON.stringify({ name, email, username: attemptUsername, password, verified: true }),
      });
      return data.user; // {_id, username, ...}
    } catch (e: any) {
      const msg = String(e?.message || '');
      const isTaken = msg.includes('is already in use') || msg.includes('error-field-unavailable');
      if (!isTaken) throw e;
      // generar nuevo username con sufijo
      const suffix = Math.random().toString(36).slice(2, 5);
      attemptUsername = `${baseUsername}-${suffix}`.slice(0, 24);
    }
  }
  throw new Error('No fue posible crear el usuario en Rocket.Chat después de varios intentos.');
}

export async function createLoginTokenForUser(rcUserId: string, username?: string) {
  // Primero intentar con JSON y userId (formato oficial)
  try {
    const data = await rcFetch('/api/v1/users.createToken', {
      method: 'POST',
      body: JSON.stringify({ userId: rcUserId }),
    });
    // API puede responder en dos formatos según versión:
    // v6: { data: { authToken } }, v7+: { authToken }
    const token = (data && (data.authToken || data?.data?.authToken)) as string | undefined;
    if (token) return token;
    throw new Error('users.createToken respondió sin authToken');
  } catch (e1: any) {
    // Algunas versiones aceptan username; usarlo como plan B si lo tenemos
    if (username) {
      try {
        const data2 = await rcFetch('/api/v1/users.createToken', {
          method: 'POST',
          body: JSON.stringify({ username }),
        });
        const token2 = (data2 && (data2.authToken || data2?.data?.authToken)) as string | undefined;
        if (token2) return token2;
        throw new Error('users.createToken respondió sin authToken (username)');
      } catch (e2: any) {
        throw new Error(`Falló users.createToken con userId (${e1?.message}). Y también con username (${e2?.message}).`);
      }
    }
    throw e1;
  }
}

export function buildEmbeddedUrl(resumeToken: string) {
  ensureConfig();
  const base = RC_URL.replace(/\/$/, '');
  return `${base}/home?layout=embedded&resumeToken=${encodeURIComponent(resumeToken)}`;
}
