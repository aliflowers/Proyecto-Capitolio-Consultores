#!/usr/bin/env node

// ETL diario de Rocket.Chat a Postgres local (rooms, users, messages del día)
// Requiere:
//  - RC_URL, RC_ADMIN_ID, RC_ADMIN_TOKEN
//  - DATABASE_URL (ya configurado)

const { query } = require('../src/lib/db');

const RC_URL = process.env.RC_URL || process.env.NEXT_PUBLIC_ROCKETCHAT_URL || '';
const RC_ADMIN_ID = process.env.RC_ADMIN_ID || '';
const RC_ADMIN_TOKEN = process.env.RC_ADMIN_TOKEN || '';

function ensureConfig() {
  if (!RC_URL || !RC_ADMIN_ID || !RC_ADMIN_TOKEN) {
    throw new Error('Faltan variables RC_URL/RC_ADMIN_ID/RC_ADMIN_TOKEN');
  }
}

async function rcFetch(path, options = {}) {
  ensureConfig();
  const url = `${RC_URL.replace(/\/$/, '')}${path}`;
  const headers = Object.assign({
    'Content-Type': 'application/json',
    'X-Auth-Token': RC_ADMIN_TOKEN,
    'X-User-Id': RC_ADMIN_ID,
  }, options.headers || {});
  const res = await fetch(url, Object.assign({}, options, { headers }));
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`RC API ${path} ${res.status}: ${text}`);
  }
  return res.json();
}

function isoStartOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  return d.toISOString();
}

async function upsertRoom(room) {
  await query(`
    INSERT INTO chat_rooms (id_rc, name, type, created_at)
    VALUES ($1,$2,$3,$4)
    ON CONFLICT (id_rc) DO UPDATE SET name=EXCLUDED.name, type=EXCLUDED.type, created_at=EXCLUDED.created_at
  `, [room._id, room.name || room.fname || '', room.t || room.type || '', room.ts ? new Date(room.ts) : null]);
}

async function upsertUser(user) {
  const email = (user.emails && user.emails[0] && user.emails[0].address) || null;
  await query(`
    INSERT INTO chat_users (id_rc, email, name, is_admin)
    VALUES ($1,$2,$3,$4)
    ON CONFLICT (id_rc) DO UPDATE SET email=EXCLUDED.email, name=EXCLUDED.name, is_admin=EXCLUDED.is_admin
  `, [user._id, email, user.name || user.username || '', !!user.roles?.includes('admin')]);
}

async function upsertMessage(msg) {
  await query(`
    INSERT INTO chat_messages (id_rc, room_id_rc, user_id_rc, ts, text, msg_type, file_meta_json)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT (id_rc) DO UPDATE SET room_id_rc=EXCLUDED.room_id_rc, user_id_rc=EXCLUDED.user_id_rc, ts=EXCLUDED.ts, text=EXCLUDED.text, msg_type=EXCLUDED.msg_type, file_meta_json=EXCLUDED.file_meta_json
  `, [
    msg._id,
    msg.rid,
    msg.u?._id || null,
    msg.ts ? new Date(msg.ts) : null,
    msg.msg || '',
    msg.t || null,
    msg.file ? JSON.stringify(msg.file) : null,
  ]);
}

async function main() {
  ensureConfig();
  const since = isoStartOfDay(new Date());

  // Rooms (paginado simple)
  const roomsData = await rcFetch('/api/v1/rooms.get');
  const rooms = roomsData?.update || [];
  for (const room of rooms) {
    await upsertRoom(room);
  }

  // Users (paginado simple)
  const usersData = await rcFetch('/api/v1/users.list');
  const users = usersData?.users || [];
  for (const u of users) {
    await upsertUser(u);
  }

  // Messages per room since start of day
  for (const room of rooms) {
    const type = room.t || room.type;
    let historyPath;
    if (type === 'c') historyPath = '/api/v1/channels.history';
    else if (type === 'p') historyPath = '/api/v1/groups.history';
    else if (type === 'd') historyPath = '/api/v1/im.history';
    else continue;

    const params = new URLSearchParams({ roomId: room._id, oldest: since });
    const hist = await rcFetch(`${historyPath}?${params.toString()}`);
    const messages = hist?.messages || [];
    for (const m of messages) {
      await upsertMessage(m);
    }
  }

  console.log('RC backup completado.');
}

if (require.main === module) {
  // Node 18+: fetch global
  main().catch(err => {
    console.error('RC backup error:', err);
    process.exit(1);
  });
}
