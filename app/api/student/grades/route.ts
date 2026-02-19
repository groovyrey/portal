import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initDatabase } from '@/lib/db-init';
import { decrypt } from '@/lib/auth';
import { getSessionClient, saveSession } from '@/lib/session-proxy';
import { ScraperService } from '@/lib/scraper-service';

export async function POST(req: NextRequest) {
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

    await initDatabase();

    const { client, jar, isNew } = await getSessionClient(userId);
    const scraper = new ScraperService(client, userId);
    const { dashboardUrl } = await scraper.fetchDashboard();

    if (isNew) {
      debugLog += `Ghost Session New: Performing login...\n`;
      await scraper.forceLogin(password);
      await saveSession(userId, jar);
    } else {
      debugLog += `Ghost Session Active: Bypassing login handshake.\n`;
    }

    debugLog += `Step 3: Fetching Report Card: ${href}\n`;
    const { $: $rc } = await scraper.fetchReportCard(href, dashboardUrl);
    
    // Use the central parser from ScraperService
    const subjects = scraper.parseReportCard($rc);

    try {
      if (subjects && subjects.length > 0) {
        let reportName = body.reportName || 'Unknown Report';
        if (reportName === 'Unknown Report' && href.includes('_nm=')) {
          const match = href.match(/_nm=([^&]+)/);
          if (match) {
            reportName = decodeURIComponent(match[1].replace(/\+/g, ' '));
          }
        }

        let reportSlug = reportName.replace(/[^a-zA-Z0-9]/g, '_');
        if (reportName === 'Unknown Report') {
          const hash = href.split('').reduce((a: number, b: string) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
          reportSlug = `unknown_${Math.abs(hash)}`;
        }
        
        const reportId = `${userId}_${reportSlug}`;
        const gradeRef = doc(db, 'grades', reportId);
        
        await setDoc(gradeRef, {
          student_id: userId,
          report_name: reportName,
          items: subjects,
          updated_at: serverTimestamp()
        });
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
