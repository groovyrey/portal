import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { PORTAL_BASE } from '@/lib/constants';

/**
 * Portal Health Monitor Cron Job
 * Runs every hour to check if the school portal is responding correctly.
 */

export async function GET(req: NextRequest) {
  // 1. Verify Vercel Cron Secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const start = Date.now();
    const res = await axios.get(`${PORTAL_BASE}/Student/LCC.Login.aspx`, {
      timeout: 10000, // 10 seconds timeout
      validateStatus: () => true, // Don't throw on 404/500
    });
    const latency = Date.now() - start;

    const isHealthy = res.status === 200 && res.data.includes('otbUserID');

    console.log(`Portal Health Check: ${isHealthy ? 'Healthy' : 'Unhealthy'} (${res.status}) - ${latency}ms`);

    // Future: Save status to Firestore/Postgres to show a "Portal Offline" banner in the UI
    // await db.doc('system/status').set({ portal_online: isHealthy, last_check: new Date() });

    return NextResponse.json({ 
      success: true, 
      healthy: isHealthy, 
      status: res.status,
      latency: `${latency}ms`
    });

  } catch (error: any) {
    console.error('Portal Health Check Error:', error.message);
    return NextResponse.json({ 
      success: false, 
      healthy: false, 
      error: error.message 
    }, { status: 500 });
  }
}
