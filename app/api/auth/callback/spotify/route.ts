import { NextRequest, NextResponse } from 'next/server';
import { exchangeSpotifyCode } from '@/lib/spotify';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state'); // State is the userId

  if (!code || !state) {
    return NextResponse.redirect(new URL('/test?error=spotify_auth_failed', req.url));
  }

  try {
    await exchangeSpotifyCode(code, state);
    return NextResponse.redirect(new URL('/test?spotify_connected=true', req.url));
  } catch (error) {
    console.error('Spotify callback error:', error);
    return NextResponse.redirect(new URL('/test?error=spotify_token_exchange_failed', req.url));
  }
}
