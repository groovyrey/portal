import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { getSessionClient } from '@/lib/session-proxy';
import { ScraperService } from '@/lib/scraper-service';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { task } = await req.json();
    
    // 1. Authenticate
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let userId;
    try {
      const decrypted = decrypt(sessionCookie.value);
      const sessionData = JSON.parse(decrypted);
      userId = sessionData.userId;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // 2. Get Session Client
    const { client } = await getSessionClient(userId);
    const scraper = new ScraperService(client, userId);

    // 3. Fetch Data & Parse
    let html = '';
    let url = '';
    let traditionalData: any = null;

    const dashboard = await scraper.fetchDashboard();
    url = dashboard.dashboardUrl;

    if (task === 'student_info') {
        const eaf = await scraper.fetchEAF(dashboard.periodCode);
        html = dashboard.data + "\n" + eaf.data;
        traditionalData = await scraper.parseStudentInfo(dashboard.$, eaf.$);
    } else if (task === 'schedule') {
        const eaf = await scraper.fetchEAF(dashboard.periodCode);
        url = `${dashboard.dashboardUrl} (via EAF)`;
        html = eaf.data;
        traditionalData = await scraper.parseSchedule(eaf.$);
    } else if (task === 'financials') {
        const accounts = await scraper.fetchAccounts(dashboard.periodCode, dashboard.dashboardUrl);
        url = `${dashboard.dashboardUrl} (via Accounts)`;
        html = accounts.data;
        traditionalData = scraper.parseAccounts(accounts.$);
    } else if (task === 'grades') {
        const gradesPage = await scraper.fetchGrades(dashboard.periodCode, dashboard.dashboardUrl);
        const reports = scraper.parseReportCardLinks(gradesPage.$);
        
        if (reports.length > 0) {
            const report = await scraper.fetchReportCard(reports[0].href, dashboard.dashboardUrl);
            url = reports[0].href;
            html = report.data;
            traditionalData = await scraper.parseReportCard(report.$);
        } else {
            return NextResponse.json({ error: 'No report cards found.' }, { status: 404 });
        }
    }

    // Truly raw snippet for UI preview
    const rawSnippet = html.substring(0, 10000);

    return NextResponse.json({ 
        url,
        task,
        rawSnippet,
        traditionalData,
    });

  } catch (error: any) {
    console.error('[Test-Scraper] Fatal Error:', error);
    return NextResponse.json({ error: 'Extraction failed: ' + error.message }, { status: 500 });
  }
}
