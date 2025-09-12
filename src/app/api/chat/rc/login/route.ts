import { NextResponse } from 'next/server';
import { protectApiRoute } from '@/lib/server-auth';
import { createRcUserIfNotExists, createLoginTokenForUser, buildEmbeddedUrl } from '@/lib/rocketchat';

export async function GET() {
  const auth = await protectApiRoute();
  if (auth instanceof NextResponse) return auth;
  const { user } = auth as any;

  try {
    const rcUser = await createRcUserIfNotExists(user.full_name || user.email, user.email);
    const token = await createLoginTokenForUser(rcUser._id);
    const url = buildEmbeddedUrl(token);
    return NextResponse.json({ success: true, url });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Error generando URL de chat' }, { status: 500 });
  }
}
