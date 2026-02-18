import { NextRequest, NextResponse } from 'next/server';
import Ably from 'ably';

export async function GET(req: NextRequest) {
  if (!process.env.ABLY_API_KEY) {
    return NextResponse.json({ error: 'Ably API key not configured' }, { status: 500 });
  }

  try {
    const client = new Ably.Realtime(process.env.ABLY_API_KEY);
    const tokenRequestData = await client.auth.createTokenRequest({ clientId: 'portal-user' });
    return NextResponse.json(tokenRequestData);
  } catch (error: any) {
    console.error('Ably Auth Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
