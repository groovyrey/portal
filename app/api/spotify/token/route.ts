import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { getSpotifyToken } from '@/lib/spotify';

export async function GET(req: NextRequest) {
  const sessionToken = req.cookies.get('session_token')?.value;
  if (!sessionToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const session = JSON.parse(decrypt(sessionToken));
    const userId = session.userId;
    const token = await getSpotifyToken(userId);
    
    if (!token) {
      return NextResponse.json({ error: 'No Spotify connection' }, { status: 404 });
    }

    return NextResponse.json({ access_token: token });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
