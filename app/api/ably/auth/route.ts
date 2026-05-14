import { NextRequest, NextResponse } from 'next/server';
import Ably from 'ably';
import { decrypt } from '@/lib/auth';

let ablyRest: Ably.Rest | null = null;

function getAblyRest() {
  if (!process.env.ABLY_API_KEY) return null;
  if (!ablyRest) {
    ablyRest = new Ably.Rest(process.env.ABLY_API_KEY);
  }
  return ablyRest;
}

export async function GET(req: NextRequest) {
  const client = getAblyRest();
  if (!client) {
    return NextResponse.json({ error: 'Ably API key not configured' }, { status: 500 });
  }

  const sessionCookie = req.cookies.get('session_token');
  let clientId = 'anonymous';

  if (sessionCookie?.value) {
    try {
      const decrypted = decrypt(sessionCookie.value);
      const sessionData = JSON.parse(decrypted);
      if (sessionData.userId) {
        clientId = sessionData.userId;
      }
    } catch (e) {
      console.error('Ably Auth: Failed to decrypt session');
    }
  }

  try {
    const tokenRequestData = await client.auth.createTokenRequest({ clientId });
    return NextResponse.json(tokenRequestData);
  } catch (error: any) {
    console.error('Ably Auth Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
