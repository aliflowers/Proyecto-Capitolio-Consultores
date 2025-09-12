import { query } from '@/lib/db';

const RC_URL = process.env.RC_URL || process.env.NEXT_PUBLIC_ROCKETCHAT_URL || '';
const RC_ADMIN_ID = process.env.RC_ADMIN_ID || '';
const RC_ADMIN_TOKEN = process.env.RC_ADMIN_TOKEN || '';

function ensureConfig() {
  if (!RC_URL || !RC_ADMIN_ID || !RC_ADMIN_TOKEN) {
    throw new Error('Rocket.Chat no está configurado. Defina RC_URL, RC_ADMIN_ID y RC_ADMIN_TOKEN en el entorno.');
  }
}

async function rcFetch(path: string, options: RequestInit = {}) {
  ensureConfig();
  const url = `${RC_URL.replace(/\/$/, '')}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Auth-Token': RC_ADMIN_TOKEN,
    'X-User-Id': RC_ADMIN_ID,
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
  const data = await rcFetch(`/api/v1/users.info?email=${encodeURIComponent(email)}`, { method: 'GET' }).catch(() => null);
  if (!data || data.success === false) return null;
  return data.user; // { _id, username, name, emails, ... }
}

function toUsernameFromEmail(email: string) {
  return email.split('@')[0].replace(/[^a-zA-Z0-9_\.\-]/g, '').slice(0, 24) || `user${Math.floor(Math.random()*10000)}`;
}

export async function createRcUserIfNotExists(name: string, email: string) {
  const existing = await findRcUserByEmail(email);
  if (existing) return existing;
  const username = toUsernameFromEmail(email);
  const password = `Tmp_${Math.random().toString(36).slice(2)}_${Date.now()}`; // temporal
  const data = await rcFetch('/api/v1/users.create', {
    method: 'POST',
    body: JSON.stringify({ name, email, username, password, verified: true }),
  });
  return data.user; // {_id, username, ...}
}

export async function createLoginTokenForUser(rcUserId: string) {
  const data = await rcFetch('/api/v1/users.createToken', {
    method: 'POST',
    body: JSON.stringify({ userId: rcUserId }),
  });
  // data = { success: true, userId, authToken }
  return data.authToken as string;
}

export function buildEmbeddedUrl(resumeToken: string) {
  ensureConfig();
  const base = RC_URL.replace(/\/$/, '');
  return `${base}/home?layout=embedded&resumeToken=${encodeURIComponent(resumeToken)}`;
}
