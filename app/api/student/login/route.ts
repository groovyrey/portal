import { NextRequest, NextResponse } from 'next/server';
import qs from 'querystring';
import * as cheerio from 'cheerio';
import { encrypt } from '@/lib/auth';
import { parseStudentName } from '@/lib/utils';
import { getSessionClient, saveSession } from '@/lib/session-proxy';
import { ScraperService } from '@/lib/scraper-service';
import { SyncService } from '@/lib/sync-service';
import { logActivity } from '@/lib/activity-service';

import { decrypt } from '@/lib/auth';

export async function POST(req: NextRequest) {
  let { userId, password } = await req.json().catch(() => ({}));
  
  try {
    // If credentials are not in the body, try to get them from the session cookie
    if (!userId || !password) {
      const sessionCookie = req.cookies.get('session_token');
      if (sessionCookie?.value) {
        try {
          const decrypted = decrypt(sessionCookie.value);
          const sessionData = JSON.parse(decrypted);
          userId = sessionData.userId;
          password = sessionData.password;
        } catch (e) {
          return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 });
        }
      }
    }

    if (!userId || !password) {
      return NextResponse.json({ error: 'UserID and Password are required' }, { status: 400 });
    }

    // --- SESSION MANAGEMENT ---
    const { client, jar, isNew, isLocked, consecutiveFailures } = await getSessionClient(userId);

    // Stop if account is in cooldown to prevent further lockout risk
    if (isLocked && (consecutiveFailures || 0) >= 3) {
      return NextResponse.json({ 
        success: false, 
        error: `Login is temporarily disabled due to multiple failed attempts. Please wait 15-30 minutes and try again.` 
      }, { status: 429 });
    }

    const baseUrl = `https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${userId}`;
    let loginRes;

    if (!isNew && !isLocked) {
      loginRes = await client.get(baseUrl);
    } else {
      // Acquire refresh lock to ensure no other process (like background sync) tries to log in simultaneously
      await import('@/lib/session-proxy').then(m => m.acquireRefreshLock(userId));

      const initRes = await client.get(baseUrl);
      const finalInitUrl = initRes.request.res.responseUrl || baseUrl;
      const $init = cheerio.load(initRes.data);

      const formData: any = {};
      $init('input[type="hidden"]').each((_, el) => {
        const name = $init(el).attr('name');
        if (name) formData[name] = $init(el).val() || '';
      });

      formData.otbUserID = userId;
      formData.otbPassword = password;
      formData.obtnLogin = 'LOGIN';

      let loginForm = $init('#Login');
      if (loginForm.length === 0) loginForm = $init('form').first();
      
      const loginAction = loginForm.attr('action') || './LCC.Login.aspx';
      const loginUrl = new URL(loginAction, finalInitUrl).toString();

      loginRes = await client.post(loginUrl, qs.stringify(formData), {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': finalInitUrl,
          'Origin': 'https://premium.schoolista.com'
        },
      });

      const $dashboard = cheerio.load(loginRes.data);
      const hasLoginButton = $dashboard('input[name="obtnLogin"], #obtnLogin, input[value="LOGIN"]').length > 0;
      
      // Save session with success/failure status
      await saveSession(userId, jar, !hasLoginButton);
      
      if (hasLoginButton) {
        const portalError = 
          $dashboard('#lblError').text().trim() || 
          $dashboard('#lblMessage').text().trim() || 
          $dashboard('.error-message').text().trim() ||
          $dashboard('.text-danger').text().trim();
        
        return NextResponse.json({ 
          success: false, 
          error: portalError || 'Invalid Student ID or Password.' 
        }, { status: 401 });
      }
    }

    const $dashboard = cheerio.load(loginRes.data);
    const scraper = new ScraperService(client, userId);
    const syncer = new SyncService(userId);

    // --- CHECK LOGIN SUCCESS ---
    const hasLoginButton = $dashboard('input[name="obtnLogin"], #obtnLogin, input[value="LOGIN"]').length > 0;
    if (hasLoginButton) {
      const portalError = 
        $dashboard('#lblError').text().trim() || 
        $dashboard('#lblMessage').text().trim() || 
        $dashboard('.error-message').text().trim() ||
        $dashboard('.text-danger').text().trim();
      
      return NextResponse.json({ 
        success: false, 
        error: portalError || 'Invalid Student ID or Password.' 
      }, { status: 401 });
    }

    // --- SCRAPING & SYNC ---
    const { periodCode, dashboardUrl } = await scraper.fetchDashboard();
    
    // Centralized Sync Logic
    const syncResult = await syncer.performFullSync(scraper, $dashboard, periodCode, dashboardUrl);

    // Log successful login
    logActivity(userId, 'Login', 'Logged into student portal').catch(e => {});

    if (syncResult.studentInfo.name && syncResult.studentInfo.name.length > 2) {
      const encryptedSession = encrypt(JSON.stringify({ userId, password }));
      const response = NextResponse.json({
        success: true,
        isNewUser: syncResult.isNewUser,
        data: { 
          ...syncResult.studentInfo,
          parsedName: parseStudentName(syncResult.studentInfo.name),
          id: userId, 
          schedule: syncResult.schedule,
          offeredSubjects: syncResult.offeredSubjects,
          availableReports: syncResult.reportLinks,
          settings: syncResult.settings,
          badges: syncResult.badges,
          financials: syncResult.mergedFinancials,
          // Diagnostic raw data (if still needed)
          _debug_accounts_html: "Synced via centralized service"
        }
      });

      const isProd = process.env.NODE_ENV === 'production';
      response.cookies.set('session_token', encryptedSession, {
        httpOnly: true,
        secure: isProd && !req.nextUrl.hostname.includes('localhost'),
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ 
      success: false, 
      error: `Logged in, but could not find student info.` 
    }, { status: 500 });

  } catch (error: any) {
    console.error('Login error:', error.message);
    return NextResponse.json({ success: false, error: 'The school server did not respond correctly.' }, { status: 500 });
  }
}
