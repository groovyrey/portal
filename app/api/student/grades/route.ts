import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/turso';
import { decrypt } from '@/lib/auth';
import { getSessionClient, saveSession } from '@/lib/session-proxy';
import { ScraperService } from '@/lib/scraper-service';
import { SyncService } from '@/lib/sync-service';
import { initDatabase } from '@/lib/db-init';

export async function POST(req: NextRequest) {
  // Ensure database is initialized
  await initDatabase().catch(e => console.error('DB Init Error:', e));

  let debugLog = "";
  try {
    const body = await req.json();
    const { href } = body;
    let { userId, password } = body;

    const sessionCookie = req.cookies.get('session_token');
    if (sessionCookie && sessionCookie.value) {
      try {
        const decrypted = decrypt(sessionCookie.value);
        const sessionData = JSON.parse(decrypted);
        if (sessionData.userId && sessionData.password) {
          userId = sessionData.userId;
          password = sessionData.password;
        }
      } catch (e) {
        console.error('Failed to decrypt session cookie');
      }
    }

    if (!userId || !password || !href) {
      return NextResponse.json({ error: 'Missing required parameters or valid session' }, { status: 401 });
    }

    // --- OPTIMIZATION: CACHE-FIRST CHECK ---
    let reportName = body.reportName || 'Unknown Report';
    if (reportName === 'Unknown Report' && href.includes('_nm=')) {
        const match = href.match(/_nm=([^&]+)/);
        if (match) reportName = decodeURIComponent(match[1].replace(/\+/g, ' '));
    }

    try {
        // In Turso, we check for existing grades for this student and SPECIFIC report.
        const res = await query(
          'SELECT * FROM grades WHERE student_id = ? AND report_name = ? ORDER BY updated_at DESC', 
          [userId, reportName]
        );
        
        if (res.rowCount > 0) {
            const lastUpdate = res.rows[0].updated_at ? new Date(res.rows[0].updated_at) : new Date(0);
            const isFresh = (Date.now() - lastUpdate.getTime()) < 1000 * 60 * 60 * 24; // 24 hours fresh

            if (isFresh) {
                // Return deduplicated grades
                const subjectsMap = new Map<string, any>();
                res.rows.forEach((item: any) => {
                  const section = item.section || item.code || 'N/A';
                  const subjectCode = item.subject_code || 'N/A';
                  const key = `${section}-${item.description}`.toLowerCase();
                  if (!subjectsMap.has(key)) {
                    subjectsMap.set(key, {
                      code: subjectCode,
                      section: section,
                      description: item.description,
                      grade: item.grade,
                      units: item.units,
                      remarks: item.remarks
                    });
                  }
                });

                console.log(`[Grades] Serving cached report "${reportName}" for ${userId}`);
                return NextResponse.json({ 
                    success: true, 
                    subjects: Array.from(subjectsMap.values()),
                    is_cached: true
                });
            }
        }
    } catch (e) {
        console.warn('[Grades] Cache lookup failed:', e);
    }

    const { client, jar, isNew, isLocked, consecutiveFailures } = await getSessionClient(userId);
    
    if (isLocked) {
      return NextResponse.json({ 
        error: 'Session is currently busy or in cooldown. Please wait a moment.' 
      }, { status: 429 });
    }

    const scraper = new ScraperService(client, userId);
    const { dashboardUrl } = await scraper.fetchDashboard();

    if (isNew) {
      if ((consecutiveFailures || 0) >= 3) {
        return NextResponse.json({ error: 'Too many failed login attempts. Please try manual login.' }, { status: 401 });
      }

      debugLog += `Ghost Session New: Performing login...\n`;
      const { acquireRefreshLock, saveSession } = await import('@/lib/session-proxy');
      await acquireRefreshLock(userId);
      
      const loginRes = await scraper.forceLogin(password);
      const hasLoginButton = loginRes.$('input[name="obtnLogin"], #obtnLogin, input[value="LOGIN"]').length > 0;
      
      await saveSession(userId, jar, !hasLoginButton);
      
      if (hasLoginButton) {
        return NextResponse.json({ error: 'Portal session expired and auto-login failed.' }, { status: 401 });
      }
    } else {
      debugLog += `Ghost Session Active: Bypassing login handshake.\n`;
    }

    debugLog += `Step 3: Fetching Report Card: ${href}\n`;
    const { $: $rc, data: rcHtml } = await scraper.fetchReportCard(href, dashboardUrl);
    
    // Use the central parser from ScraperService
    const subjects = await scraper.parseReportCard($rc, rcHtml);

    try {
      if (subjects && subjects.length > 0) {
        let reportName = body.reportName || 'Unknown Report';
        if (reportName === 'Unknown Report' && href.includes('_nm=')) {
          const match = href.match(/_nm=([^&]+)/);
          if (match) {
            reportName = decodeURIComponent(match[1].replace(/\+/g, ' '));
          }
        }

        let reportSlug = undefined;
        if (reportName === 'Unknown Report') {
          const hash = href.split('').reduce((a: number, b: string) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
          reportSlug = `unknown_${Math.abs(hash)}`;
        }
        
        const syncer = new SyncService(userId);
        await syncer.syncGrades(reportName, subjects, reportSlug);
      }
    } catch (dbError) {
      console.error('Database sync error (grades):', dbError);
    }

    return NextResponse.json({ 
      success: true, 
      subjects,
      raw_snippet: debugLog
    });
  } catch (error: any) {
    console.error('Grades fetch error:', error.message);
    return NextResponse.json({ success: false, error: error.message, raw_snippet: debugLog });
  }
}
