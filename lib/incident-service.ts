import { query } from './turso';
import { initDatabase } from './db-init';

export interface IncidentReport {
  id?: number;
  task: string;
  user_id?: string;
  error_message?: string;
  ai_result?: any;
  raw_html?: string;
  severity?: 'warning' | 'error';
  created_at?: string;
}

/**
 * Incident Service
 * Logs system failures and unexpected behavior for administrative review.
 */
export async function logIncident(report: IncidentReport) {
  try {
    await initDatabase();
    
    const { task, user_id, error_message, ai_result, raw_html, severity = 'warning' } = report;
    
    await query(
      `INSERT INTO incident_reports (task, user_id, error_message, ai_result, raw_html, severity) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        task, 
        user_id || 'system', 
        error_message || 'Unknown Error', 
        ai_result ? JSON.stringify(ai_result) : null, 
        raw_html || null, 
        severity
      ]
    );
    
    console.log(`[Incident-Service] Logged incident for task: ${task}`);
  } catch (error) {
    console.error('[Incident-Service] Failed to log incident:', error);
  }
}

export async function getIncidents(limit: number = 50) {
  try {
    await initDatabase();
    
    const result = await query(
      `SELECT i.*, s.name as student_name, s.course as student_course 
       FROM incident_reports i
       LEFT JOIN students s ON i.user_id = s.id
       ORDER BY i.created_at DESC LIMIT ?`,
      [limit]
    );
    return result.rows;
  } catch (error) {
    console.error('[Incident-Service] Failed to fetch incidents:', error);
    return [];
  }
}

export async function deleteIncident(id: number) {
  try {
    await initDatabase();
    
    await query(`DELETE FROM incident_reports WHERE id = ?`, [id]);
    return true;
  } catch (error) {
    console.error('[Incident-Service] Failed to delete incident:', error);
    return false;
  }
}
