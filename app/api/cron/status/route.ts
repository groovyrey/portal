import { NextResponse } from 'next/server';
import { query } from '@/lib/turso';

export async function GET() {
  try {
    const res = await query('SELECT * FROM cron_runs ORDER BY last_run DESC LIMIT 20');
    
    const allRuns = res.rows.map(row => ({
      id: row.id.toString(),
      jobId: row.job_id,
      status: row.status,
      lastRun: row.last_run,
      tasks: row.tasks,
      results: row.results
    }));

    // Find the latest for each jobId for the main cards
    const daily = allRuns.find(r => r.jobId === 'daily-consolidated');
    const maintenance = allRuns.find(r => r.jobId === 'maintenance-consolidated');

    return NextResponse.json({
      date: new Date().toISOString().split('T')[0],
      jobs: {
        daily: daily || { status: 'pending' },
        maintenance: maintenance || { status: 'pending' }
      },
      history: allRuns
    });
  } catch (error: any) {
    console.error('Cron status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
