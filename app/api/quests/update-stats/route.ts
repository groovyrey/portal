import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/turso';
import { decrypt } from '@/lib/auth';
import { SyncService } from '@/lib/sync-service';
import { getPHDate } from '@/lib/utils';
import { getFeaturedCategory } from '@/lib/constants';

export const maxDuration = 300;

const EXP_PER_SCORE = 20;
const DAILY_EXP_CAP = 500;
const FEATURED_BONUS_MULTIPLIER = 2.0;

const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  easy: 1,
  medium: 1.5,
  hard: 2,
  default: 1.2
};

function calculateLevel(exp: number) {
  return Math.floor(Math.sqrt(exp / 100)) + 1;
}

export async function POST(req: NextRequest) {
  try {
    const { score, difficulty, studentId, category } = await req.json();

    if (!category) return NextResponse.json({ error: 'Category required' }, { status: 400 });
    
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

    const syncer = new SyncService(studentId);
    const today = getPHDate();

    // 1. Check if this quest's stats were already processed
    const questResult = await query(`
      SELECT quest_date, is_completed, stats_updated, score as stored_score FROM daily_quests 
      WHERE user_id = ? AND category = ?
    `, [studentId, category]);

    if (questResult.rowCount === 0) {
      return NextResponse.json({ error: 'Quest record not found for this category' }, { status: 404 });
    }

    const dailyQuest = questResult.rows[0];

    if (!dailyQuest.is_completed) {
      return NextResponse.json({ error: 'Quest must be completed before updating stats' }, { status: 400 });
    }

    if (dailyQuest.stats_updated) {
      return NextResponse.json({ 
        error: 'Stats already updated for this category quest',
        alreadyUpdated: true 
      }, { status: 400 });
    }

    // 2. Calculate Base Gained EXP
    const isFeatured = category === getFeaturedCategory();
    const multiplier = DIFFICULTY_MULTIPLIER[difficulty?.toLowerCase()] || DIFFICULTY_MULTIPLIER.default;
    let gainedExp = Math.floor(score * EXP_PER_SCORE * multiplier * (isFeatured ? FEATURED_BONUS_MULTIPLIER : 1.0));

    // 3. Apply Global Daily EXP Cap
    const todayStatsResult = await query(`
      SELECT score, category, difficulty FROM daily_quests 
      WHERE user_id = ? AND quest_date = ? AND stats_updated = 1
    `, [studentId, today]);

    let totalExpToday = 0;
    const statsRows = todayStatsResult.rows as any[];
    statsRows.forEach((row: any) => {
      const m = DIFFICULTY_MULTIPLIER[row.difficulty?.toLowerCase()] || DIFFICULTY_MULTIPLIER.default;
      const feat = row.category === getFeaturedCategory();
      totalExpToday += Math.floor(row.score * EXP_PER_SCORE * m * (feat ? FEATURED_BONUS_MULTIPLIER : 1.0));
    });

    const remainingCap = Math.max(0, DAILY_EXP_CAP - totalExpToday);
    const finalGainedExp = Math.min(gainedExp, remainingCap);

    // 4. Update Stats & Streak
    const statsResult = await query(`
      SELECT exp, level, total_quests, streak, last_quest_date FROM student_stats WHERE user_id = ?
    `, [studentId]);

    let currentStats = statsResult.rowCount > 0 ? statsResult.rows[0] : { exp: 0, level: 1, total_quests: 0, streak: 0, last_quest_date: null };
    
    // Streak Logic
    let newStreak = currentStats.streak || 0;
    const lastDate = currentStats.last_quest_date;
    
    if (lastDate) {
      const last = new Date(lastDate);
      const now = new Date(today);
      const diffTime = Math.abs(now.getTime() - last.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const newExp = (currentStats.exp || 0) + finalGainedExp;
    const newLevel = calculateLevel(newExp);
    const levelUp = newLevel > (currentStats.level || 1);

    await query(`
      INSERT INTO student_stats (user_id, level, exp, total_quests, total_score, last_quest_at, last_quest_date, streak, updated_at)
      VALUES (?, ?, ?, 1, ?, CURRENT_TIMESTAMP, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET 
        exp = exp + ?,
        level = ?,
        total_quests = total_quests + 1,
        total_score = total_score + ?,
        last_quest_at = CURRENT_TIMESTAMP,
        last_quest_date = ?,
        streak = ?,
        updated_at = CURRENT_TIMESTAMP
    `, [
      studentId, newLevel, newExp, score, today, newStreak,
      finalGainedExp, newLevel, score, today, newStreak
    ]);

    await query(`
      UPDATE daily_quests 
      SET stats_updated = 1, difficulty = ?
      WHERE user_id = ? AND category = ?
    `, [difficulty || 'medium', studentId, category]);

    // 5. Badges
    const grantedBadges = [];
    if (score === 10) {
      if (await syncer.grantBadge('quest_master')) grantedBadges.push('quest_master');
    }
    if (newLevel >= 100) {
      if (await syncer.grantBadge('centurion')) grantedBadges.push('centurion');
    }
    if (newStreak >= 7) {
      if (await syncer.grantBadge('consistent_quester')) grantedBadges.push('consistent_quester');
    }

    return NextResponse.json({
      success: true,
      gainedExp: finalGainedExp,
      originalGainedExp: gainedExp,
      isCapped: finalGainedExp < gainedExp,
      newExp,
      newLevel,
      levelUp,
      streak: newStreak,
      totalQuests: (currentStats.total_quests || 0) + 1,
      grantedBadges,
      isFeatured
    });

  } catch (error) {
    console.error('Update Stats API Error:', error);
    return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 });
  }
}
