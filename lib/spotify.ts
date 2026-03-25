import { adminDb } from './firebase-admin';
import axios from 'axios';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_BASE_URL 
  ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/spotify/callback` 
  : 'http://localhost:3000/api/spotify/callback';

export async function getSpotifyToken(userId: string) {
  if (!adminDb) return null;

  const userDoc = await adminDb.collection('students').doc(userId).get();
  if (!userDoc.exists) return null;

  const data = userDoc.data();
  const spotifyData = data?.spotify;

  if (!spotifyData || !spotifyData.refresh_token) return null;

  // Check if token is expired
  const now = Date.now();
  if (spotifyData.expires_at && now < spotifyData.expires_at) {
    return spotifyData.access_token;
  }

  // Refresh token
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', 
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: spotifyData.refresh_token,
        client_id: SPOTIFY_CLIENT_ID!,
        client_secret: SPOTIFY_CLIENT_SECRET!,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, expires_in, refresh_token } = response.data;
    const expires_at = Date.now() + expires_in * 1000;

    const updateData: any = {
      'spotify.access_token': access_token,
      'spotify.expires_at': expires_at,
    };

    if (refresh_token) {
      updateData['spotify.refresh_token'] = refresh_token;
    }

    await adminDb.collection('students').doc(userId).update(updateData);

    return access_token;
  } catch (error) {
    console.error('Error refreshing Spotify token:', error);
    return null;
  }
}

export function getSpotifyAuthUrl(state: string) {
  const scope = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-modify-playback-state',
    'user-read-playback-state',
    'user-library-read',
    'user-library-modify',
    'playlist-read-private',
    'playlist-read-collaborative'
  ].join(' ');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID!,
    scope: scope,
    redirect_uri: REDIRECT_URI,
    state: state,
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeSpotifyCode(code: string, userId: string) {
  try {
    const response = await axios.post('https://accounts.spotify.com/api/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: SPOTIFY_CLIENT_ID!,
        client_secret: SPOTIFY_CLIENT_SECRET!,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;
    const expires_at = Date.now() + expires_in * 1000;

    if (adminDb) {
      await adminDb.collection('students').doc(userId).update({
        spotify: {
          access_token,
          refresh_token,
          expires_at,
          connected_at: Date.now(),
        }
      });
    }

    return { access_token, refresh_token, expires_at };
  } catch (error) {
    console.error('Error exchanging Spotify code:', error);
    throw error;
  }
}
