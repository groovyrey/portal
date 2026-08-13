import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { clearPortalSession } from '@/lib/session-proxy';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  const isProd = process.env.NODE_ENV === 'production';

  // Revoke the stored portal session and credential server-side.
  const sessionCookie = req.cookies.get('session_token');
  if (sessionCookie?.value) {
    let userId: string | null = null;
    try {
      const sessionData = JSON.parse(decrypt(sessionCookie.value));
      userId = sessionData.userId || null;
    } catch (e) {
      // Invalid session; still clear the cookies below.
    }
    if (userId) {
      await clearPortalSession(userId);
    }
  }

  response.cookies.set('session_token', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  // Clear UI indicator cookie
  response.cookies.set('portal_session_active', '', {
    httpOnly: false,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  return response;
}
