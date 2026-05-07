import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/turso';
import { logAdminAction } from '@/lib/admin-logs';

/**
 * Maintenance Consolidated Cron Job (Turso Implementation)
 * Handles system health checks, database cleanup, and optimizations.
 */

async function runDataAudit() {
  const res = await query('SELECT * FROM students');
  const incompleteStudents: string[] = [];
  
  res.rows.forEach(data => {
    const missingFields: string[] = [];
    
    if (!data.name) missingFields.push('name');
    if (!data.course) missingFields.push('course');
    if (!data.email) missingFields.push('email');
    if (!data.year_level) missingFields.push('yearLevel');

    if (missingFields.length > 0) {
      incompleteStudents.push(`${data.name || 'Unknown'} (${data.id}): ${missingFields.join(', ')}`);
    }
  });

  if (incompleteStudents.length > 0) {
    await logAdminAction({
      adminId: 'system-cron',
      adminName: 'Maintenance Task',
      targetId: 'all-students',
      targetName: 'Data Integrity Audit',
      action: 'AUDIT_FOUND_INCOMPLETE',
      details: `Found ${incompleteStudents.length} students with missing fields: ${incompleteStudents.slice(0, 10).join('; ')}${incompleteStudents.length > 10 ? '...' : ''}`
    });
  }

  return { 
    totalAudited: res.rowCount, 
    incompleteCount: incompleteStudents.length,
    incompleteList: incompleteStudents.slice(0, 50) 
  };
}

async function runDatabaseCleanup() {
  // Example: Clean up old activity logs (older than 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const isoDate = thirtyDaysAgo.toISOString();
  
  const res = await query('DELETE FROM activity_logs WHERE created_at < ?', [isoDate]);
  const deleted = res.rowsAffected;
  
  if (deleted > 0) {
    await logAdminAction({
      adminId: 'system-cron',
      adminName: 'Maintenance Task',
      targetId: 'activity_logs',
      targetName: 'Log Retention',
      action: 'DB_CLEANUP_SUCCESS',
      details: `Permanently deleted ${deleted} activity logs older than 30 days.`
    });
  }
  
  return { deletedLogs: deleted };
}

async function runSystemHealthCheck() {
  // Check critical tables
  const studentsSnap = await query('SELECT 1 FROM students LIMIT 1');
  const logsSnap = await query('SELECT 1 FROM admin_logs LIMIT 1');
  
  return {
    database: studentsSnap.rowCount >= 0 ? 'healthy' : 'warning',
    logs: logsSnap.rowCount >= 0 ? 'healthy' : 'warning',
    timestamp: new Date().toISOString()
  };
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const phTime = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Manila"}));
    const dayIndex = phTime.getDay();
    
    const dailyTasks = ['healthCheck', 'dataAudit'];
    const weeklyMaintenanceMap: Record<number, string[]> = {
      0: ['dbCleanup'], 
      3: ['logRotation'], 
    };

    const activeTasks = [...dailyTasks, ...(weeklyMaintenanceMap[dayIndex] || [])];
    const results: any = { tasks: activeTasks, data: {} };

    if (activeTasks.includes('healthCheck')) {
      results.data.health = await runSystemHealthCheck();
      await logAdminAction({
        adminId: 'system-cron',
        adminName: 'Maintenance Task',
        targetId: 'system-health',
        targetName: 'Health Check',
        action: 'CRON_HEALTH_REPORT',
        details: `System check complete. Database: ${results.data.health.database}, Logs: ${results.data.health.logs}.`
      });
    }
    if (activeTasks.includes('dataAudit')) {
      results.data.audit = await runDataAudit();
    }
    if (activeTasks.includes('dbCleanup')) {
      results.data.cleanup = await runDatabaseCleanup();
    }

    // Log the maintenance run
    await query(`
      INSERT INTO cron_runs (job_id, status, last_run, tasks, results)
      VALUES (?, ?, ?, ?, ?)
    `, [
      'maintenance-consolidated', 
      'success', 
      new Date().toISOString(), 
      JSON.stringify(activeTasks), 
      JSON.stringify(results.data)
    ]);

    // Cleanup: Keep only last 15 records total for this jobId
    await query(`
      DELETE FROM cron_runs 
      WHERE job_id = 'maintenance-consolidated' 
      AND id NOT IN (
        SELECT id FROM cron_runs 
        WHERE job_id = 'maintenance-consolidated' 
        ORDER BY last_run DESC 
        LIMIT 15
      )
    `);

    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    console.error('Maintenance cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
