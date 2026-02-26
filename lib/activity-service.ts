import { query } from './pg';

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  link?: string;
  createdAt: string;
}

/**
 * Logs a student activity to the PostgreSQL database
 */
export async function logActivity(
  userId: string, 
  action: string, 
  details?: string, 
  link?: string
) {
  try {
    // Ensure student exists in PG first (handled by standard sync, but safe to check)
    await query(`
      INSERT INTO activity_logs (user_id, action, details, link)
      VALUES ($1, $2, $3, $4)
    `, [userId, action, details || null, link || null]);
    
    console.log(`[ActivityLog] ${userId}: ${action}`);
  } catch (error) {
    console.error('[ActivityLog] Error saving activity log:', error);
  }
}

/**
 * Fetches the latest activity logs for a specific user
 */
export async function getUserActivityLogs(userId: string, limit: number = 20): Promise<ActivityLog[]> {
  try {
    const res = await query(`
      SELECT * FROM activity_logs 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `, [userId, limit]);
    
    return res.rows.map(row => ({
      id: row.id.toString(),
      userId: row.user_id,
      action: row.action,
      details: row.details,
      link: row.link,
      createdAt: row.created_at.toISOString()
    }));
  } catch (error) {
    console.error('[ActivityLog] Error fetching activity logs:', error);
    return [];
  }
}
