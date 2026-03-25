import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { getSpotifyAuthUrl } from '@/lib/spotify';

export async function GET(req: NextRequest) {
  const sessionToken = req.cookies.get('session_token')?.value;
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/?error=unauthorized', req.url));
  }

  try {
    const session = JSON.parse(decrypt(sessionToken));
    const userId = session.userId;
    const authUrl = getSpotifyAuthUrl(userId); // Use userId as state for simplicity
    return NextResponse.redirect(authUrl);
  } catch (error) {
    return NextResponse.redirect(new URL('/?error=invalid_session', req.url));
  }
}
