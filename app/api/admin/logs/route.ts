import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { getAdminLogs } from '@/lib/admin-logs';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
      const decrypted = decrypt(sessionCookie.value);
      const sessionData = JSON.parse(decrypted);
      // Admin check logic can be added here if needed
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const logs = await getAdminLogs(100);

    return NextResponse.json({ 
      success: true, 
      logs 
    });

  } catch (error: any) {
    console.error('Admin logs fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
