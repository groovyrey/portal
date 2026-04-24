import { NextRequest, NextResponse } from 'next/server';
import { decrypt, isStaff } from '@/lib/auth';
import { getStudentProfile } from '@/lib/data-service';

export async function POST(req: NextRequest) {
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

    if (!(await isStaff(userId))) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: 'IDs array required' }, { status: 400 });
    }

    // Fetch profiles for all online IDs
    // Limit to 50 for safety
    const limitedIds = ids.slice(0, 50);
    const profiles = await Promise.all(
      limitedIds.map(id => getStudentProfile(id))
    );

    const activeUsers = profiles.filter(p => p !== null);

    return NextResponse.json({ success: true, users: activeUsers });

  } catch (error: any) {
    console.error('Admin online users fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
