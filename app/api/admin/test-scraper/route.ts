import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { getSessionClient } from '@/lib/session-proxy';
import { ScraperService } from '@/lib/scraper-service';
import { aiExtract } from '@/lib/ai-scraper';

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
    let aiData: any = null;

    const dashboard = await scraper.fetchDashboard();
    url = dashboard.dashboardUrl;

    if (task === 'student_info') {
        const eaf = await scraper.fetchEAF(dashboard.periodCode);
        html = dashboard.data + "\n" + eaf.data;
        traditionalData = await scraper.parseStudentInfo(dashboard.$, eaf.$);
        aiData = await aiExtract(html, 'student_info');
    } else if (task === 'schedule') {
        const eaf = await scraper.fetchEAF(dashboard.periodCode);
        url = `${dashboard.dashboardUrl} (via EAF)`;
        html = eaf.data;
        traditionalData = await scraper.parseSchedule(eaf.$);
        aiData = await aiExtract(html, 'schedule');
    } else if (task === 'financials') {
        const accounts = await scraper.fetchAccounts(dashboard.periodCode, dashboard.dashboardUrl);
        url = `${dashboard.dashboardUrl} (via Accounts)`;
        html = accounts.data;
        traditionalData = scraper.parseAccounts(accounts.$);
        aiData = await aiExtract(html, 'financials');
    } else if (task === 'grades') {
        const gradesPage = await scraper.fetchGrades(dashboard.periodCode, dashboard.dashboardUrl);
        const reports = scraper.parseReportCardLinks(gradesPage.$);
        
        if (reports.length > 0) {
            const report = await scraper.fetchReportCard(reports[0].href, dashboard.dashboardUrl);
            url = reports[0].href;
            html = report.data;
            traditionalData = await scraper.parseReportCard(report.$);
            aiData = await aiExtract(html, 'grades');
        } else {
            return NextResponse.json({ error: 'No report cards found.' }, { status: 404 });
        }
    }

    // Generate the "Cleaned" snippet that is actually sent to the AI
    const cleanedForAi = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
        .replace(/\s+/g, ' ')
        .substring(0, 40000);

    // Truly raw snippet for UI preview
    const rawSnippet = html.substring(0, 10000);

    return NextResponse.json({ 
        url,
        task,
        rawSnippet,
        cleanedForAi: cleanedForAi.substring(0, 20000), // Limit for response size
        traditionalData,
        aiData,
    });

  } catch (error: any) {
    console.error('[Test-Scraper] Fatal Error:', error);
    return NextResponse.json({ error: 'Extraction failed: ' + error.message }, { status: 500 });
  }
}
