import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/turso';
import { decrypt } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const studentId = req.nextUrl.searchParams.get('studentId');
    if (!studentId) {
       return NextResponse.json({ error: 'Student ID required' }, { status: 400 });
    }

    // Authenticate
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let sessionUserId: string;
    try {
      const decrypted = decrypt(sessionCookie.value);
      const sessionData = JSON.parse(decrypted);
      sessionUserId = sessionData.userId;
      
      if (sessionUserId !== studentId) {
         return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const statsResult = await query(`
      SELECT 
        level, 
        exp, 
        total_quests as "totalQuests", 
        total_score as "totalScore", 
        last_quest_at as "lastQuestAt"
      FROM student_stats 
      WHERE user_id = ?
    `, [studentId]);

    if (statsResult.rowCount === 0) {
       return NextResponse.json({ error: 'No stats found' }, { status: 404 });
    }

    return NextResponse.json(statsResult.rows[0]);

  } catch (error) {
    console.error('Fetch Stats API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
