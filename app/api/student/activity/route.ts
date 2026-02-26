import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { getUserActivityLogs } from '@/lib/activity-service';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let userId = "";
    try {
      const decrypted = decrypt(sessionCookie.value);
      const sessionData = JSON.parse(decrypted);
      userId = sessionData.userId;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const logs = await getUserActivityLogs(userId, limit);

    return NextResponse.json({ success: true, logs });

  } catch (error: any) {
    console.error('Fetch activity logs error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
