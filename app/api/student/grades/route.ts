import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/turso';
import { decrypt } from '@/lib/auth';
import { getSessionClient, saveSession, getPortalPassword } from '@/lib/session-proxy';
import { ScraperService } from '@/lib/scraper-service';
import { SyncService } from '@/lib/sync-service';
import { initDatabase } from '@/lib/db-init';

export async function POST(req: NextRequest) {
  // Ensure database is initialized
  await initDatabase().catch(e => console.error('DB Init Error:', e));

  let debugLog = "";
  try {
    const body = await req.json();

    // Require a valid session. userId is ALWAYS derived from the decrypted
    // session cookie, never from the request body, so this endpoint cannot be
    // used as an open proxy with arbitrary credentials.
    const sessionCookie = req.cookies.get('session_token');
    let userId = '';
    if (sessionCookie && sessionCookie.value) {
      try {
        const decrypted = decrypt(sessionCookie.value);
        const sessionData = JSON.parse(decrypted);
        if (sessionData.userId) {
          userId = sessionData.userId;
        }
      } catch (e) {
        console.error('Failed to decrypt session cookie');
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Missing required parameters or valid session' }, { status: 401 });
    }

    // The password is never stored in the cookie; fetch it server-side.
    const password = await getPortalPassword(userId);
    if (!password) {
      return NextResponse.json({ error: 'Missing required parameters or valid session' }, { status: 401 });
    }

    // --- OPTIMIZATION: CACHE-FIRST CHECK ---
    // Normalize input: accept a single report {href, reportName} (legacy) or a
    // batch {reports:[{href, reportName}]} so all report cards can be fetched
    // against one shared portal session.
    const escapeReportName = (href: string, override?: string): string => {
      if (override) return override;
      if (href && href.includes('_nm=')) {
        const match = href.match(/_nm=([^&]+)/);
        if (match) return decodeURIComponent(match[1].replace(/\+/g, ' '));
      }
      return 'Unknown Report';
    };

    const refresh = !!body.refresh;
    const isBatch = Array.isArray(body.reports) && body.reports.length > 0;
    const reportList: Array<{ href: string; reportName: string }> = (isBatch ? body.reports : [body]).map((r: any) => ({
      href: String(r.href || ''),
      reportName: escapeReportName(String(r.href || ''), r.reportName),
    }));

    if (reportList.length === 0 || reportList.some(r => !r.href)) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 401 });
    }

    // Partition into fresh (served from Turso cache) and stale (needs fetch).
    const cached: Record<string, any> = {};
    const toFetch: Array<{ href: string; reportName: string }> = [];
    if (!refresh) {
      for (const r of reportList) {
        try {
          const res = await query(
            'SELECT * FROM grades WHERE student_id = ? AND report_name = ? ORDER BY updated_at DESC',
            [userId, r.reportName]
          );
          if (res.rowCount > 0) {
            const lastUpdate = res.rows[0].updated_at ? new Date(res.rows[0].updated_at) : new Date(0);
            const isFresh = (Date.now() - lastUpdate.getTime()) < 1000 * 60 * 60 * 24; // 24 hours fresh
            if (isFresh) {
              const subjectsMap = new Map<string, any>();
              res.rows.forEach((item: any) => {
                const section = item.section || item.code || 'N/A';
                const subjectCode = item.subject_code || 'N/A';
                const key = `${section}-${item.description}`.toLowerCase();
                if (!subjectsMap.has(key)) {
                  subjectsMap.set(key, {
                    code: subjectCode,
                    section,
                    description: item.description,
                    grade: item.grade,
                    units: item.units,
                    remarks: item.remarks,
                  });
                }
              });
              cached[r.reportName] = Array.from(subjectsMap.values());
              continue;
            }
          }
        } catch (e) {
          console.warn('[Grades] Cache lookup failed:', e);
        }
        toFetch.push(r);
      }
    } else {
      toFetch.push(...reportList);
    }

    // Everything is fresh — return immediately without touching the portal.
    if (toFetch.length === 0) {
      const shape = (r: { href: string; reportName: string }) => ({
        report: r.reportName,
        subjects: cached[r.reportName] || [],
        is_cached: true,
      });
      return NextResponse.json(
        isBatch
          ? { success: true, reports: reportList.map(shape) }
          : { success: true, subjects: shape(reportList[0]).subjects, is_cached: true }
      );
    }

    const { client, jar, isNew, isLocked, consecutiveFailures, dashboardUrl: cachedDashboardUrl } = await getSessionClient(userId);

    if (isLocked) {
      return NextResponse.json({
        error: 'Session is currently busy or in cooldown. Please wait a moment.'
      }, { status: 429 });
    }

    const scraper = new ScraperService(client, userId);

    // Only pay for a dashboard round trip when we have no cached URL.
    let { dashboardUrl } = cachedDashboardUrl ? { dashboardUrl: cachedDashboardUrl } : await scraper.fetchDashboard();

    const doLogin = async () => {
      if ((consecutiveFailures || 0) >= 3) return false;
      const { acquireRefreshLock, saveSession } = await import('@/lib/session-proxy');
      await acquireRefreshLock(userId);
      const loginRes = await scraper.forceLogin(password);
      const hasLoginButton = loginRes.$('input[name="obtnLogin"], #obtnLogin, input[value="LOGIN"]').length > 0;
      await saveSession(userId, jar, !hasLoginButton, dashboardUrl);
      return !hasLoginButton;
    };

    if (isNew) {
      debugLog += `Ghost Session New: Performing login...\n`;
      if (!(await doLogin())) {
        return NextResponse.json({ error: 'Portal session expired and auto-login failed.' }, { status: 401 });
      }
    } else {
      debugLog += `Ghost Session Active: Bypassing login handshake.\n`;
    }

    // Fetch all needed report cards in parallel on the same authenticated
    // keep-alive session, instead of one sequential trip per report.
    const fetchOne = async (href: string, reportName: string) => {
      let $rc, rcHtml;
      try {
        ({ $: $rc, data: rcHtml } = await scraper.fetchReportCard(href, dashboardUrl));
      } catch (e: any) {
        if (e.message === 'SESSION_EXPIRED') {
          debugLog += `Session expired mid-fetch, forcing re-login...\n`;
          if (!(await doLogin())) {
            throw new Error('SESSION_EXPIRED');
          }
          const refreshed = await scraper.fetchDashboard();
          dashboardUrl = refreshed.dashboardUrl;
          ({ $: $rc, data: rcHtml } = await scraper.fetchReportCard(href, dashboardUrl));
        } else {
          throw e;
        }
      }

      const subjects = await scraper.parseReportCard($rc, rcHtml);

      try {
        if (subjects && subjects.length > 0) {
          const syncer = new SyncService(userId);
          await syncer.syncGrades(reportName, subjects);
        }
      } catch (dbError) {
        console.error('Database sync error (grades):', dbError);
      }

      return { report: reportName, subjects };
    };

    const results = await Promise.allSettled(
      toFetch.map(r => fetchOne(r.href, r.reportName))
    );

    const byReport: Record<string, any> = { ...cached };
    results.forEach((res, i) => {
      const name = toFetch[i].reportName;
      if (res.status === 'fulfilled') {
        byReport[name] = res.value.subjects;
      } else if (!byReport[name]) {
        byReport[name] = [];
      }
    });

    const shape = (r: { href: string; reportName: string }) => ({
      report: r.reportName,
      subjects: byReport[r.reportName] || [],
    });

    if (isBatch) {
      return NextResponse.json({ success: true, reports: reportList.map(shape) });
    }
    return NextResponse.json({ success: true, subjects: shape(reportList[0]).subjects });
  } catch (error: any) {
    console.error('Grades fetch error:', error.message);
    return NextResponse.json({ success: false, error: "Failed to fetch grades." });
  }
}
