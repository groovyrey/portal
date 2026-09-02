import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { getSessionClient } from '@/lib/session-proxy';
import { ScraperService } from '@/lib/scraper-service';
import { logActivity } from '@/lib/activity-service';
import * as cheerio from 'cheerio';

export async function POST(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let userId = '';
    try {
      const decrypted = decrypt(sessionCookie.value);
      const sessionData = JSON.parse(decrypted);
      userId = sessionData.userId;
      if (!userId) throw new Error('Incomplete session data');
    } catch (e) {
      console.error('Session decryption failed:', e);
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { client, jar } = await getSessionClient(userId);
    const scraper = new ScraperService(client, userId);

    let { periodCode, dashboardUrl, isLoggedOut } = await scraper.fetchDashboard();

    if (isLoggedOut) {
      const { getPortalPassword } = await import('@/lib/session-proxy');
      const pw = await getPortalPassword(userId);
      if (pw) {
        await scraper.forceLogin(pw);
        const refreshed = await scraper.fetchDashboard();
        periodCode = refreshed.periodCode;
        dashboardUrl = refreshed.dashboardUrl;
        isLoggedOut = refreshed.isLoggedOut;
      }
      if (isLoggedOut) {
        return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
      }
    }

    const accountsRes = await scraper.fetchAccounts(periodCode, dashboardUrl);

    // Log diagnostic check
    logActivity(userId, 'System', 'Performed account diagnostic check').catch(e => {});

    return NextResponse.json({ 
      success: true, 
      html: accountsRes.data,
      url: `https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${userId}&_pc=${periodCode}&_dm=Account&_nm=`
    });

  } catch (error: any) {
    console.error('Diagnostic fetch error:', error.message);
    return NextResponse.json({ success: false, error: 'Failed to fetch diagnostic data.' }, { status: 500 });
  }
}
