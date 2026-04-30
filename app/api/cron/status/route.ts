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

    // Check Proxy Health
    let proxyStatus = 'unconfigured';
    let proxyLatency = null;
    
    if (process.env.RENDER_PROXY_URL) {
      try {
        const start = performance.now();
        const proxyRes = await fetch(`${process.env.RENDER_PROXY_URL}/health`, { signal: AbortSignal.timeout(3000) });
        const end = performance.now();
        if (proxyRes.ok) {
          proxyStatus = 'operational';
          proxyLatency = Math.round(end - start);
        } else {
          proxyStatus = 'degraded';
        }
      } catch (e) {
        proxyStatus = 'down';
      }
    }

    return NextResponse.json({
      date: new Date().toISOString().split('T')[0],
      jobs: {
        daily: daily || { status: 'pending' },
        maintenance: maintenance || { status: 'pending' }
      },
      proxy: {
        status: proxyStatus,
        latency: proxyLatency,
        url: process.env.RENDER_PROXY_URL?.replace(/^https?:\/\//, '')
      },
      history: allRuns
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
