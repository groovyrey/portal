import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/turso';
import { decrypt } from '@/lib/auth';

const EXP_PER_SCORE = 20;
const FEATURED_BONUS_MULTIPLIER = 2.0;
const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  easy: 1,
  medium: 1.5,
  hard: 2,
  default: 1.2
};

// Mock getPHDate and getFeaturedCategory if needed or import correctly
import { getPHDate } from '@/lib/utils';
import { getFeaturedCategory } from '@/lib/constants';

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

    try {
      const decrypted = decrypt(sessionCookie.value);
      const sessionData = JSON.parse(decrypted);
      const sessionUserId = sessionData.userId;
      
      if (sessionUserId !== studentId) {
         return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const today = getPHDate();

    const [statsResult, dailyQuestsResult] = await Promise.all([
      query(`
        SELECT 
          level, 
          exp, 
          total_quests as "totalQuests", 
          total_score as "totalScore", 
          last_quest_at as "lastQuestAt",
          streak
        FROM student_stats 
        WHERE user_id = ?
      `, [studentId]),
      query(`
        SELECT score, category, difficulty FROM daily_quests 
        WHERE user_id = ? AND quest_date = ? AND stats_updated = 1
      `, [studentId, today])
    ]);

    if (statsResult.rowCount === 0) {
       return NextResponse.json({ 
         level: 1, 
         exp: 0, 
         totalQuests: 0, 
         totalScore: 0, 
         lastQuestAt: null, 
         streak: 0, 
         dailyExp: 0,
         featuredCategory: getFeaturedCategory()
       });
    }

    // Calculate dailyExp
    let dailyExp = 0;
    const rows = dailyQuestsResult.rows as any[];
    rows.forEach((row: any) => {
      const m = DIFFICULTY_MULTIPLIER[row.difficulty?.toLowerCase()] || DIFFICULTY_MULTIPLIER.default;
      const feat = row.category === getFeaturedCategory();
      dailyExp += Math.floor(row.score * EXP_PER_SCORE * m * (feat ? FEATURED_BONUS_MULTIPLIER : 1.0));
    });

    return NextResponse.json({
      ...statsResult.rows[0],
      dailyExp,
      featuredCategory: getFeaturedCategory()
    });

  } catch (error) {
    console.error('Fetch Stats API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
