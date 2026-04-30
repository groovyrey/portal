import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { collection, getDocs, doc, setDoc, query, where, orderBy, limit, deleteDoc, writeBatch, addDoc, getDoc } from 'firebase/firestore';
import { logAdminAction } from '@/lib/admin-logs';

/**
 * Maintenance Consolidated Cron Job
 * Handles system health checks, database cleanup, and optimizations.
 */

async function runDataAudit() {
  const studentsSnap = await getDocs(collection(db, 'students'));
  const incompleteStudents: string[] = [];
  
  studentsSnap.forEach(doc => {
    const data = doc.data();
    const missingFields: string[] = [];
    
    if (!data.name) missingFields.push('name');
    if (!data.course) missingFields.push('course');
    if (!data.email) missingFields.push('email');
    if (!data.yearLevel) missingFields.push('yearLevel');
    if (!data.section) missingFields.push('section');
    if (!data.schedule || data.schedule.length === 0) missingFields.push('schedule');
    if (!data.financials) missingFields.push('financials');

    if (missingFields.length > 0) {
      incompleteStudents.push(`${data.name || 'Unknown'} (${doc.id}): ${missingFields.join(', ')}`);
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
    totalAudited: studentsSnap.size, 
    incompleteCount: incompleteStudents.length,
    incompleteList: incompleteStudents.slice(0, 50) // Return some for cron results
  };
}

async function runDatabaseCleanup() {
  // Example: Clean up old notifications (older than 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const notificationsRef = collection(db, 'notifications');
  const q = query(notificationsRef, where('createdAt', '<', thirtyDaysAgo), limit(100));
  const snap = await getDocs(q);
  
  let deleted = 0;
  const batch = writeBatch(db);
  snap.docs.forEach(doc => {
    batch.delete(doc.ref);
    deleted++;
  });
  
  if (deleted > 0) {
    await batch.commit();
    await logAdminAction({
      adminId: 'system-cron',
      adminName: 'Maintenance Task',
      targetId: 'notifications',
      targetName: 'Notification Retention',
      action: 'DB_CLEANUP_SUCCESS',
      details: `Permanently deleted ${deleted} notifications older than 30 days.`
    });
  }
  
  return { deletedNotifications: deleted };
}

async function runSystemHealthCheck() {
  // Check critical collections
  const studentsSnap = await getDocs(query(collection(db, 'students'), limit(1)));
  const logsSnap = await getDocs(query(collection(db, 'admin_logs'), limit(1)));
  
  return {
    database: studentsSnap.size > 0 ? 'healthy' : 'warning',
    logs: logsSnap.size > 0 ? 'healthy' : 'warning',
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
    
    // --- Weekly Maintenance Map ---
    const dailyTasks = ['healthCheck', 'dataAudit'];
    const weeklyMaintenanceMap: Record<number, string[]> = {
      0: ['dbCleanup'], // Sunday: Deep clean
      3: ['logRotation'], // Wednesday: Optimization
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

    // Log the maintenance run with unique ID
    const runRef = collection(db, 'cron_runs');
    await addDoc(runRef, {
      jobId: 'maintenance-consolidated',
      status: 'success',
      lastRun: new Date().toISOString(),
      tasks: activeTasks,
      results: results.data
    });

    // Cleanup: Keep only last 15 records total for this jobId
    const q = query(
      collection(db, 'cron_runs'), 
      where('jobId', '==', 'maintenance-consolidated'),
      orderBy('lastRun', 'desc')
    );
    const snap = await getDocs(q);
    if (snap.size > 15) {
      const batch = writeBatch(db);
      snap.docs.slice(15).forEach(d => batch.delete(d.ref));
      await batch.commit();
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
