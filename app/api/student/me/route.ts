import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { initDatabase } from '@/lib/db-init';
import { decrypt } from '@/lib/auth';
import { getFullStudentData } from '@/lib/data-service';
import { getSessionClient } from '@/lib/session-proxy';
import { ScraperService } from '@/lib/scraper-service';
import { SyncService } from '@/lib/sync-service';
import { publishUpdate } from '@/lib/realtime';
import * as cheerio from 'cheerio';

const AUTO_SYNC_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session_token');
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let userId = "";
    let password = "";
    try {
      const decrypted = decrypt(sessionCookie.value);
      const sessionData = JSON.parse(decrypted);
      userId = sessionData.userId;
      password = sessionData.password;
      if (!userId || !password) throw new Error("Incomplete session data");
    } catch (e: any) {
      console.error('Session decryption failed:', e.message);
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    await initDatabase();

    // Use Centralized Data Service
    try {
        const studentData = await getFullStudentData(userId);
        
        if (!studentData) {
          console.warn(`Student document for ${userId} not found via Data Service`);
          return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // --- AUTO-SYNC LOGIC ---
        // Check if data is stale
        const lastUpdate = studentData.updated_at?.toDate ? studentData.updated_at.toDate() : new Date(studentData.updated_at || 0);
        const isStale = (Date.now() - lastUpdate.getTime()) > AUTO_SYNC_THRESHOLD_MS;

        if (isStale) {
          console.log(`Data for ${userId} is stale. Triggering background sync...`);
          // Trigger background sync (non-blocking)
          // We don't use 'await' here to return the response immediately
          backgroundSync(userId, password).catch(err => {
            console.error('Background sync failed:', err);
          });
        }

        return NextResponse.json({ success: true, data: studentData });

    } catch (fetchError: any) {
        console.error('Data Service fetch error in /api/student/me:', fetchError.message);
        return NextResponse.json({ error: 'Failed to retrieve student data' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Session restore error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Background Synchronization Function
 */
async function backgroundSync(userId: string, password: string) {
  const { client, jar, isLocked, consecutiveFailures } = await getSessionClient(userId);
  
  if (isLocked) {
      console.log(`[AutoSync] Skipping for ${userId}: Session is locked or in cooldown.`);
      return;
  }

  const scraper = new ScraperService(client, userId);
  const syncer = new SyncService(userId);

  // Re-verify login if session is not already active
  const dashboardRes = await scraper.fetchDashboard();
  let $dashboard = dashboardRes.$;
  
  const hasLoginButton = $dashboard('input[name="obtnLogin"], #obtnLogin, input[value="LOGIN"]').length > 0;
  if (hasLoginButton) {
      if ((consecutiveFailures || 0) >= 3) {
          console.warn(`[AutoSync] Aborting login for ${userId}: Too many consecutive failures.`);
          return;
      }

      console.log(`[AutoSync] Re-logging in for ${userId}...`);
      const { acquireRefreshLock, saveSession } = await import('@/lib/session-proxy');
      await acquireRefreshLock(userId);

      const initRes = await client.get(`https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${userId}`);
      const finalInitUrl = initRes.request.res.responseUrl || initRes.config.url;
      const $init = cheerio.load(initRes.data);

      const formData: any = {};
      $init('input[type="hidden"]').each((_, el) => {
          const name = $init(el).attr('name');
          if (name) formData[name] = $init(el).val() || '';
      });
      formData.otbUserID = userId;
      formData.otbPassword = password;
      formData.obtnLogin = 'LOGIN';

      const loginForm = $init('#Login').length ? $init('#Login') : $init('form').first();
      const loginAction = loginForm.attr('action') || './LCC.Login.aspx';
      const loginUrl = new URL(loginAction, finalInitUrl || "").toString();

      const loginRes = await client.post(loginUrl, new URLSearchParams(formData).toString(), {
          headers: { 
              'Content-Type': 'application/x-www-form-urlencoded',
              'Referer': finalInitUrl || "",
              'Origin': 'https://premium.schoolista.com'
          },
      });
      $dashboard = cheerio.load(loginRes.data);
      const stillHasLogin = $dashboard('input[name="obtnLogin"], #obtnLogin, input[value="LOGIN"]').length > 0;
      
      await saveSession(userId, jar, !stillHasLogin);
      
      if (stillHasLogin) {
          console.error(`[AutoSync] Re-login failed for ${userId}. Aborting sync.`);
          return;
      }
  }

  const { periodCode, dashboardUrl } = await scraper.fetchDashboard();
  const [eafRes, subListRes, gradesRes, accountsRes] = await Promise.all([
    scraper.fetchEAF(periodCode),
    scraper.fetchSubjectList(periodCode, dashboardUrl, $dashboard),
    scraper.fetchGrades(periodCode, dashboardUrl),
    scraper.fetchAccounts(periodCode, dashboardUrl)
  ]);

  const studentInfo = scraper.parseStudentInfo($dashboard, eafRes.$);
  const schedule = scraper.parseSchedule(eafRes.$);
  const financials = scraper.parseFinancials(eafRes.$);
  const extraFinancials = scraper.parseAccounts(accountsRes.$);

  const mergedFinancials = {
    ...financials,
    ...extraFinancials
  };

  const reportLinks = scraper.parseReportCardLinks(gradesRes.$);
  const offeredSubjects = scraper.parseOfferedSubjects(subListRes.$);

  await syncer.syncStudentData(studentInfo, reportLinks);
  await Promise.all([
    syncer.syncFinancials(mergedFinancials),
    syncer.syncSchedule(schedule),
    syncer.syncProspectusSubjects(offeredSubjects),
    syncer.syncToPostgres(studentInfo)
  ]);

  // Notify client via Ably
  await publishUpdate(`student-${userId}`, { type: 'SYNC_COMPLETE' });
  
  console.log(`Auto-sync completed for student ${userId}`);
}
