import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/turso';
import { decrypt } from '@/lib/auth';
import { adminDb as db } from '@/lib/firebase-admin'; // Use Admin SDK for server-side Firestore
import { SyncService } from '@/lib/sync-service';

export const maxDuration = 300;

const EXP_PER_SCORE = 20;
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
    const { score, difficulty, studentId, expGranted } = await req.json();
    
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

    const syncer = new SyncService(studentId);
    const today = new Date().toISOString().split('T')[0];

    // 1. Check if this quest's stats were already processed
    const questResult = await query(`
      SELECT is_completed, stats_updated FROM daily_quests 
      WHERE user_id = ? AND quest_date = ?
    `, [studentId, today]);

    if (questResult.rowCount === 0) {
      return NextResponse.json({ error: 'Quest record not found for today' }, { status: 404 });
    }

    const dailyQuest = questResult.rows[0];
    if (!dailyQuest.is_completed) {
      return NextResponse.json({ error: 'Quest must be completed before updating stats' }, { status: 400 });
    }

    if (dailyQuest.stats_updated) {
      return NextResponse.json({ 
        error: 'Stats already updated for today\'s quest',
        alreadyUpdated: true 
      }, { status: 400 });
    }

    // 2. Ensure student info exists in Turso
    let studentResult = await query(`SELECT id FROM students WHERE id = ?`, [studentId]);
    if (studentResult.rowCount === 0) {
      const studentDoc = await db.collection('students').doc(studentId).get();
      if (studentDoc.exists) {
        const studentData = studentDoc.data();
        await query(`
          INSERT INTO students (id, name, course, email, year_level, semester, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [studentId, studentData?.name || 'Unknown', studentData?.course || '', studentData?.email || '', studentData?.year_level || '', studentData?.semester || '']);
      }
    }

    // 3. Calculate EXP
    let gainedExp = expGranted;
    if (gainedExp === undefined || gainedExp === null) {
      const multiplier = DIFFICULTY_MULTIPLIER[difficulty?.toLowerCase()] || DIFFICULTY_MULTIPLIER.default;
      gainedExp = Math.floor(score * EXP_PER_SCORE * multiplier);
    }

    // 4. Update Stats
    await query(`
      INSERT INTO student_stats (user_id, level, exp, total_quests, total_score, last_quest_at, updated_at)
      VALUES (?, 1, 0, 0, 0, NULL, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO NOTHING;
    `, [studentId]);

    const statsResult = await query(`SELECT exp, level, total_quests FROM student_stats WHERE user_id = ?`, [studentId]);
    const currentStats = statsResult.rows[0];
    const newExp = (currentStats.exp || 0) + gainedExp;
    const newLevel = calculateLevel(newExp);
    const levelUp = newLevel > (currentStats.level || 1);

    await query(`
      UPDATE student_stats 
      SET 
        exp = exp + ?,
        level = ?,
        total_quests = total_quests + 1,
        total_score = total_score + ?,
        last_quest_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `, [gainedExp, newLevel, score, studentId]);

    await query(`
      UPDATE daily_quests 
      SET stats_updated = 1 
      WHERE user_id = ? AND quest_date = ?
    `, [studentId, today]);

    // 5. Badges
    const grantedBadges = [];
    if (score === 10) {
      if (await syncer.grantBadge('quest_master')) grantedBadges.push('quest_master');
    }
    if (newLevel >= 100) {
      if (await syncer.grantBadge('centurion')) grantedBadges.push('centurion');
    }

    return NextResponse.json({
      success: true,
      gainedExp,
      newExp,
      newLevel,
      levelUp,
      totalQuests: (currentStats.total_quests || 0) + 1,
      grantedBadges
    });

  } catch (error) {
    console.error('Update Stats API Error:', error);
    return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 });
  }
}
