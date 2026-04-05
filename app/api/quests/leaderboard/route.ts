import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/turso';

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get('type') || 'all-time';

    let leaderboard;

    if (type === 'weekly') {
      leaderboard = await query(`
        SELECT 
          s.id, 
          s.name, 
          s.course,
          ss.level, 
          SUM(dq.score * 20) as exp, -- Weighted score as approximate EXP
          COUNT(dq.category) as quests_this_week
        FROM daily_quests daily_quests
        JOIN students s ON daily_quests.user_id = s.id
        JOIN student_stats ss ON daily_quests.user_id = ss.user_id
        WHERE daily_quests.updated_at >= date('now', '-7 days') AND daily_quests.stats_updated = 1
        GROUP BY s.id
        ORDER BY exp DESC
        LIMIT 20
      `);
    } else {
      leaderboard = await query(`
        SELECT 
          s.id, 
          s.name, 
          s.course,
          ss.level, 
          ss.exp, 
          ss.total_quests as "totalQuests", 
          ss.total_score as "totalScore"
        FROM student_stats ss
        JOIN students s ON ss.user_id = s.id
        ORDER BY ss.exp DESC
        LIMIT 20
      `);
    }

    return NextResponse.json(leaderboard.rows);
  } catch (error) {
    console.error('Leaderboard API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
