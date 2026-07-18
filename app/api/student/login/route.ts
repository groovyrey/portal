import { NextRequest, NextResponse } from 'next/server';
import qs from 'querystring';
import * as cheerio from 'cheerio';
import { encrypt, decrypt } from '@/lib/auth';
import { parseStudentName } from '@/lib/utils';
import { getSessionClient, saveSession } from '@/lib/session-proxy';
import { ScraperService } from '@/lib/scraper-service';
import { SyncService } from '@/lib/sync-service';
import { logActivity } from '@/lib/activity-service';
import { initDatabase } from '@/lib/db-init';
import { ApiResponse } from '@/lib/api-response';
import { LoginSchema } from '@/lib/schemas';
import { logger } from '@/lib/logger';
import { getStudentSchedule } from '@/lib/data-service';

/**
 * Helper to perform the actual login POST to the school portal.
 */
async function performPortalLogin(client: any, jar: any, userId: string, password: string, baseUrl: string) {
  // Acquire refresh lock to ensure no other process (like background sync) tries to log in simultaneously
  await import('@/lib/session-proxy').then(m => m.acquireRefreshLock(userId));

  const initRes = await client.get(baseUrl);
  const finalInitUrl = initRes.request.res.responseUrl || baseUrl;
  const $init = cheerio.load(initRes.data);

  const formData: any = {};
  $init('input[type="hidden"]').each((_, el: any) => {
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

  const loginRes = await client.post(loginUrl, qs.stringify(formData), {
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

  return loginRes;
}

export async function POST(req: NextRequest) {
  // Ensure database is initialized
  await initDatabase().catch(e => logger.error('[LoginAPI]', 'DB Init failed', { error: String(e) }));

  try {
    const body = await req.json().catch(() => ({}));
    const sessionCookie = req.cookies.get('session_token');
    const hasLoginCredentials = typeof body.userId === 'string' || typeof body.password === 'string';
    let userId: string;
    let password: string;

    if (hasLoginCredentials) {
      const validation = LoginSchema.safeParse(body);
      if (!validation.success) {
        return ApiResponse.validation(validation.error);
      }

      userId = validation.data.userId;
      password = validation.data.password;
    } else if (sessionCookie?.value) {
      try {
        const decrypted = decrypt(sessionCookie.value);
        const sessionData = JSON.parse(decrypted);
        userId = sessionData.userId;
        password = sessionData.password;
      } catch (error) {
        return ApiResponse.unauthorized('Invalid session');
      }
    } else {
      return ApiResponse.validation({
        userId: ['Student ID is required'],
        password: ['Password is required'],
      });
    }

    // --- INITIAL PASSWORD SECURITY CHECK ---
    // If Student ID and Password are identical, the portal will force a change.
    if (userId.trim().toLowerCase() === password.trim().toLowerCase()) {
      return ApiResponse.error(
        'Security update required: You are still using your default portal password. Please update it on the official portal first.',
        403,
        'PASSWORD_CHANGE_REQUIRED'
      );
    }

    // --- SESSION MANAGEMENT ---
    const { client, jar, isNew, isLocked, consecutiveFailures } = await getSessionClient(userId);

    // Stop if account is in cooldown to prevent further lockout risk
    if (isLocked && (consecutiveFailures || 0) >= 3) {
      return ApiResponse.rateLimited(
        'Login is temporarily disabled due to multiple failed attempts. Please wait 15-30 minutes and try again.'
      );
    }

    const baseUrl = `https://premium.schoolista.com/LCC/Student/Main.aspx?_sid=${userId}`;
    let loginRes;
    let $dashboard;

    // --- SESSION EXECUTION ---
    if (!isNew && !isLocked) {
      loginRes = await client.get(baseUrl);
      $dashboard = cheerio.load(loginRes.data);
      
      // If we got the login page instead of the dashboard, our "trusted" session is actually stale
      const isStale = $dashboard('input[name="obtnLogin"], #obtnLogin, input[value="LOGIN"]').length > 0;
      if (isStale) {
        console.log(`[Login] Session for ${userId} is stale, attempting re-login...`);
        loginRes = await performPortalLogin(client, jar, userId, password, baseUrl);
        $dashboard = cheerio.load(loginRes.data);
      }
    } else {
      loginRes = await performPortalLogin(client, jar, userId, password, baseUrl);
      $dashboard = cheerio.load(loginRes.data);
    }

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
    const syncResult = await syncer.performFullSync(scraper, $dashboard, periodCode, dashboardUrl, loginRes.data);

    // Log successful login
    logActivity(userId, 'Login', 'Logged into student portal').catch(e => {});

    if (syncResult.studentInfo.name && syncResult.studentInfo.name.length > 2) {
      const persistedSchedule = await getStudentSchedule(userId);
      const encryptedSession = encrypt(JSON.stringify({ userId, password }));
      const response = NextResponse.json({
        success: true,
        isNewUser: syncResult.isNewUser,
        data: { 
          ...syncResult.studentInfo,
          parsedName: parseStudentName(syncResult.studentInfo.name),
          id: userId, 
          schedule: persistedSchedule,
          offeredSubjects: [], // DISABLED
          availableReports: syncResult.reportLinks,
          settings: syncResult.settings,
          badges: syncResult.badges,
          financials: syncResult.mergedFinancials,
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
      
      // Add a non-httpOnly cookie as a UI indicator that a session is active
      response.cookies.set('portal_session_active', '1', {
        httpOnly: false,
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
