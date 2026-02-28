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

    const decrypted = decrypt(sessionCookie.value);
    const { userId, password } = JSON.parse(decrypted);

    if (!userId || !password) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { client } = await getSessionClient(userId);
    const scraper = new ScraperService(client, userId);
    
    // We need the dashboard to get the correct session-based URLs if redirect happens
    const { periodCode, dashboardUrl } = await scraper.fetchDashboard();
    
    // Specifically fetch the Account DM page
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
