import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/turso';

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  try {
    const leaderboard = await query(`
      SELECT 
        s.id, 
        s.name, 
        s.course,
        ss.level, 
        ss.exp, 
        ss.total_quests, 
        ss.total_score
      FROM student_stats ss
      JOIN students s ON ss.user_id = s.id
      ORDER BY ss.exp DESC
      LIMIT 20
    `);

    return NextResponse.json(leaderboard.rows);
  } catch (error) {
    console.error('Leaderboard API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
