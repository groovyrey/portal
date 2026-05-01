import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export async function GET() {
  try {
    const runsRef = collection(db, 'cron_runs');
    const q = query(runsRef, orderBy('lastRun', 'desc'), limit(20));
    const snap = await getDocs(q);
    
    const allRuns = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
