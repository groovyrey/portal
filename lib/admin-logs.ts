import { query } from './turso';

export interface AdminLog {
  id?: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  targetId: string;
  targetName?: string;
  action: string;
  details: string;
}

export async function logAdminAction(data: Omit<AdminLog, 'id' | 'timestamp'>) {
  try {
    const now = new Date().toISOString();
    await query(`
      INSERT INTO admin_logs (timestamp, admin_id, admin_name, target_id, target_name, action, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      now, data.adminId, data.adminName, data.targetId, data.targetName || null, data.action, data.details
    ]);
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

export async function getAdminLogs(maxCount: number = 50): Promise<AdminLog[]> {
  try {
    const res = await query('SELECT * FROM admin_logs ORDER BY timestamp DESC LIMIT ?', [maxCount]);
    
    return res.rows.map(data => ({
      id: data.id.toString(),
      timestamp: data.timestamp,
      adminId: data.admin_id,
      adminName: data.admin_name,
      targetId: data.target_id,
      targetName: data.target_name,
      action: data.action,
      details: data.details,
    }));
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    return [];
  }
}
